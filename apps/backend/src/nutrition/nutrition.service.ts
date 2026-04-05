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
} from './interfaces/nutrition.interface';

@Injectable()
export class NutritionService {
  private readonly logger = new Logger(NutritionService.name);
  private readonly nutritionixBaseUrl = 'https://trackapi.nutritionix.com/v2';
  private readonly cacheKeyPrefix = 'nutrition:';
  private readonly cacheTTL = 60 * 60 * 24; // 24 hours
  private visionClient?: ImageAnnotatorClient;

  constructor(
    private readonly configService: ConfigService,
    @InjectRedis() private readonly redis: Redis,
  ) {
    // Initialize Google Cloud Vision only if credentials are provided
    const credentialsPath = this.configService.get<string>('googleCloud.credentials');
    if (credentialsPath) {
      this.visionClient = new ImageAnnotatorClient({
        keyFilename: credentialsPath,
      });
    }
  }

  async searchFood(query: string, limit: number = 10): Promise<NutritionixFood[]> {
    const cacheKey = `${this.cacheKeyPrefix}search:${query}:${limit}`;

    // Check cache
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for search: ${query}`);
      return JSON.parse(cached);
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

    // Check cache
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for details: ${foodName}`);
      return JSON.parse(cached);
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

  async analyzeFoodPhoto(imageUrl: string): Promise<FoodDetectionResult> {
    if (!this.visionClient) {
      throw new HttpException(
        'Vision API not configured',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const cacheKey = `${this.cacheKeyPrefix}photo:${imageUrl}`;

    // Check cache
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for photo analysis: ${imageUrl}`);
      return JSON.parse(cached);
    }

    try {
      // Detect labels in the image
      const [result] = await this.visionClient.labelDetection(imageUrl);
      const labels = result.labelAnnotations || [];

      const visionLabels: VisionLabel[] = labels
        .filter((label) => label.description && label.score !== null && label.score !== undefined)
        .map((label) => ({
          description: label.description!,
          score: label.score!,
        }));

      // Filter food-related labels (score > 0.7)
      const foodLabels = visionLabels
        .filter((label) => label.score > 0.7)
        .filter((label) => this.isFoodRelated(label.description))
        .slice(0, 5);

      // Get nutrition data for top detected foods
      const topFoods = await Promise.all(
        foodLabels.slice(0, 3).map(async (label) => {
          try {
            const nutrition = await this.getNutritionDetails(label.description);
            return {
              name: label.description,
              confidence: label.score,
              nutrition,
            };
          } catch (error) {
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
        topFoods: topFoods.filter((f) => f.nutrition !== null),
      };

      // Cache result
      await this.redis.set(
        cacheKey,
        JSON.stringify(detectionResult),
        'EX',
        this.cacheTTL,
      );

      return detectionResult;
    } catch (error) {
      this.logger.error(`Vision API error: ${error}`);
      throw new HttpException(
        'Failed to analyze photo',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
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
