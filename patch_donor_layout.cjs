const fs = require('fs');
let code = fs.readFileSync('src/components/layout/DonorDashboardLayout.tsx', 'utf8');

// Hide hamburger on mobile, remove mobile drawer, add bottom nav
code = code.replace(
    /<Button variant="ghost" size="icon" className="lg:hidden w-10 h-10 -ml-2 text-slate-600 dark:text-slate-300 rounded-full" onClick=\{\(\) => setIsMobileMenuOpen\(true\)\}>/g,
    `<Button variant="ghost" size="icon" className="hidden w-10 h-10 -ml-2 text-slate-600 dark:text-slate-300 rounded-full" onClick={() => setIsMobileMenuOpen(true)}>`
);

// We need to add the Bottom Navigation Bar
const bottomNav = `
      {/* BOTTOM NAVIGATION (MOBILE ONLY) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#11131f] border-t border-slate-200 dark:border-slate-800 flex justify-around items-center h-16 px-2 z-50 pb-safe">
        <NavLink to="/dashboard/donor" end className={({isActive}) => \`flex flex-col items-center justify-center w-16 h-full space-y-1 \${isActive ? 'text-[#F59E0B] dark:text-[#D4AF37]' : 'text-slate-400 dark:text-slate-500'}\`}>
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-medium">Home</span>
        </NavLink>
        <NavLink to="/dashboard/donor/create" className={({isActive}) => \`flex flex-col items-center justify-center w-16 h-full space-y-1 \${isActive ? 'text-[#F59E0B] dark:text-[#D4AF37]' : 'text-slate-400 dark:text-slate-500'}\`}>
          <PlusCircle className="w-5 h-5" />
          <span className="text-[10px] font-medium">Donate</span>
        </NavLink>
        <NavLink to="/dashboard/donor/track" className={({isActive}) => \`flex flex-col items-center justify-center w-16 h-full space-y-1 \${isActive ? 'text-[#F59E0B] dark:text-[#D4AF37]' : 'text-slate-400 dark:text-slate-500'}\`}>
          <Map className="w-5 h-5" />
          <span className="text-[10px] font-medium">Track</span>
        </NavLink>
        <NavLink to="/dashboard/donor/history" className={({isActive}) => \`flex flex-col items-center justify-center w-16 h-full space-y-1 \${isActive ? 'text-[#F59E0B] dark:text-[#D4AF37]' : 'text-slate-400 dark:text-slate-500'}\`}>
          <History className="w-5 h-5" />
          <span className="text-[10px] font-medium">History</span>
        </NavLink>
        <NavLink to="/dashboard/donor/profile" className={({isActive}) => \`flex flex-col items-center justify-center w-16 h-full space-y-1 \${isActive ? 'text-[#F59E0B] dark:text-[#D4AF37]' : 'text-slate-400 dark:text-slate-500'}\`}>
          <User className="w-5 h-5" />
          <span className="text-[10px] font-medium">Profile</span>
        </NavLink>
      </div>
`;

code = code.replace(
    /      <main className=\{\`flex-1 flex flex-col overflow-auto bg-\[\#F7F8FA\] dark:bg-\[\#0F1115\] \$\{isHome \? '' : 'pt-\[68px\] lg:pt-\[76px\]'\}\`\}>\n        <Outlet \/>\n      <\/main>\n    <\/div>/,
    `      <main className={\`flex-1 flex flex-col overflow-auto bg-[#F7F8FA] dark:bg-[#0F1115] \${isHome ? '' : 'pt-[68px] lg:pt-[76px]'} pb-16 md:pb-0\`}>\n        <Outlet />\n      </main>\n${bottomNav}\n    </div>`
);

// We should also remove the mobile drawer to avoid duplicate code
code = code.replace(/<AnimatePresence>[\s\S]*?<\/AnimatePresence>/, '');

fs.writeFileSync('src/components/layout/DonorDashboardLayout.tsx', code);
console.log("Patched DonorDashboardLayout.tsx");
