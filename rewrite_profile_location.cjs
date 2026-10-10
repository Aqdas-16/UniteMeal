const fs = require('fs');
let code = fs.readFileSync('src/pages/DonorProfile.tsx', 'utf-8');

const targetStart = `<div className="col-span-2 space-y-1.5">\n                                        <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Complete Address *</Label>`;
const targetEnd = `                                        </div>\n                                    </div>\n                                </div>\n                            </CardContent>`;

if (code.includes(targetStart) && code.includes(targetEnd)) {
    const beforeStart = code.substring(0, code.indexOf(targetStart));
    const afterEnd = code.substring(code.indexOf(targetEnd) + targetEnd.length);

    const replacement = `<div className="col-span-2 pt-4 border-t border-slate-100 dark:border-slate-800">
    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Location details</h3>
    <LocationEditor 
        data={{
            address: formData.address || '',
            city: formData.city || '',
            state: formData.state || '',
            postal_code: formData.pincode || '',
            latitude: formData.latitude || null,
            longitude: formData.longitude || null
        }}
        onChange={(updates) => {
            const mappedUpdates = { ...updates };
            if (mappedUpdates.postal_code !== undefined) {
                mappedUpdates.pincode = mappedUpdates.postal_code;
                delete mappedUpdates.postal_code;
            }
            setFormData(prev => ({ ...prev, ...mappedUpdates }));
            setHasChanges(true);
            setSaveStatus('unsaved');
        }}
    />
</div>
                                </div>
                            </CardContent>`;

    code = beforeStart + replacement + afterEnd;
    fs.writeFileSync('src/pages/DonorProfile.tsx', code);
    console.log('Replaced location block');
} else {
    console.error('Target not found!');
}
