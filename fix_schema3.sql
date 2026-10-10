DROP TABLE IF EXISTS restaurant_documents;
DROP TABLE IF EXISTS restaurants;
CREATE TABLE restaurants (
    id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    email TEXT,
    phone_number TEXT,
    address TEXT,
    location_lat DOUBLE PRECISION,
    location_lng DOUBLE PRECISION,
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE TRIGGER update_restaurants_modtime BEFORE UPDATE ON restaurants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
