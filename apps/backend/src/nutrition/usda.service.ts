import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NutritionixFood } from './interfaces/nutrition.interface';

type UsdaSearchResponse = {
  foods?: Array<{
    fdcId: number;
    description: string;
    foodNutrients?: Array<{
      nutrientId?: number;
      nutrientNumber?: string;
      nutrientName?: string;
      value?: number;
      unitName?: string;
    }>;
  }>;
};

@Injectable()
export class UsdaService {
  private readonly logger = new Logger(UsdaService.name);
  private readonly baseUrl = 'https://api.nal.usda.gov/fdc/v1';

  constructor(private readonly configService: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.configService.get<string>('usda.apiKey'));
  }

  async searchFood(query: string, limit = 10): Promise<NutritionixFood[]> {
    const data = await this.usdaGet<UsdaSearchResponse>('/foods/search', {
      query,
      pageSize: String(limit),
    });
    return (data.foods || []).map((f) => this.toNutritionFood(f)).filter(Boolean) as NutritionixFood[];
  }

  async getNutritionDetails(foodName: string): Promise<NutritionixFood | null> {
    const foods = await this.searchFood(foodName, 1);
    return foods[0] || null;
  }

  private toNutritionFood(food: NonNullable<UsdaSearchResponse['foods']>[0]): NutritionixFood | null {
    if (!food?.description) return null;

    const nutrients = food.foodNutrients || [];
    const val = (id: number, namePart: string) => {
      const row = nutrients.find(
        (n) =>
          n.nutrientId === id ||
          (n.nutrientName && n.nutrientName.toLowerCase().includes(namePart)),
      );
      return row?.value ?? 0;
    };

    const calories = val(1008, 'energy');
    const protein = val(1003, 'protein');
    const carbs = val(1005, 'carbohydrate');
    const fat = val(1004, 'fat');

    return {
      food_name: food.description,
      serving_qty: 100,
      serving_unit: 'g',
      serving_weight_grams: 100,
      nf_calories: Math.round(calories * 10) / 10,
      nf_protein: Math.round(protein * 10) / 10,
      nf_total_carbohydrate: Math.round(carbs * 10) / 10,
      nf_total_fat: Math.round(fat * 10) / 10,
    };
  }

  private async usdaGet<T>(path: string, params: Record<string, string>): Promise<T> {
    const apiKey = this.configService.get<string>('usda.apiKey');
    if (!apiKey) {
      throw new Error('USDA_API_KEY is not configured');
    }

    const url = new URL(`${this.baseUrl}${path}`);
    url.searchParams.set('api_key', apiKey);
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }

    const res = await fetch(url.toString());
    if (!res.ok) {
      const body = await res.text();
      this.logger.error(`USDA ${path} failed (${res.status}): ${body}`);
      throw new Error(`USDA request failed (${res.status})`);
    }
    return (await res.json()) as T;
  }
}
