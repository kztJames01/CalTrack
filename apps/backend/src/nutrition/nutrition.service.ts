import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import {
  NutritionixFood,
  NutritionixSearchResponse,
  NutritionixNutrientsResponse,
  VisionLabel,
  FoodDetectionResult,
  LocalizedObjectBox,
} from './interfaces/nutrition.interface';
import { MlTrainingExportService } from './ml-training-export.service';
import { UsdaService } from './usda.service';

type VisionAnnotateResponse = {
  labelAnnotations?: Array<{ description?: string | null; score?: number | null }>;
  localizedObjectAnnotations?: Array<{
    name?: string | null;
    score?: number | null;
    boundingPoly?: { normalizedVertices?: Array<{ x?: number | null; y?: number | null }> };
  }>;
};

@Injectable()
export class NutritionService {
  private readonly logger = new Logger(NutritionService.name);
  private readonly nutritionixBaseUrl = 'https://trackapi.nutritionix.com/v2';
  private readonly cacheKeyPrefix = 'nutrition:';
  private readonly cacheTTL = 60 * 60 * 24; // 24 hours
  private visionClient?: ImageAnnotatorClient;
  private visionApiKey?: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectRedis() private readonly redis: Redis,
    private readonly mlTrainingExport: MlTrainingExportService,
    private readonly usdaService: UsdaService,
  ) {
    const credentialsPath = this.configService.get<string>('googleCloud.credentials');
    if (credentialsPath) {
      this.visionClient = new ImageAnnotatorClient({
        keyFilename: credentialsPath,
      });
    }
    this.visionApiKey = this.configService.get<string>('googleCloud.visionApiKey');
  }

  mapFoodsForClient(foods: NutritionixFood[]) {
    return foods.map((f) => ({
      foodName: f.food_name,
      confidence: 1,
      servingSize: f.serving_qty,
      servingUnit: f.serving_unit,
      calories: f.nf_calories,
      protein: f.nf_protein,
      carbs: f.nf_total_carbohydrate,
      fat: f.nf_total_fat,
    }));
  }

  private shouldUseUsda(): boolean {
    const provider = this.configService.get<string>('nutrition.provider') || 'auto';
    if (provider === 'nutritionix') return false;
    if (provider === 'usda') return true;
    return this.usdaService.isConfigured();
  }

  async searchFood(query: string, limit: number = 10): Promise<NutritionixFood[]> {
    const cacheKey = `${this.cacheKeyPrefix}search:${query}:${limit}`;

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for search: ${query}`);
      return JSON.parse(cached);
    }

    if (this.shouldUseUsda()) {
      try {
        const foods = await this.usdaService.searchFood(query, limit);
        await this.redis.set(cacheKey, JSON.stringify(foods), 'EX', this.cacheTTL);
        return foods;
      } catch (error) {
        this.logger.warn(`USDA search failed, trying Nutritionix: ${error}`);
        if (this.configService.get<string>('nutrition.provider') === 'usda') {
          throw new HttpException('Failed to search for food (USDA)', HttpStatus.INTERNAL_SERVER_ERROR);
        }
      }
    }

    try {
      const response = await this.nutritionixRequest<NutritionixSearchResponse>(
        '/search/instant',
        {
          method: 'GET',
          params: { query },
        },
      );

      const foods = [
        ...response.common.slice(0, limit / 2),
        ...response.branded.slice(0, limit / 2),
      ].slice(0, limit);

      // Cache results
      await this.redis.set(cacheKey, JSON.stringify(foods), 'EX', this.cacheTTL);

      return foods;
    } catch (error) {
      this.logger.error(`Nutritionix search error: ${error}`);
      throw new HttpException(
        'Failed to search for food',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getFoodByBarcode(barcode: string): Promise<NutritionixFood> {
    const cacheKey = `${this.cacheKeyPrefix}barcode:${barcode}`;

    // Check cache
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for barcode: ${barcode}`);
      return JSON.parse(cached);
    }

    try {
      const response = await this.nutritionixRequest<{ foods: NutritionixFood[] }>(
        '/search/item',
        {
          method: 'GET',
          params: { upc: barcode },
        },
      );

      if (!response.foods || response.foods.length === 0) {
        throw new HttpException('Food not found', HttpStatus.NOT_FOUND);
      }

      const food = response.foods[0];

      // Cache result
      await this.redis.set(cacheKey, JSON.stringify(food), 'EX', this.cacheTTL);

      return food;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Nutritionix barcode error: ${error}`);
      throw new HttpException(
        'Failed to get food by barcode',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getNutritionDetails(foodName: string): Promise<NutritionixFood> {
    const cacheKey = `${this.cacheKeyPrefix}details:${foodName}`;

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for details: ${foodName}`);
      return JSON.parse(cached);
    }

    if (this.shouldUseUsda()) {
      const usdaFood = await this.usdaService.getNutritionDetails(foodName);
      if (usdaFood) {
        await this.redis.set(cacheKey, JSON.stringify(usdaFood), 'EX', this.cacheTTL);
        return usdaFood;
      }
      if (this.configService.get<string>('nutrition.provider') === 'usda') {
        throw new HttpException('Food not found in USDA database', HttpStatus.NOT_FOUND);
      }
    }

    try {
      const response = await this.nutritionixRequest<NutritionixNutrientsResponse>(
        '/natural/nutrients',
        {
          method: 'POST',
          body: { query: foodName },
        },
      );

      if (!response.foods || response.foods.length === 0) {
        throw new HttpException('Food not found', HttpStatus.NOT_FOUND);
      }

      const food = response.foods[0];

      // Cache result
      await this.redis.set(cacheKey, JSON.stringify(food), 'EX', this.cacheTTL);

      return food;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Nutritionix details error: ${error}`);
      throw new HttpException(
        'Failed to get nutrition details',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  getIntegrationsStatus() {
    const nutritionixAppId = this.configService.get<string>('nutritionix.appId');
    const nutritionixApiKey = this.configService.get<string>('nutritionix.apiKey');
    const credentialsPath = this.configService.get<string>('googleCloud.credentials');
    const b2Bucket = this.configService.get<string>('b2.bucket');
    const awsBucket = this.configService.get<string>('aws.s3.bucket');

    let visionCredentialsFileExists = false;
    if (credentialsPath) {
      try {
        const fs = require('fs') as typeof import('fs');
        visionCredentialsFileExists = fs.existsSync(credentialsPath);
      } catch {
        visionCredentialsFileExists = false;
      }
    }

    const visionReady = Boolean(this.visionClient || this.visionApiKey);

    return {
      nutritionProvider: this.configService.get<string>('nutrition.provider') || 'auto',
      usda: {
        configured: this.usdaService.isConfigured(),
        endpoints: ['GET /nutrition/search', 'GET /nutrition/details/:foodName'],
      },
      nutritionix: {
        configured: Boolean(nutritionixAppId && nutritionixApiKey),
        endpoints: ['GET /nutrition/search', 'GET /nutrition/barcode/:upc', 'GET /nutrition/details/:foodName'],
      },
      googleVision: {
        configured: visionReady,
        serviceAccount: Boolean(this.visionClient),
        apiKey: Boolean(this.visionApiKey),
        credentialsPathSet: Boolean(credentialsPath),
        credentialsFileExists: visionCredentialsFileExists,
        endpoints: ['POST /nutrition/analyze-photo'],
      },
      photoStorage: {
        b2Configured: Boolean(b2Bucket),
        awsConfigured: Boolean(awsBucket),
        uploadEndpoints: ['POST /upload/food-photo', 'POST /upload/photo'],
      },
      ml: {
        photoPrimary: this.configService.get<string>('ml.photoPrimary'),
        photoFallback: this.configService.get<string>('ml.photoFallback'),
      },
    };
  }

  toAnalyzePhotoApiBody(result: FoodDetectionResult) {
    const detectedFoods = result.topFoods
      .filter((f) => f.nutrition)
      .map((tf) => ({
        foodName: tf.name,
        confidence: tf.confidence,
        servingSize: tf.nutrition!.serving_qty,
        servingUnit: tf.nutrition!.serving_unit,
        calories: tf.nutrition!.nf_calories,
        protein: tf.nutrition!.nf_protein,
        carbs: tf.nutrition!.nf_total_carbohydrate,
        fat: tf.nutrition!.nf_total_fat,
      }));
    return {
      detectedFoods,
      labels: result.labels,
      localizedObjects: result.localizedObjects,
      topFoods: result.topFoods,
      detectionSource: result.detectionSource,
    };
  }

  async analyzeFoodPhoto(imageUrl: string): Promise<FoodDetectionResult> {
    const primary = this.configService.get<string>('ml.photoPrimary') || 'google_vision';
    const fallback = this.configService.get<string>('ml.photoFallback') || 'google_vision';

    if (primary === 'on_device') {
      const onDev = await this.tryOnDeviceFoodDetect(imageUrl);
      if (onDev) {
        return onDev;
      }
      if (fallback === 'google_vision') {
        return this.analyzeWithGoogleVision(imageUrl);
      }
      throw new HttpException(
        'On-device food model not wired yet',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const fromVision = await this.analyzeWithGoogleVision(imageUrl);
    if (fallback === 'on_device' && fromVision.topFoods.length === 0) {
      const onDev = await this.tryOnDeviceFoodDetect(imageUrl);
      if (onDev) {
        return onDev;
      }
    }
    return fromVision;
  }

  // hook for tflite worker or later; returns null until you plug it in
  private async tryOnDeviceFoodDetect(_imageUrl: string): Promise<FoodDetectionResult | null> {
    return null;
  }

  private verticesToYoloNorm(
    vertices: { x?: number | null; y?: number | null }[],
  ): { cx: number; cy: number; w: number; h: number } {
    const xs = vertices.map((v) => v.x ?? 0).filter((x) => x >= 0);
    const ys = vertices.map((v) => v.y ?? 0).filter((y) => y >= 0);
    if (xs.length === 0 || ys.length === 0) {
      return { cx: 0, cy: 0, w: 0, h: 0 };
    }
    const xmin = Math.min(...xs);
    const xmax = Math.max(...xs);
    const ymin = Math.min(...ys);
    const ymax = Math.max(...ys);
    const w = Math.max(0, xmax - xmin);
    const h = Math.max(0, ymax - ymin);
    return { cx: xmin + w / 2, cy: ymin + h / 2, w, h };
  }

  private async analyzeWithGoogleVision(imageUrl: string): Promise<FoodDetectionResult> {
    if (!this.visionClient && !this.visionApiKey) {
      throw new HttpException(
        'Vision API not configured (set GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_CLOUD_VISION_API_KEY)',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const cacheKey = `${this.cacheKeyPrefix}photo:v4:${imageUrl}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for photo analysis: ${imageUrl}`);
      return JSON.parse(cached) as FoodDetectionResult;
    }

    try {
      const annotate = await this.runVisionAnnotate(imageUrl);
      const labelRows = annotate.labelAnnotations || [];
      const visionLabels: VisionLabel[] = labelRows
        .filter((label) => label.description && label.score != null)
        .map((label) => ({
          description: label.description!,
          score: label.score!,
        }));

      const localizedRaw = annotate.localizedObjectAnnotations || [];
      const localizedObjects: LocalizedObjectBox[] = localizedRaw
        .filter((lo) => lo.name && lo.score != null)
        .map((lo) => {
          const verts = lo.boundingPoly?.normalizedVertices || [];
          const yoloNormBox = this.verticesToYoloNorm(verts);
          return {
            name: lo.name!,
            score: lo.score!,
            yoloNormBox,
          };
        })
        .filter((o) => o.yoloNormBox.w > 0.01 && o.yoloNormBox.h > 0.01);

      const foodLabels = visionLabels
        .filter((label) => label.score > 0.7)
        .filter((label) => this.isFoodRelated(label.description))
        .slice(0, 5);

      const topFoods = await Promise.all(
        foodLabels.slice(0, 3).map(async (label) => {
          try {
            const nutrition = await this.getNutritionDetails(label.description);
            return {
              name: label.description,
              confidence: label.score,
              nutrition,
            };
          } catch {
            this.logger.warn(`Could not get nutrition for ${label.description}`);
            return {
              name: label.description,
              confidence: label.score,
              nutrition: null,
            };
          }
        }),
      );

      const detectionResult: FoodDetectionResult = {
        labels: visionLabels,
        localizedObjects,
        topFoods: topFoods.filter((f) => f.nutrition !== null) as FoodDetectionResult['topFoods'],
        detectionSource: 'google_vision',
      };

      this.mlTrainingExport.queueExport({
        imageUrl,
        capturedAt: new Date().toISOString(),
        source: 'google_vision',
        labels: visionLabels.map((l) => ({ description: l.description, score: l.score })),
        localizedObjects: localizedObjects.map((o) => ({
          name: o.name,
          score: o.score,
          yoloNormBox: o.yoloNormBox,
        })),
      });

      await this.redis.set(cacheKey, JSON.stringify(detectionResult), 'EX', this.cacheTTL);
      return detectionResult;
    } catch (error) {
      this.logger.error(`Vision API error: ${error}`);
      throw new HttpException(
        'Failed to analyze photo',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async runVisionAnnotate(imageUrl: string): Promise<VisionAnnotateResponse> {
    const features = [
      { type: 'LABEL_DETECTION', maxResults: 30 },
      { type: 'OBJECT_LOCALIZATION', maxResults: 20 },
    ];

    if (this.visionClient) {
      try {
        const [annotate] = await this.visionClient.annotateImage({
          image: { source: { imageUri: imageUrl } },
          features,
        });
        return annotate as VisionAnnotateResponse;
      } catch (err) {
        this.logger.warn(`Vision imageUri failed, retrying with downloaded bytes: ${err}`);
      }
    }

    const base64 = (await this.fetchImageBuffer(imageUrl)).toString('base64');

    if (this.visionClient) {
      const [annotate] = await this.visionClient.annotateImage({
        image: { content: base64 },
        features,
      });
      return annotate as VisionAnnotateResponse;
    }

    const apiKey = this.visionApiKey!;
    const res = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{ image: { content: base64 }, features }],
        }),
      },
    );

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Vision REST failed (${res.status}): ${body}`);
    }

    const json = (await res.json()) as { responses?: VisionAnnotateResponse[] };
    return json.responses?.[0] || {};
  }

  private async fetchImageBuffer(imageUrl: string): Promise<Buffer> {
    const res = await fetch(imageUrl);
    if (!res.ok) {
      throw new Error(`Could not fetch image (${res.status})`);
    }
    const ab = await res.arrayBuffer();
    return Buffer.from(ab);
  }

  private getNutritionixHeaders() {
    const appId = this.configService.get<string>('nutritionix.appId');
    const apiKey = this.configService.get<string>('nutritionix.apiKey');
    if (!appId || !apiKey) {
      throw new HttpException(
        'Nutritionix API credentials are not configured',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    return {
      'x-app-id': appId,
      'x-app-key': apiKey,
      'Content-Type': 'application/json',
    };
  }

  private async nutritionixRequest<T>(
    path: string,
    options: {
      method: 'GET' | 'POST';
      params?: Record<string, string | number>;
      body?: unknown;
    },
  ): Promise<T> {
    const url = new URL(`${this.nutritionixBaseUrl}${path}`);
    if (options.params) {
      for (const [key, value] of Object.entries(options.params)) {
        url.searchParams.set(key, String(value));
      }
    }

    const response = await fetch(url.toString(), {
      method: options.method,
      headers: this.getNutritionixHeaders(),
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Nutritionix request failed (${response.status}): ${errorBody}`);
    }

    return (await response.json()) as T;
  }

  private isFoodRelated(label: string): boolean {
    const foodKeywords = [
      'food',
      'dish',
      'cuisine',
      'meal',
      'breakfast',
      'lunch',
      'dinner',
      'snack',
      'vegetable',
      'fruit',
      'meat',
      'fish',
      'chicken',
      'beef',
      'pork',
      'rice',
      'pasta',
      'bread',
      'cheese',
      'salad',
      'soup',
      'sandwich',
      'burger',
      'pizza',
      'dessert',
      'drink',
      'beverage',
    ];

    const lowerLabel = label.toLowerCase();
    return foodKeywords.some((keyword) => lowerLabel.includes(keyword));
  }
}
