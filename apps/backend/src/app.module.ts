import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
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
import { CacheModule } from './common/cache/cache.module';

@Module({
  imports: [
    SentryModule.forRoot(),
    CacheModule,
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
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        const entities = [User, UserProfile, UserGoals, Meal, FoodItem];
        const syncOpts = {
          synchronize: process.env.NODE_ENV !== 'production',
          logging: process.env.NODE_ENV === 'development',
        };
        const dbUrl = configService.get<string>('database.url');
        const useSsl = configService.get<boolean>('database.ssl');
        const ssl = useSsl ? { rejectUnauthorized: false } : undefined;

        if (dbUrl) {
          return {
            type: 'postgres',
            url: dbUrl,
            ssl,
            entities,
            ...syncOpts,
          };
        }

        return {
          type: 'postgres',
          host: configService.get<string>('database.host'),
          port: configService.get<number>('database.port'),
          username: configService.get<string>('database.username'),
          password: configService.get<string>('database.password'),
          database: configService.get<string>('database.database'),
          ssl,
          entities,
          ...syncOpts,
        };
      },
      inject: [ConfigService],
    }),
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('redis.url');
        if (redisUrl) {
          return { type: 'single', url: redisUrl };
        }
        const host = configService.get<string>('redis.host');
        const port = configService.get<number>('redis.port');
        const password = configService.get<string>('redis.password');
        const url = password
          ? `redis://:${password}@${host}:${port}`
          : `redis://${host}:${port}`;
        return { type: 'single', url };
      },
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
