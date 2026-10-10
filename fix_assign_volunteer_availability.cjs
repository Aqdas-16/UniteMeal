const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/AssignVolunteerModal.tsx', 'utf8');

const oldCode = `            if (dtErr) throw dtErr;
            
            // Notify volunteer`;

const newCode = `            if (dtErr) throw dtErr;
            
            // Set volunteer to busy
            await supabase.from('volunteers').update({ availability: 'busy' }).eq('id', volId);
            
            // Notify volunteer`;

if (code.includes(oldCode)) {
    code = code.replace(oldCode, newCode);
    fs.writeFileSync('src/components/dashboard/AssignVolunteerModal.tsx', code);
    console.log("Updated AssignVolunteerModal.tsx");
} else {
    console.log("Could not find code block in AssignVolunteerModal.tsx");
}
