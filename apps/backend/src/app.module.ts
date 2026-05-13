import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '@nestjs-modules/ioredis';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { NutritionModule } from './nutrition/nutrition.module';
import { MealsModule } from './meals/meals.module';
import { UploadModule } from './upload/upload.module';
import { SyncModule } from './sync/sync.module';
import configuration from './config/configuration';
import { User, UserProfile, UserGoals, Meal, FoodItem } from './database/entities';
import { Throttle, ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRoot([{ //global rate limiting to reduce DDOS, accidental loops and abuses
      ttl: 60000, //60 sec
      limit: 100, //100 req per min
    }]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: [User, UserProfile, UserGoals, Meal, FoodItem],
        synchronize: process.env.NODE_ENV !== 'production', // Disable in production
        logging: process.env.NODE_ENV === 'development',
      }),
      inject: [ConfigService],
    }),
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'single',
        url: `redis://${configService.get('redis.host')}:${configService.get('redis.port')}`,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    NutritionModule,
    MealsModule,
    UploadModule,
    SyncModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_FILTER, useClass: SentryGlobalFilter },
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
