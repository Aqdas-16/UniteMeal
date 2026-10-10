const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/CertificateCard.tsx', 'utf8');

// 1. Add imports
const imports = `import html2canvas from 'html2canvas';\nimport jsPDF from 'jspdf';\nimport { Loader2 } from 'lucide-react';\n`;
if (!code.includes('html2canvas')) {
    code = code.replace(`import { Award, Lock, CheckCircle2, Download } from 'lucide-react';`, `import { Award, Lock, CheckCircle2, Download, Loader2 } from 'lucide-react';`);
    code = imports + code;
}

// 2. Add state for generating
if (!code.includes('isGenerating')) {
    code = code.replace(
        `const [count, setCount] = useState(0);`,
        `const [count, setCount] = useState(0);\n  const [isGenerating, setIsGenerating] = useState(false);`
    );
}

// 3. Replace the download function
const targetButton = `<button onClick={() => window.print()} className={\`absolute top-8 right-24 bg-amber-600 text-white px-4 py-1.5 rounded-md font-semibold text-sm hover:bg-amber-700 print:hidden z-50 flex items-center gap-2 \${!isUnlocked ? 'hidden' : ''}\`}>
               <Download className="w-4 h-4" /> Print / Save PDF
            </button>`;

const newDownloadFunc = `
  const downloadPDF = async () => {
    const element = document.getElementById('certificate-content');
    if (!element) return;
    
    setIsGenerating(true);
    try {
      // Temporarily hide buttons for capture just in case
      const canvas = await html2canvas(element, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(\`UniteMeal_Certificate_\${profile?.full_name?.replace(/\\s+/g, '_') || 'Member'}.pdf\`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
  };
`;

if (!code.includes('downloadPDF')) {
    code = code.replace(`const generatePDF = () => {`, newDownloadFunc + `\n  const generatePDF = () => {`);
}

const replacementButton = `<button disabled={isGenerating} onClick={downloadPDF} className={\`absolute top-8 right-24 bg-amber-600 text-white px-4 py-1.5 rounded-md font-semibold text-sm hover:bg-amber-700 print:hidden z-50 flex items-center gap-2 \${!isUnlocked ? 'hidden' : ''} \${isGenerating ? 'opacity-75 cursor-not-allowed' : ''}\`}>
               {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} {isGenerating ? 'Generating...' : 'Download PDF'}
            </button>`;

code = code.replace(targetButton, replacementButton);

// 4. Add id to the content
code = code.replace(
    `<div className="bg-white text-slate-900 w-[800px] max-w-full aspect-[1.414] rounded-sm shadow-2xl relative overflow-hidden flex flex-col p-12 text-center" style={{ backgroundImage: 'radial-gradient(circle at center, #ffffff, #fdfbf7)' }}>`,
    `<div id="certificate-content" className="bg-white text-slate-900 w-[800px] max-w-full aspect-[1.414] rounded-sm shadow-2xl relative overflow-hidden flex flex-col p-12 text-center" style={{ backgroundImage: 'radial-gradient(circle at center, #ffffff, #fdfbf7)' }}>`
);

// 5. Fix the font style
const badFontTarget = `<h2 className="text-3xl md:text-4xl text-slate-900 mb-6 font-medium italic" style={{ fontFamily: '"Playfair Display", "Dancing Script", "Brush Script MT", cursive', letterSpacing: '1px', textShadow: '1px 1px 0px rgba(0,0,0,0.05)' }}>{profile?.full_name || 'Valued Member'}</h2>`;
const goodFontReplacement = `<h2 className="text-3xl md:text-4xl text-slate-900 mb-6 font-bold" style={{ fontFamily: 'Georgia, "Playfair Display", serif', letterSpacing: '2px' }}>{profile?.full_name || 'Valued Member'}</h2>`;

code = code.replace(badFontTarget, goodFontReplacement);

fs.writeFileSync('src/components/dashboard/CertificateCard.tsx', code);
