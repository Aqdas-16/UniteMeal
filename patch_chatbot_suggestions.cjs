const fs = require('fs');
let code = fs.readFileSync('src/components/FloatingAssistant.tsx', 'utf8');

const target = `<form onSubmit={handleSend} className="p-3 bg-white dark:bg-theme-surface border-t border-slate-200 dark:border-slate-800 flex gap-2 shrink-0">`;
const replacement = `
            <div className="px-3 pb-2 pt-1 bg-white dark:bg-theme-surface border-t border-slate-200 dark:border-slate-800 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
              {["How does NGO work?", "Delivery partners?", "Certificate?"].map(q => (
                <button 
                  key={q}
                  type="button"
                  onClick={() => {
                    setInput(q);
                  }}
                  className="whitespace-nowrap px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-full transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
            <form onSubmit={handleSend} className="p-3 bg-white dark:bg-theme-surface flex gap-2 shrink-0 border-t border-slate-100 dark:border-slate-800/50">`;

if (!code.includes("How does NGO work?")) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/components/FloatingAssistant.tsx', code);
}
