const fs = require('fs');
let code = fs.readFileSync('/tmp/DonorProfile.tsx.bak', 'utf-8');

// Replace AddressAutocompleteInput import with LocationEditor
code = code.replace(/import \{ AddressAutocompleteInput \} from '@\/components\/ui\/AddressAutocomplete';/, "import { LocationEditor } from '@/components/dashboard/LocationEditor';");

// Replace "Business Settings" with "Profile" again to be sure
code = code.replace(/Business Settings/g, "Profile");
code = code.replace(/Business Details/g, "Profile Details");

const targetStart = `<div className="col-span-2 space-y-1.5">\n                                        <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Complete Address *</Label>`;
const targetEnd = `</CardContent>`;

const beforeStart = code.substring(0, code.indexOf(targetStart));
const afterEnd = code.substring(code.indexOf(targetEnd));

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
                            `;

code = beforeStart + replacement + afterEnd;

fs.writeFileSync('src/pages/DonorProfile.tsx', code);
