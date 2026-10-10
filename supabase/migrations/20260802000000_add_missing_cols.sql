ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE donations ADD COLUMN IF NOT EXISTS pickup_latitude numeric;
ALTER TABLE donations ADD COLUMN IF NOT EXISTS pickup_longitude numeric;
ALTER TABLE donations ADD COLUMN IF NOT EXISTS restaurant_name text;
