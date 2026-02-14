export interface NutritionixFood {
  food_name: string;
  brand_name?: string;
  serving_qty: number;
  serving_unit: string;
  serving_weight_grams?: number;
  nf_calories: number;
  nf_total_fat: number;
  nf_saturated_fat?: number;
  nf_cholesterol?: number;
  nf_sodium?: number;
  nf_total_carbohydrate: number;
  nf_dietary_fiber?: number;
  nf_sugars?: number;
  nf_protein: number;
  nf_potassium?: number;
  photo?: {
    thumb: string;
  };
}

export interface NutritionixSearchResponse {
  common: NutritionixFood[];
  branded: NutritionixFood[];
}

export interface NutritionixNutrientsResponse {
  foods: NutritionixFood[];
}

export interface VisionLabel {
  description: string;
  score: number;
}

export interface FoodDetectionResult {
  labels: VisionLabel[];
  topFoods: Array<{
    name: string;
    confidence: number;
    nutrition?: NutritionixFood;
  }>;
}
