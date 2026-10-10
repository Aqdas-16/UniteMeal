
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- UniteMeal Supabase Database Schema (Firebase Auth ONLY)
-- Designed specifically for Firebase Auth UID integration (TEXT IDs)

-- Drop existing tables if they exist (for a clean slate)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS analytics_summary CASCADE;
DROP TABLE IF EXISTS impact_metrics CASCADE;
DROP TABLE IF EXISTS user_badges CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS badges CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS support_tickets CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS delivery_locations CASCADE;
DROP TABLE IF EXISTS deliveries CASCADE;
DROP TABLE IF EXISTS requests CASCADE;
DROP TABLE IF EXISTS donation_images CASCADE;
DROP TABLE IF EXISTS donations CASCADE;
DROP TABLE IF EXISTS volunteers CASCADE;
DROP TABLE IF EXISTS ngos CASCADE;
DROP TABLE IF EXISTS donors CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 1. PROFILES
CREATE TABLE profiles (
    id TEXT PRIMARY KEY, -- Firebase UID
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT CHECK (role IN ('donor', 'ngo', 'volunteer', 'admin')),
    phone_number TEXT,
    avatar_url TEXT,
    account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'pending')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. DONORS
CREATE TABLE donors (
    id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    donor_type TEXT CHECK (donor_type IN ('individual', 'restaurant', 'corporate', 'grocery')),
    organization_name TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    location_lat DOUBLE PRECISION,
    location_lng DOUBLE PRECISION,
    is_verified BOOLEAN DEFAULT false,
    tax_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2b. RESTAURANTS
CREATE TABLE restaurants (
    restaurant_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    website TEXT,
    description TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    gst_number TEXT,
    fssai_number TEXT,
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'under_review', 'verified', 'rejected')),
    profile_image_url TEXT,
    restaurant_logo_url TEXT,
    joined_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2c. DOCUMENTS
CREATE TABLE restaurant_documents (
    document_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    restaurant_id TEXT NOT NULL REFERENCES restaurants(restaurant_id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (document_type IN ('gst_certificate', 'fssai_certificate', 'restaurant_license', 'pan_card', 'owner_id_proof', 'address_proof', 'shop_establishment', 'other')),
    document_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'request_reupload')),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Apply updated_at trigger
CREATE TRIGGER update_restaurants_modtime BEFORE UPDATE ON restaurants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_restaurant_documents_modtime BEFORE UPDATE ON restaurant_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE restaurants DISABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_documents DISABLE ROW LEVEL SECURITY;
CREATE TABLE ngos (
    id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    organization_name TEXT NOT NULL,
    registration_number TEXT,
    mission_statement TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    location_lat DOUBLE PRECISION,
    location_lng DOUBLE PRECISION,
    capacity_people INTEGER,
    storage_capacity_kg DOUBLE PRECISION,
    is_verified BOOLEAN DEFAULT false,
    operating_hours TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. VOLUNTEERS
CREATE TABLE volunteers (
    id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    vehicle_type TEXT CHECK (vehicle_type IN ('bicycle', 'motorcycle', 'car', 'van', 'truck', 'none')),
    vehicle_plate TEXT,
    driving_license_number TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    location_lat DOUBLE PRECISION,
    location_lng DOUBLE PRECISION,
    is_verified BOOLEAN DEFAULT false,
    availability_status BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    availability TEXT DEFAULT 'online' CHECK (availability IN ('online', 'offline', 'busy')),
    approved BOOLEAN DEFAULT true,
    max_delivery_radius_km DOUBLE PRECISION DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. DONATIONS
CREATE TABLE donations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    donor_id TEXT NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    food_category TEXT CHECK (food_category IN ('cooked_food', 'raw_ingredients', 'packaged_food', 'baked_goods', 'produce')),
    quantity_kg DOUBLE PRECISION NOT NULL,
    estimated_meals INTEGER NOT NULL,
    expiry_time TIMESTAMP WITH TIME ZONE NOT NULL,
    pickup_address TEXT NOT NULL,
    pickup_lat DOUBLE PRECISION,
    pickup_lng DOUBLE PRECISION,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'assigned', 'picked_up', 'delivered', 'cancelled', 'expired')),
    special_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. DONATION_IMAGES
