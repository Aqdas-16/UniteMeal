ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive'));
ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS availability TEXT DEFAULT 'online' CHECK (availability IN ('online', 'offline', 'busy'));
ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false;
