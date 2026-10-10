-- Allow volunteers to insert locations
-- Just in case we ensure there's a loose RLS or disabled RLS if it's already there
ALTER TABLE delivery_locations DISABLE ROW LEVEL SECURITY;
