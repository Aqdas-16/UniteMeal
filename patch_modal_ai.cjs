const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/DonationDetailsModal.tsx', 'utf8');

const aiBlock = `
                            {donation.food_quality_assessments && donation.food_quality_assessments.length > 0 && (
                                <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-6 h-6 rounded bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10H12V2Z"/><path d="M12 12 2.1 12"/><path d="M12 12 19 4.9"/></svg>
                                        </div>
                                        <span className="font-bold text-sm text-indigo-900 dark:text-indigo-300">AI Quality Analysis</span>
                                        {donation.food_quality_assessments[0].authenticity_result?.includes('Passed') && (
                                            <Badge variant="secondary" className="ml-auto bg-indigo-100 text-indigo-700 hover:bg-indigo-100 text-[10px] uppercase">Verified Photo</Badge>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <span className="text-slate-500 block text-xs mb-0.5">Detected Category</span>
                                            <span className="font-medium text-slate-900 dark:text-slate-200">{donation.food_quality_assessments[0].food_category || 'Unknown'}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block text-xs mb-0.5">Freshness Score</span>
                                            <div className="flex items-center gap-1.5">
                                                <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div className="h-full bg-indigo-500" style={{ width: \`\${donation.food_quality_assessments[0].freshness_score || 0}%\` }} />
                                                </div>
                                                <span className="font-medium text-slate-900 dark:text-slate-200">{donation.food_quality_assessments[0].freshness_score || 0}%</span>
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block text-xs mb-0.5">Spoilage Risk</span>
                                            <span className={\`font-medium \${donation.food_quality_assessments[0].spoilage_risk === 'High' ? 'text-red-600' : donation.food_quality_assessments[0].spoilage_risk === 'Medium' ? 'text-amber-600' : 'text-emerald-600'}\`}>
                                                {donation.food_quality_assessments[0].spoilage_risk || 'Unknown'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block text-xs mb-0.5">Recommendation</span>
                                            <span className="font-medium text-slate-900 dark:text-slate-200">{donation.food_quality_assessments[0].safe_to_donate || 'Review'}</span>
                                        </div>
                                    </div>
                                    {donation.food_quality_assessments[0].explanation && (
                                        <p className="mt-3 text-xs text-indigo-800/80 dark:text-indigo-200/70 border-t border-indigo-100 dark:border-indigo-800/30 pt-3">
                                            "{donation.food_quality_assessments[0].explanation}"
                                        </p>
                                    )}
                                </div>
                            )}`;

code = code.replace(
  /{donation.instructions && \(/,
  aiBlock + '\n                            {donation.instructions && ('
);

fs.writeFileSync('src/components/dashboard/DonationDetailsModal.tsx', code);
