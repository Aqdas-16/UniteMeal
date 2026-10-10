const fs = require('fs');
let code = fs.readFileSync('schema.sql', 'utf8');

code = code.replace(
  /status TEXT DEFAULT 'pending' CHECK \(status IN \('pending', 'accepted', 'in_transit', 'delivered', 'cancelled', 'failed'\)\),/g,
  `status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'accepted', 'heading_to_restaurant', 'arrived_restaurant', 'picked_up', 'heading_to_ngo', 'arrived_ngo', 'delivered', 'completed', 'cancelled', 'failed', 'in_transit')),
    pickup_otp TEXT,
    delivery_otp TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    picked_up_at TIMESTAMP WITH TIME ZONE,
    arrived_restaurant_at TIMESTAMP WITH TIME ZONE,
    arrived_ngo_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,`
);

code = code.replace(
  /location_lng DOUBLE PRECISION NOT NULL,/g,
  `location_lng DOUBLE PRECISION NOT NULL,
    heading DOUBLE PRECISION,
    speed DOUBLE PRECISION,
    accuracy DOUBLE PRECISION,
    battery_level DOUBLE PRECISION,`
);

fs.writeFileSync('schema.sql', code);
