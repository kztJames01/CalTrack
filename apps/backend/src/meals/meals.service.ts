import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Meal, FoodItem } from '../database/entities';
import { CreateMealDto, UpdateMealDto, QueryMealsDto } from './dto/meal.dto';

@Injectable()
export class MealsService {
  constructor(
    @InjectRepository(Meal)
    private mealRepository: Repository<Meal>,
    @InjectRepository(FoodItem)
    private foodItemRepository: Repository<FoodItem>,
  ) {}

  async create(userId: string, createMealDto: CreateMealDto): Promise<Meal> {
    const { foodItems, ...mealData } = createMealDto;

    // Calculate totals
    const totals = this.calculateTotals(foodItems);

    const meal = this.mealRepository.create({
      ...mealData,
      userId,
      eatenAt: new Date(createMealDto.eatenAt),
      ...totals,
    });

    const savedMeal = await this.mealRepository.save(meal);

    // Create food items
    const foodItemEntities = foodItems.map((item) =>
      this.foodItemRepository.create({
        ...item,
        mealId: savedMeal.id,
      }),
    );

    await this.foodItemRepository.save(foodItemEntities);

    // Return meal with food items
    return this.findOne(userId, savedMeal.id);
  }

  async findAll(userId: string, query: QueryMealsDto) {
    const { startDate, endDate, type, page = 1, limit = 20 } = query;

    const queryBuilder = this.mealRepository
      .createQueryBuilder('meal')
      .leftJoinAndSelect('meal.foodItems', 'foodItems')
      .where('meal.userId = :userId', { userId })
      .orderBy('meal.eatenAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (startDate && endDate) {
      queryBuilder.andWhere('meal.eatenAt BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
    } else if (startDate) {
      queryBuilder.andWhere('meal.eatenAt >= :startDate', {
        startDate: new Date(startDate),
      });
    } else if (endDate) {
      queryBuilder.andWhere('meal.eatenAt <= :endDate', {
        endDate: new Date(endDate),
      });
    }

    if (type) {
      queryBuilder.andWhere('meal.type = :type', { type });
    }

    const [meals, total] = await queryBuilder.getManyAndCount();

    return {
      meals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(userId: string, id: string): Promise<Meal> {
    const meal = await this.mealRepository.findOne({
      where: { id },
      relations: ['foodItems'],
    });

    if (!meal) {
      throw new NotFoundException('Meal not found');
    }

    if (meal.userId !== userId) {
      throw new ForbiddenException('You do not have access to this meal');
    }

    return meal;
  }

  async update(
    userId: string,
    id: string,
    updateMealDto: UpdateMealDto,
  ): Promise<Meal> {
    const meal = await this.findOne(userId, id);

    const { foodItems, ...mealData } = updateMealDto;

    // Update meal data
    Object.assign(meal, mealData);

    if (updateMealDto.eatenAt) {
      meal.eatenAt = new Date(updateMealDto.eatenAt);
    }

    // If food items are provided, update them
    if (foodItems) {
      // Delete existing food items
      await this.foodItemRepository.delete({ mealId: id });

      // Create new food items
      const foodItemEntities = foodItems.map((item) =>
        this.foodItemRepository.create({
          ...item,
          mealId: id,
        }),
      );

      await this.foodItemRepository.save(foodItemEntities);

      // Recalculate totals
      const totals = this.calculateTotals(foodItems);
      Object.assign(meal, totals);
    }

    await this.mealRepository.save(meal);

    return this.findOne(userId, id);
  }

  async remove(userId: string, id: string): Promise<void> {
    const meal = await this.findOne(userId, id);
    await this.mealRepository.remove(meal);
  }

  async getDailyTotals(userId: string, date: string) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const meals = await this.mealRepository.find({
      where: {
        userId,
        eatenAt: Between(startOfDay, endOfDay),
      },
      relations: ['foodItems'],
    });

    const totals = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      mealCount: meals.length,
    };

    meals.forEach((meal) => {
      totals.calories += Number(meal.totalCalories);
      totals.protein += Number(meal.totalProtein);
      totals.carbs += Number(meal.totalCarbs);
      totals.fat += Number(meal.totalFat);
    });

    return {
      date,
      totals,
      meals: meals.map((meal) => ({
        id: meal.id,
        type: meal.type,
        eatenAt: meal.eatenAt,
        calories: meal.totalCalories,
        protein: meal.totalProtein,
        carbs: meal.totalCarbs,
        fat: meal.totalFat,
      })),
    };
  }

  private calculateTotals(foodItems: any[]) {
    const totals = {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
    };

    foodItems.forEach((item) => {
      const multiplier = item.quantity || 1;
      totals.totalCalories += item.calories * multiplier;
      totals.totalProtein += item.protein * multiplier;
      totals.totalCarbs += item.carbs * multiplier;
      totals.totalFat += item.fat * multiplier;
    });

    return totals;
  }
}
