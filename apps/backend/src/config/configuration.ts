export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    url: process.env.DATABASE_URL || '',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'caltrack',
    ssl:
      process.env.DB_SSL === 'true' ||
      (process.env.DATABASE_URL || '').includes('neon.tech') ||
      (process.env.DB_HOST || '').includes('neon.tech'),
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
    url: process.env.REDIS_URL || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-change-in-production',
  },
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      iosClientId:
        process.env.GOOGLE_IOS_CLIENT_ID ||
        process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback',
    },
    apple: {
      clientId: process.env.APPLE_CLIENT_ID,
      teamId: process.env.APPLE_TEAM_ID,
      keyId: process.env.APPLE_KEY_ID,
      privateKey: process.env.APPLE_PRIVATE_KEY,
      redirectUri: process.env.APPLE_REDIRECT_URI || 'http://localhost:3000/api/auth/apple/callback',
    },
  },
  nutrition: {
    provider: process.env.NUTRITION_PROVIDER || 'auto',
  },
  nutritionix: {
    appId: process.env.NUTRITIONIX_APP_ID,
    apiKey: process.env.NUTRITIONIX_API_KEY,
  },
  usda: {
    apiKey: process.env.USDA_API_KEY,
  },
  googleCloud: {
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    visionApiKey: process.env.GOOGLE_CLOUD_VISION_API_KEY,
  },
  b2: {
    endpoint: (process.env.B2_ENDPOINT || '').replace(/^["']|["']$/g, ''),
    keyId: process.env.B2_KEY_ID,
    applicationKey: process.env.B2_APPLICATION_KEY,
    bucket: process.env.B2_BUCKET,
    region: process.env.B2_REGION || 'us-east-005',
    publicBaseUrl: process.env.B2_PUBLIC_BASE_URL || '',
  },
  sentry: {
    dsn: process.env.SENTRY_DSN,
  },
  // dev: ML_PHOTO_PRIMARY=google_vision ML_PHOTO_FALLBACK=on_device (yolo stub -> vision)
  // prod: ML_PHOTO_PRIMARY=on_device ML_PHOTO_FALLBACK=google_vision after you ship tflite
  ml: {
    photoPrimary: process.env.ML_PHOTO_PRIMARY || 'google_vision',
    photoFallback: process.env.ML_PHOTO_FALLBACK || 'google_vision',
    exportTrainingSamples:
      process.env.ML_EXPORT_TRAINING_SAMPLES === '1' ||
      process.env.ML_EXPORT_TRAINING_SAMPLES === 'true',
    trainingExportDir: process.env.ML_TRAINING_EXPORT_DIR || '',
  },
  aws: {
    s3: {
      bucket: process.env.AWS_S3_BUCKET,
      region: process.env.AWS_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  },
  storage: {
    allowedImageHosts: (() => {
      const extra = (process.env.ALLOWED_IMAGE_HOSTS || '')
        .split(',')
        .map((h) => h.trim())
        .filter(Boolean);
      const hosts = new Set<string>(extra);
      const b2Endpoint = (process.env.B2_ENDPOINT || '').replace(/^["']|["']$/g, '');
      if (b2Endpoint) {
        try {
          hosts.add(new URL(b2Endpoint).hostname);
        } catch {
          /* skip */
        }
      }
      const b2Public = process.env.B2_PUBLIC_BASE_URL || '';
      if (b2Public) {
        try {
          hosts.add(new URL(b2Public).hostname);
        } catch {
          /* skip */
        }
      }
      const bucket = process.env.AWS_S3_BUCKET;
      const region = process.env.AWS_REGION || 'us-east-1';
      if (bucket) {
        hosts.add(`${bucket}.s3.${region}.amazonaws.com`);
        hosts.add(`s3.${region}.amazonaws.com`);
      }
      return [...hosts];
    })(),
  },
});
