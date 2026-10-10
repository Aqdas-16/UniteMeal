const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminFeatures.tsx', 'utf8');

// Fix handleNgoUpdate
const ngoUpdateRegex = /const handleNgoUpdate = async \(id: string, status: string, profileId: string\) => \{([\s\S]*?)\};/;
code = code.replace(ngoUpdateRegex, `const handleNgoUpdate = async (id: string, status: string, profileId: string) => {
    try {
        const { error } = await supabase.from('ngos').update({ verification_status: status }).eq('id', id);
        if (error) throw error;
        toast.success(\`NGO \${status === 'verified' ? 'Approved' : 'Rejected'} successfully\`);
        if (profileId) {
           createNotification({ userId: profileId, type: 'system_alert', title: \`Verification \${status === 'verified' ? 'Approved' : 'Rejected'}\`, message: \`Your NGO application has been \${status}.\`, priority: status === 'verified' ? 'normal' : 'high' });
        }
    } catch (error) {
        console.error("Error updating NGO:", error);
        toast.error("Failed to update NGO");
    }
  };`);

// Fix handleRestaurantUpdate
const restUpdateRegex = /const handleRestaurantUpdate = async \(id: string, status: string, profileId: string\) => \{([\s\S]*?)\};/;
code = code.replace(restUpdateRegex, `const handleRestaurantUpdate = async (id: string, status: string, profileId: string) => {
    try {
        const { error } = await supabase.from('restaurants').update({ verification_status: status }).eq('restaurant_id', id);
        if (error) throw error;
        toast.success(\`Restaurant \${status === 'verified' ? 'Approved' : 'Rejected'} successfully\`);
        if (profileId) {
            createNotification({ userId: profileId, type: 'system_alert', title: \`Restaurant Verification \${status === 'verified' ? 'Approved' : 'Rejected'}\`, message: \`Your restaurant has been \${status}.\`, priority: status === 'verified' ? 'normal' : 'high' });
        }
    } catch (error) {
        console.error("Error updating restaurant:", error);
        toast.error("Failed to update restaurant");
    }
  };`);

// Fix the badges logic
// For NGO:
code = code.replace(
    `{n.verification_status || 'pending'}`,
    `{n.verification_status === 'verified' ? <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Verified</span> : n.verification_status === 'rejected' ? 'Rejected' : 'Verification Pending'}`
);

// For Restaurant:
code = code.replace(
    `{r.verification_status || 'pending'}`,
    `{r.verification_status === 'verified' ? <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Verified</span> : r.verification_status === 'rejected' ? 'Rejected' : 'Verification Pending'}`
);

fs.writeFileSync('src/pages/AdminFeatures.tsx', code);
