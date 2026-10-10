const fs = require('fs');
let code = fs.readFileSync('src/pages/VolunteerPortal.tsx', 'utf8');

const oldCode = `      const { error } = await supabase.from('deliveries').update(updates).eq('id', activeDelivery.id);
      if (error) throw error;
      toast.success(\`Status updated to: \${newStatus.replace(/_/g, ' ')}\`);`;

const newCode = `      const { error } = await supabase.from('deliveries').update(updates).eq('id', activeDelivery.id);
      if (error) throw error;
      
      if (['completed', 'delivered', 'cancelled', 'failed'].includes(newStatus)) {
          await supabase.from('volunteers').update({ availability: 'online' }).eq('id', user?.uid);
      }
      
      toast.success(\`Status updated to: \${newStatus.replace(/_/g, ' ')}\`);`;

if (code.includes(oldCode)) {
    code = code.replace(oldCode, newCode);
    fs.writeFileSync('src/pages/VolunteerPortal.tsx', code);
    console.log("Updated VolunteerPortal.tsx to reset availability");
} else {
    console.log("Could not find code block in VolunteerPortal.tsx");
}
