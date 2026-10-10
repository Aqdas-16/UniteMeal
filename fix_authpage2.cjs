const fs = require('fs');
let code = fs.readFileSync('src/pages/AuthPage.tsx', 'utf8');

const oldOr = `<div className="mt-3 mb-3 relative flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-[#E5E7EB] dark:border-[#374151]" />
                  </div>
                  <span className="relative bg-[#FFFFFF] dark:bg-[#111827] px-3 text-[11px] font-semibold tracking-wider text-[#9CA3AF] uppercase">
                    Or
                  </span>
                </div>

                <Button
                  variant="outline"
                  className="w-full h-[40px] rounded-[10px] bg-white dark:bg-[#111827] border border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] hover:bg-slate-50 dark:hover:bg-slate-900 shadow-none font-medium text-[#111827] dark:text-[#F8FAFC] transition-all duration-150 text-[13px]"
                  onClick={handleGoogleAuth}
                  disabled={loading}
                >
                  <span className="w-4 h-4 mr-2 flex items-center justify-center"><FcGoogle size={16} /></span>
                  Continue with Google
                </Button>`;

const newOr = `                {selectedRole !== 'volunteer' && (
                  <>
                    <div className="mt-3 mb-3 relative flex items-center justify-center">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-[#E5E7EB] dark:border-[#374151]" />
                      </div>
                      <span className="relative bg-[#FFFFFF] dark:bg-[#111827] px-3 text-[11px] font-semibold tracking-wider text-[#9CA3AF] uppercase">
                        Or
                      </span>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full h-[40px] rounded-[10px] bg-white dark:bg-[#111827] border border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] hover:bg-slate-50 dark:hover:bg-slate-900 shadow-none font-medium text-[#111827] dark:text-[#F8FAFC] transition-all duration-150 text-[13px]"
                      onClick={handleGoogleAuth}
                      disabled={loading}
                    >
                      <span className="w-4 h-4 mr-2 flex items-center justify-center"><FcGoogle size={16} /></span>
                      Continue with Google
                    </Button>
                  </>
                )}`;

if (code.includes(oldOr)) {
    code = code.replace(oldOr, newOr);
    fs.writeFileSync('src/pages/AuthPage.tsx', code);
    console.log("Updated AuthPage.tsx to hide Google auth for volunteers");
} else {
    console.log("Could not find Google auth button code");
}
