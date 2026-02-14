import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MealsService } from './meals.service';
import { CreateMealDto, UpdateMealDto, QueryMealsDto } from './dto/meal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('meals')
@UseGuards(JwtAuthGuard)
export class MealsController {
  constructor(private readonly mealsService: MealsService) {}

  @Post()
  create(@Request() req, @Body() createMealDto: CreateMealDto) {
    return this.mealsService.create(req.user.id, createMealDto);
  }

  @Get()
  findAll(@Request() req, @Query() query: QueryMealsDto) {
    return this.mealsService.findAll(req.user.id, query);
  }

  @Get('daily-totals')
  getDailyTotals(@Request() req, @Query('date') date: string) {
    return this.mealsService.getDailyTotals(req.user.id, date);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.mealsService.findOne(req.user.id, id);
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateMealDto: UpdateMealDto,
  ) {
    return this.mealsService.update(req.user.id, id, updateMealDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.mealsService.remove(req.user.id, id);
  }
}
