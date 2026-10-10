const fs = require('fs');

let sql = fs.readFileSync('schema.sql', 'utf8');

// The volunteers table has availability_status just below is_verified
sql = sql.replace(/    is_verified BOOLEAN DEFAULT false,\n    availability_status BOOLEAN DEFAULT true,/, 
`    is_verified BOOLEAN DEFAULT false,
    availability_status BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    availability TEXT DEFAULT 'online' CHECK (availability IN ('online', 'offline', 'busy')),
    approved BOOLEAN DEFAULT true,`);

fs.writeFileSync('schema.sql', sql);
