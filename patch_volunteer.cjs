const fs = require('fs');

let code = fs.readFileSync('src/pages/VolunteerPortal.tsx', 'utf8');

// Add live location toggle state
if (!code.includes('isLocationShared')) {
  code = code.replace(
    /const \[watchId, setWatchId\] = useState<number \| null>\(null\);/,
    `const [watchId, setWatchId] = useState<number | null>(null);
  const [isLocationShared, setIsLocationShared] = useState(true);
  const [gpsError, setGpsError] = useState('');`
  );
}

// Modify geolocation effect to respect toggle and options
code = code.replace(
  /const id = navigator.geolocation.watchPosition\(\s*async \(pos\) => \{/,
  `if (!isLocationShared) return;
        const id = navigator.geolocation.watchPosition(
      async (pos) => {
        setGpsError('');`
);

// Add options to watchPosition
code = code.replace(
  /        console\.error\("GPS Error", err\);\n      \},\n/,
  `        console.error("GPS Error", err);
        setGpsError("Location permission denied. Cannot continue delivery.");
      },
      { enableHighAccuracy: true, maximumAge: 5000 }\n`
);

// Add Live Location Toggle to UI
if (!code.includes('Live Location:')) {
  code = code.replace(
    /<div className="flex justify-between items-center bg-slate-100 dark:bg-slate-800\/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">/,
    `<div className="flex justify-between items-center bg-slate-100 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-3">
                 <div className={\`w-10 h-10 rounded-full flex items-center justify-center \${isLocationShared ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}\`}>
                    <MapPin className="w-5 h-5" />
                 </div>
                 <div>
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Live Location</p>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {isLocationShared ? 'Tracking Active' : 'Paused'}
                    </p>
                 </div>
              </div>
              <Button 
                 variant={isLocationShared ? "outline" : "default"}
                 onClick={() => setIsLocationShared(!isLocationShared)}
              >
                 {isLocationShared ? 'Pause' : 'Resume'}
              </Button>
            </div>
            {gpsError && (
               <div className="bg-red-50 dark:bg-red-900/20 text-red-600 p-4 rounded-xl border border-red-200 dark:border-red-800 mb-4 flex items-center gap-2">
                 <AlertCircle className="w-5 h-5 flex-shrink-0" />
                 <p className="text-sm font-medium">{gpsError}</p>
               </div>
            )}
            <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">`
  );
}

fs.writeFileSync('src/pages/VolunteerPortal.tsx', code);
