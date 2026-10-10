const fs = require('fs');
let code = fs.readFileSync('src/pages/NGOIncomingContent.tsx', 'utf8');

code = code.replace(
  /<Badge variant="secondary" className="bg-slate-100 text-slate-700 border-none">\s*<Leaf className="w-3 h-3 mr-1.5" \/> \{d.veg_type \|\| d.food_category \|\| 'Veg\/Non-Veg'\}\s*<\/Badge>/,
  `<Badge variant="secondary" className="bg-slate-100 text-slate-700 border-none">
                          <Leaf className="w-3 h-3 mr-1.5" /> {d.veg_type || d.food_category || 'Veg/Non-Veg'}
                        </Badge>
                        {d.food_quality_assessments && d.food_quality_assessments.length > 0 && d.food_quality_assessments[0].authenticity_result?.includes('Passed') && (
                          <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-none">
                            <span className="text-xs mr-1">✨</span> AI Verified
                          </Badge>
                        )}`
);

fs.writeFileSync('src/pages/NGOIncomingContent.tsx', code);
