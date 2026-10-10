const fs = require('fs');
let code = fs.readFileSync('src/pages/NGOHomepage.tsx', 'utf-8');

code = code.replace(/export function DonorDashboard/g, 'export function NGOHomepage');
code = code.replace(/restaurant_bg\.jpeg/g, 'ngo_bg.jpeg');
code = code.replace(/Restaurant Partner/g, 'NGO Partner');
code = code.replace(/Good Food <br \/>[\s\S]*?Second Chance/g, 'Rescue Food.<br />\n                 <span className="text-[#3FAE49] dark:text-[#D4AF37]">Feed Communities.</span>');
code = code.replace(/UniteMeal helps you donate surplus food easily, reduce waste, and make a real impact in your community\./g, 'Connect with nearby restaurants, rescue surplus food, assign volunteers and deliver meals to people in need.');

// Update navigation buttons
const newButtons = `                  <Button
                      size="lg"
                      className="h-12 rounded-full bg-[#3FAE49] hover:bg-[#328f3a] dark:bg-[#D4AF37] dark:hover:bg-[#E8C96A] text-white dark:text-[#0B0B0C] font-bold px-8 transition-colors text-sm flex items-center gap-2"
                      onClick={() => navigate('/dashboard/ngo/incoming')}
                  >
                     <Search className="w-4 h-4" /> View Available Donations
                  </Button>
                  <Button
                      size="lg"
                      variant="outline"
                      className="h-12 rounded-full border-white/20 bg-white/5 hover:bg-white/10 text-white font-bold px-8 backdrop-blur-md transition-colors text-sm flex items-center gap-2"
                      onClick={() => navigate('/dashboard/ngo/track')}
                  >
                     <MapPin className="w-4 h-4" /> My Pickups
                  </Button>
                  <Button
                      size="lg"
                      variant="outline"
                      className="h-12 rounded-full border-white/20 bg-white/5 hover:bg-white/10 text-white font-bold px-8 backdrop-blur-md transition-colors text-sm flex items-center gap-2"
                      onClick={() => navigate('/dashboard/ngo/volunteers')}
                  >
                     <Users className="w-4 h-4" /> Manage Volunteers
                  </Button>
                  <Button
                      size="lg"
                      variant="outline"
                      className="h-12 rounded-full border-white/20 bg-white/5 hover:bg-white/10 text-white font-bold px-8 backdrop-blur-md transition-colors text-sm flex items-center gap-2"
                      onClick={() => navigate('/dashboard/ngo/analytics')}
                  >
                     <Activity className="w-4 h-4" /> View Analytics
                  </Button>`;
code = code.replace(/<Button[\s\S]*?Donate Food[\s\S]*?<\/Button>[\s\S]*?<Button[\s\S]*?Track Deliveries[\s\S]*?<\/Button>/, newButtons);

// Remove DonorLiveMap and other things, replacing with Available Donations logic
fs.writeFileSync('src/pages/NGOHomepage.tsx', code);
