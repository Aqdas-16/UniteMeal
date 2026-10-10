const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/DonationHistory.tsx', 'utf8');

const target = `<select 
                        className="h-10 w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-md px-3 text-sm text-slate-900 dark:text-white outline-none"
                        value={sortOrder}`;

const replacement = `<select 
                        className="h-10 w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-md px-3 text-sm text-slate-900 dark:text-white outline-none"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                        <option value="All">All Categories</option>
                        {CATEGORY_OPTIONS.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                    <select 
                        className="h-10 w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-md px-3 text-sm text-slate-900 dark:text-white outline-none"
                        value={sortOrder}`;

code = code.replace(target, replacement);

fs.writeFileSync('src/components/dashboard/DonationHistory.tsx', code);
console.log("Patched DonationHistory.tsx");
