const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/NGOLiveMap.tsx', 'utf8');

// Change restaurant marker color to red
code = code.replace(
    /\`w-8 h-8 rounded-full \$\{hasActive \? 'bg-orange-500' : 'bg-slate-400'\} border-2 border-white flex items-center justify-center shadow-md cursor-pointer hover:scale-110 transition-transform\`/g,
    `\`w-8 h-8 rounded-full \$\{hasActive ? 'bg-red-600' : 'bg-red-400'\} border-2 border-white flex items-center justify-center shadow-md cursor-pointer hover:scale-110 transition-transform\``
);

// Add selectedNgo state
if (!code.includes('const [selectedNgo, setSelectedNgo] = useState<any>(null);')) {
    code = code.replace(
        'const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);',
        'const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);\n  const [selectedNgo, setSelectedNgo] = useState<any>(null);'
    );
}

// Add onClick to Other NGOs marker
code = code.replace(
    /zIndex=\{30\}>/g,
    'zIndex={30} onClick={() => setSelectedNgo(n)}>'
);

// Add InfoWindow for NGO
if (!code.includes('selectedNgo && (')) {
    const ngoInfoWindow = `
            {/* InfoWindow for NGO */}
             {selectedNgo && (
                <InfoWindow
                   position={{lat: Number(selectedNgo.location_lat || 0), lng: Number(selectedNgo.location_lng || 0)}}
                   onCloseClick={() => setSelectedNgo(null)}
                   pixelOffset={[0, -20]}
                >
                   <div className="p-1 w-64">
                       <div className="flex items-center gap-3 mb-3">
                           <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                               <Building className="w-5 h-5 text-slate-400" />
                           </div>
                           <div>
                               <h3 className="font-bold text-sm text-slate-900 leading-tight line-clamp-1">{selectedNgo.organization_name || selectedNgo.business_name || selectedNgo.name}</h3>
                               <div className="text-[10px] text-slate-500 mt-0.5 uppercase font-bold tracking-wider">Community NGO</div>
                           </div>
                       </div>
                       <p className="text-xs text-slate-500 mb-2 flex items-start gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{selectedNgo.address || 'Address not provided'}</span>
                       </p>
                   </div>
                </InfoWindow>
             )}
`;
    code = code.replace('{/* Directions */}', ngoInfoWindow + '\n             {/* Directions */}');
}

fs.writeFileSync('src/components/dashboard/NGOLiveMap.tsx', code);
