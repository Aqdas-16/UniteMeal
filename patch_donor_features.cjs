const fs = require('fs');
let code = fs.readFileSync('src/pages/DonorFeatures.tsx', 'utf-8');

code = code.replace(/import 'leaflet\/dist\/leaflet\.css';\n/g, '');
code = code.replace(/import \{ MapContainer, TileLayer, CircleMarker, Popup, Marker, Polyline \} from 'react-leaflet';\n/g, '');

fs.writeFileSync('src/pages/DonorFeatures.tsx', code);
