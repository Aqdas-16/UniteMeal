const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/CertificateCard.tsx', 'utf8');

const target1 = `<div className="shrink-0">
            {isUnlocked ? (
              <Button onClick={generatePDF} className="bg-amber-600 hover:bg-amber-700 text-white shadow-lg flex items-center gap-2 font-bold px-6 py-6 h-auto">
                <Award className="w-5 h-5" />
                View & Download
              </Button>
            ) : (
              <Button disabled variant="outline" className="border-amber-200 dark:border-amber-900 text-amber-600 dark:text-amber-500 font-bold">
                <Lock className="w-4 h-4 mr-2" /> Locked
              </Button>
            )}
          </div>`;

const replacement1 = `<div className="shrink-0">
            <Button 
              onClick={generatePDF} 
              className={isUnlocked 
                ? "bg-amber-600 hover:bg-amber-700 text-white shadow-lg flex items-center gap-2 font-bold px-6 py-6 h-auto" 
                : "border-amber-200 dark:border-amber-900 text-amber-600 dark:text-amber-500 font-bold bg-white dark:bg-slate-900 shadow-sm flex items-center gap-2 px-6 py-6 h-auto hover:bg-amber-50 dark:hover:bg-slate-800"} 
              variant={isUnlocked ? "default" : "outline"}
            >
              {isUnlocked ? <Award className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              {isUnlocked ? "View & Download" : "Preview Certificate"}
            </Button>
          </div>`;

code = code.replace(target1, replacement1);

const target2 = `<button onClick={() => window.print()} className="absolute top-8 right-24 bg-amber-600 text-white px-4 py-1.5 rounded-md font-semibold text-sm hover:bg-amber-700 print:hidden z-50 flex items-center gap-2">
               <Download className="w-4 h-4" /> Print / Save PDF
            </button>`;

const replacement2 = `<button onClick={() => window.print()} className={\`absolute top-8 right-24 bg-amber-600 text-white px-4 py-1.5 rounded-md font-semibold text-sm hover:bg-amber-700 print:hidden z-50 flex items-center gap-2 \${!isUnlocked ? 'hidden' : ''}\`}>
               <Download className="w-4 h-4" /> Print / Save PDF
            </button>`;

code = code.replace(target2, replacement2);

const target3 = `<div className="flex-1 flex flex-col items-center justify-center relative z-10 print:scale-95 origin-top">`;

const replacement3 = `<div className="flex-1 flex flex-col items-center justify-center relative z-10 print:scale-95 origin-top">
                {/* Watermark for Locked state */}
                {!isUnlocked && (
                   <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none select-none overflow-hidden rounded-sm">
                       <div className="transform -rotate-45 text-[100px] md:text-[140px] font-black text-slate-300/60 tracking-widest uppercase shadow-sm" style={{ WebkitTextStroke: '2px rgba(0,0,0,0.1)' }}>
                           LOCKED
                       </div>
                       <div className="absolute inset-0 backdrop-blur-[3px] bg-white/30"></div>
                   </div>
                )}`;

code = code.replace(target3, replacement3);

fs.writeFileSync('src/components/dashboard/CertificateCard.tsx', code);
