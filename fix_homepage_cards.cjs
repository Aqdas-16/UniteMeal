const fs = require('fs');
let code = fs.readFileSync('src/pages/NGOHomepage.tsx', 'utf8');

const regex = /\{\/\* 2\. ACTION CARDS \*\/\}[\s\S]*?\{\/\* 3\. NGO KPI CARDS \*\/\}/;
const replacement = `{/* 2. ACTION CARDS */}
         <div className="space-y-6">
             {/* Big prominent box for Food Requests */}
             <Card 
                className="hover:shadow-lg transition-all cursor-pointer border-transparent bg-emerald-50 dark:bg-emerald-900/10 hover:bg-emerald-100 dark:hover:bg-emerald-900/20 group relative overflow-hidden" 
                onClick={() => navigate('/dashboard/ngo/requests')}
             >
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Utensils className="w-32 h-32 text-emerald-600 dark:text-emerald-400" />
                </div>
                <CardContent className="p-8 sm:p-10 relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-white dark:bg-emerald-800 text-emerald-600 dark:text-emerald-300 rounded-xl flex items-center justify-center shadow-sm">
                                <Utensils className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-2xl text-emerald-900 dark:text-emerald-100">Request Food</h3>
                        </div>
                        <p className="text-emerald-700 dark:text-emerald-300 text-base max-w-xl">Create a new food request for your community or track the status of your existing requests. Restaurants will be notified immediately.</p>
                    </div>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 shadow-md h-12 px-8 text-base rounded-full">
                        Create Request
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </CardContent>
             </Card>

             {/* Single horizontal row for other actions */}
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                 <ActionCard
                     title="Available Donations"
                     desc="Accept surplus food from local restaurants."
                     icon={Box}
                     onClick={() => navigate('/dashboard/ngo/incoming')}
                 />
                 <ActionCard
                     title="Manage Volunteers"
                     desc="Assign drivers and manage your team."
                     icon={Users}
                     onClick={() => navigate('/dashboard/ngo/volunteers')}
                 />
                 <ActionCard
                     title="Track Deliveries"
                     desc="Monitor accepted pickups live on the map."
                     icon={Truck}
                     onClick={() => navigate('/dashboard/ngo/track')}
                 />
                 <ActionCard
                     title="My Pickups"
                     desc="View delivery history and completed tasks."
                     icon={History}
                     onClick={() => navigate('/dashboard/ngo/history')}
                 />
             </div>
         </div>

         {/* 3. NGO KPI CARDS */}`;

if (regex.test(code)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('src/pages/NGOHomepage.tsx', code);
    console.log("Updated NGOHomepage.tsx");
} else {
    console.log("Could not find Action Cards block");
}
