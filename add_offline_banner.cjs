const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const banner = `
function OfflineBanner() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);
    if (isOnline) return null;
    return (
        <div className="fixed top-0 left-0 right-0 bg-rose-500 text-white text-center py-1 text-xs font-bold z-[100] shadow-sm flex items-center justify-center gap-2">
            You are currently offline. Showing cached data.
        </div>
    );
}
`;

if (!code.includes('OfflineBanner')) {
    code = code.replace("function PushWrapper", banner + "\nfunction PushWrapper");
    code = code.replace("<Toaster position=\"top-right\" duration={5000} />", "<OfflineBanner />\n        <Toaster position=\"top-right\" duration={5000} />");
    fs.writeFileSync('src/App.tsx', code);
    console.log("Added offline banner");
}