CREATE TABLE donation_images (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    donation_id TEXT NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    file_name TEXT,
    file_size BIGINT,
    mime_type TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6b. FOOD QUALITY ASSESSMENTS
CREATE TABLE food_quality_assessments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    donation_id TEXT NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
    food_name TEXT,
    food_category TEXT,
    freshness_score DOUBLE PRECISION,
    spoilage_risk TEXT,
    visible_mold BOOLEAN,
    estimated_age TEXT,
    recommended_donation_time TEXT,
    safe_to_donate TEXT,
    confidence_score DOUBLE PRECISION,
    explanation TEXT,
    authenticity_result TEXT,
    authenticity_confidence DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. REQUESTS
CREATE TABLE requests (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    ngo_id TEXT NOT NULL REFERENCES ngos(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    food_category TEXT CHECK (food_category IN ('cooked_food', 'raw_ingredients', 'packaged_food', 'baked_goods', 'produce')),
    required_quantity_kg DOUBLE PRECISION NOT NULL,
    required_by TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'partially_fulfilled', 'fulfilled', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. DELIVERIES
CREATE TABLE deliveries (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    donation_id TEXT NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
    ngo_id TEXT NOT NULL REFERENCES ngos(id) ON DELETE CASCADE,
    volunteer_id TEXT REFERENCES volunteers(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'accepted', 'heading_to_restaurant', 'arrived_restaurant', 'picked_up', 'heading_to_ngo', 'arrived_ngo', 'delivered', 'completed', 'cancelled', 'failed', 'in_transit')),
    pickup_otp TEXT,
    delivery_otp TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    picked_up_at TIMESTAMP WITH TIME ZONE,
    arrived_restaurant_at TIMESTAMP WITH TIME ZONE,
    arrived_ngo_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    pickup_time TIMESTAMP WITH TIME ZONE,
    delivery_time TIMESTAMP WITH TIME ZONE,
    proof_of_pickup_url TEXT,
    proof_of_delivery_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. DELIVERY_LOCATIONS (For tracking)
CREATE TABLE delivery_locations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    delivery_id TEXT NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
    location_lat DOUBLE PRECISION NOT NULL,
    location_lng DOUBLE PRECISION NOT NULL,
    heading DOUBLE PRECISION,
    speed DOUBLE PRECISION,
    accuracy DOUBLE PRECISION,
    battery_level DOUBLE PRECISION,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. NOTIFICATIONS
CREATE TABLE notifications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('donation_match', 'delivery_update', 'system_alert', 'verification_status', 'general')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    related_entity_type TEXT CHECK (related_entity_type IN ('donation', 'delivery', 'request', 'profile', 'none')),
    related_entity_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. REVIEWS
CREATE TABLE reviews (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    reviewer_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reviewee_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    delivery_id TEXT REFERENCES deliveries(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. BADGES
CREATE TABLE badges (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    description TEXT,
    icon_url TEXT,
    criteria TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 13. USER_BADGES
CREATE TABLE user_badges (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    badge_id TEXT NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 14. ACHIEVEMENTS
CREATE TABLE achievements (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 15. IMPACT_METRICS (User-specific metrics)
CREATE TABLE impact_metrics (
    user_id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    total_donations INTEGER DEFAULT 0,
    total_deliveries INTEGER DEFAULT 0,
    total_food_kg DOUBLE PRECISION DEFAULT 0,
    total_meals INTEGER DEFAULT 0,
    carbon_saved_kg DOUBLE PRECISION DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 16. ANALYTICS_SUMMARY
CREATE TABLE analytics_summary (
    id TEXT PRIMARY KEY,
    total_donations INTEGER DEFAULT 0,
    total_food_rescued_kg DOUBLE PRECISION DEFAULT 0,
    total_meals_served INTEGER DEFAULT 0,
    total_active_donors INTEGER DEFAULT 0,
    total_active_ngos INTEGER DEFAULT 0,
    total_active_volunteers INTEGER DEFAULT 0,
    total_carbon_saved_kg DOUBLE PRECISION DEFAULT 0,
    last_aggregated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO analytics_summary (id) VALUES ('global-analytics-singleton');

-- 17. SUPPORT_TICKETS
CREATE TABLE support_tickets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 18. REPORTS
CREATE TABLE reports (
    id TEXT PRIMARY KEY,
    reporter_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reported_entity_type TEXT CHECK (reported_entity_type IN ('user', 'donation', 'delivery')),
    reported_entity_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 19. AUDIT_LOGS
CREATE TABLE audit_logs (
    id TEXT PRIMARY KEY,
    entity_name TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,
    performed_by TEXT REFERENCES profiles(id) ON DELETE SET NULL,
    changes JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================
CREATE INDEX idx_donations_status ON donations(status);
CREATE INDEX idx_donations_donor_id ON donations(donor_id);
CREATE INDEX idx_deliveries_status ON deliveries(status);
CREATE INDEX idx_deliveries_ngo_id ON deliveries(ngo_id);
CREATE INDEX idx_deliveries_volunteer_id ON deliveries(volunteer_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id, is_read);
CREATE INDEX idx_profiles_role ON profiles(role);


-- ==========================================
-- TRIGGERS & FUNCTIONS
-- ==========================================

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_donors_modtime BEFORE UPDATE ON donors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ngos_modtime BEFORE UPDATE ON ngos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_volunteers_modtime BEFORE UPDATE ON volunteers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_donations_modtime BEFORE UPDATE ON donations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_requests_modtime BEFORE UPDATE ON requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deliveries_modtime BEFORE UPDATE ON deliveries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_support_tickets_modtime BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle Analytics Aggregation when a Donation changes
CREATE OR REPLACE FUNCTION update_analytics_on_donation()
RETURNS TRIGGER AS $$
DECLARE
    carbon_multiplier CONSTANT DOUBLE PRECISION := 2.5; -- Example: 1kg food = 2.5kg CO2 saved
BEGIN
    -- Only update if status changed to 'delivered'
    IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
        UPDATE analytics_summary 
        SET 
            total_donations = total_donations + 1,
            total_food_rescued_kg = total_food_rescued_kg + NEW.quantity_kg,
            total_meals_served = total_meals_served + NEW.estimated_meals,
            total_carbon_saved_kg = total_carbon_saved_kg + (NEW.quantity_kg * carbon_multiplier),
            last_aggregated_at = timezone('utc'::text, now())
        WHERE id = (SELECT id FROM analytics_summary LIMIT 1);
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_analytics
AFTER UPDATE ON donations
FOR EACH ROW
EXECUTE FUNCTION update_analytics_on_donation();


-- Function to log important actions
CREATE OR REPLACE FUNCTION log_audit_action()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (entity_name, entity_id, action, changes)
        VALUES (TG_TABLE_NAME, NEW.id::text, 'INSERT', row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (entity_name, entity_id, action, changes)
        VALUES (TG_TABLE_NAME, NEW.id::text, 'UPDATE', jsonb_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW)));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (entity_name, entity_id, action, changes)
        VALUES (TG_TABLE_NAME, OLD.id::text, 'DELETE', row_to_json(OLD)::jsonb);
        RETURN OLD;
    END IF;
END;
$$ language 'plpgsql';

-- Apply audit triggers to critical tables
CREATE TRIGGER audit_profiles_changes AFTER INSERT OR UPDATE OR DELETE ON profiles FOR EACH ROW EXECUTE FUNCTION log_audit_action();
CREATE TRIGGER audit_donations_changes AFTER INSERT OR UPDATE OR DELETE ON donations FOR EACH ROW EXECUTE FUNCTION log_audit_action();

-- Disable all RLS since we use Firebase Auth
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE donors DISABLE ROW LEVEL SECURITY;
ALTER TABLE ngos DISABLE ROW LEVEL SECURITY;
ALTER TABLE volunteers DISABLE ROW LEVEL SECURITY;
ALTER TABLE donations DISABLE ROW LEVEL SECURITY;
ALTER TABLE donation_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries DISABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE impact_metrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_summary DISABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

-- Enable Realtime
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE donations, deliveries, notifications, analytics_summary;
