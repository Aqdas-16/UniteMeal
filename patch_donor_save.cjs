const fs = require('fs');
let content = fs.readFileSync('src/pages/DonorProfile.tsx', 'utf-8');

// The original onSave in DonorProfile.tsx is:
//         onSave={async (mergedData) => {
//             const mappedUpdates = { ...mergedData } as any;
//             if (mappedUpdates.postal_code !== undefined) {
//                 mappedUpdates.pincode = mappedUpdates.postal_code;
//                 delete mappedUpdates.postal_code;
//             }
//             setFormData(prev => ({ ...prev, ...mappedUpdates }));
//             await handleSave(mappedUpdates);
//         }}

content = content.replace(/        onSave=\{async \(mergedData\) => \{[\s\S]*?\}\}/g, '');

content = content.replace(
    /toast\.error\(error\.message \|\| 'Failed to update profile'\);/g,
    `toast.error('Unable to save profile. Please try again.');`
);

fs.writeFileSync('src/pages/DonorProfile.tsx', content);
