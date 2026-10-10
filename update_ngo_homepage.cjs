const fs = require('fs');

let code = fs.readFileSync('src/pages/NGOHomepage.tsx', 'utf8');

// Replace hero section
const oldHero = `<div className="relative w-full overflow-hidden flex items-center bg-[#0A0A0A] min-h-[40vh] pt-16 pb-8 border-b border-white/10">`;
const oldHeroEnd = `      <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 md:px-12 -mt-6 relative z-20 space-y-8">`;

const newHero = `{/* 1. HERO SECTION */}
      <div className="relative w-full overflow-hidden flex items-center bg-[#0A0A0A] min-h-[50vh] pt-24 pb-16">
         <div
            className="absolute right-0 top-0 w-full lg:w-2/3 h-full bg-cover bg-center bg-no-repeat opacity-60 lg:opacity-100"
            style={{ backgroundImage: "url('/ngo_bg.jpeg')" }}
         />
         {/* Subtle gradient overlay to ensure text readability */}
         <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent" />
         <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />
         
         <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 md:px-12 flex flex-col justify-center items-start">
            <div className="max-w-2xl">
               <div className="flex items-center gap-3 mb-6">
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-full">
                     NGO Partner
                  </Badge>
               </div>
               
               <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6 leading-tight">
                 Rescue Surplus Food.<br />
                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Feed Communities.</span>
               </h1>
               
               <p className="text-gray-300 text-lg md:text-xl mb-8 max-w-xl leading-relaxed">
                 Connect with nearby restaurants, assign volunteers and deliver surplus food to people in need.
               </p>
               
               <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full">
                  <Button
                      className="h-12 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-8 transition-all text-base flex items-center justify-center gap-2"
                      onClick={() => navigate('/dashboard/ngo/incoming')}
                  >
                      View Available Donations <ArrowRight className="w-5 h-5" />
                  </Button>
                  <Button
                      variant="outline"
                      className="h-12 rounded-full border-white/20 text-white hover:bg-white/10 font-bold px-8 transition-all text-base flex items-center justify-center gap-2 bg-transparent"
                      onClick={() => navigate('/dashboard/ngo/history')}
                  >
                      <History className="w-5 h-5" /> My Pickups
                  </Button>
               </div>
            </div>
         </div>
      </div>

      <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 md:px-12 mt-8 relative z-20 space-y-8">`;

const heroStartIndex = code.indexOf(oldHero);
const heroEndIndex = code.indexOf(oldHeroEnd);

if (heroStartIndex !== -1 && heroEndIndex !== -1) {
  code = code.substring(0, heroStartIndex) + newHero + code.substring(heroEndIndex + oldHeroEnd.length);
}

fs.writeFileSync('src/pages/NGOHomepage.tsx', code);
console.log('Done replacing hero');
