-- CalTrack Database Initialization Script
-- This script runs when the PostgreSQL container is first created

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    age INTEGER,
    weight DECIMAL(5, 2),  -- kg
    height DECIMAL(5, 2),  -- cm
    gender VARCHAR(10),
    activity_level VARCHAR(20),
    goal VARCHAR(20),
    units VARCHAR(10) DEFAULT 'metric',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_goals table
CREATE TABLE IF NOT EXISTS user_goals (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    daily_calories INTEGER NOT NULL,
    protein_grams DECIMAL(6, 2),
    carbs_grams DECIMAL(6, 2),
    fat_grams DECIMAL(6, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create food_items table
CREATE TABLE IF NOT EXISTS food_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    brand_name VARCHAR(255),
    barcode VARCHAR(50),
    calories DECIMAL(7, 2) NOT NULL,
    protein DECIMAL(6, 2) NOT NULL,
    carbs DECIMAL(6, 2) NOT NULL,
    fat DECIMAL(6, 2) NOT NULL,
    fiber DECIMAL(6, 2),
    sugar DECIMAL(6, 2),
    sodium DECIMAL(7, 2),
    serving_size VARCHAR(100) NOT NULL,
    serving_unit VARCHAR(50) NOT NULL,
    photo_url TEXT,
    is_custom BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create meals table
CREATE TABLE IF NOT EXISTS meals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    notes TEXT,
    total_calories DECIMAL(7, 2) NOT NULL,
    total_protein DECIMAL(6, 2) NOT NULL,
    total_carbs DECIMAL(6, 2) NOT NULL,
    total_fat DECIMAL(6, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create meal_food_items junction table
CREATE TABLE IF NOT EXISTS meal_food_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meal_id UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
    food_id UUID NOT NULL REFERENCES food_items(id) ON DELETE RESTRICT,
    food_name VARCHAR(255) NOT NULL, -- Denormalized for performance
    servings DECIMAL(6, 2) NOT NULL DEFAULT 1,
    calories DECIMAL(7, 2) NOT NULL,
    protein DECIMAL(6, 2) NOT NULL,
    carbs DECIMAL(6, 2) NOT NULL,
    fat DECIMAL(6, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sync_queue table for offline sync
CREATE TABLE IF NOT EXISTS sync_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    operation VARCHAR(20) NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
    data JSONB,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_meals_user_id ON meals(user_id);
CREATE INDEX idx_meals_timestamp ON meals(timestamp);
CREATE INDEX idx_meals_user_timestamp ON meals(user_id, timestamp DESC);
CREATE INDEX idx_food_items_name ON food_items USING gin(name gin_trgm_ops);
CREATE INDEX idx_food_items_barcode ON food_items(barcode);
CREATE INDEX idx_meal_food_items_meal_id ON meal_food_items(meal_id);
CREATE INDEX idx_sync_queue_user_processed ON sync_queue(user_id, processed);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_goals_updated_at BEFORE UPDATE ON user_goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_food_items_updated_at BEFORE UPDATE ON food_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meals_updated_at BEFORE UPDATE ON meals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert seed data (optional - for development)
-- You can uncomment this section for initial test data
/*
INSERT INTO users (email, password_hash) VALUES 
    ('test@caltrack.local', '$2b$10$YourHashedPasswordHere');
*/
