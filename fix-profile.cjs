const fs = require('fs');
let code = fs.readFileSync('src/pages/DonorProfile.tsx', 'utf-8');

// Fix fetchRestaurantData
code = code.replace(
    /const \{ data: restData \} = await supabase\.from\('restaurants'\)\.select\('\*'\)\.eq\('user_id', user\.uid\)\.maybeSingle\(\);/,
    `const { data: restDataArr } = await supabase.from('restaurants').select('*').eq('user_id', user.uid).order('updated_at', { ascending: false }).limit(1);
            const restData = restDataArr?.[0];`
);

// Fix handleSave existing check
code = code.replace(
    /const \{ data: existingRest \} = await supabase\.from\('restaurants'\)\.select\('id'\)\.eq\('user_id', user\.uid\)\.maybeSingle\(\);/,
    `const { data: existingRests } = await supabase.from('restaurants').select('restaurant_id').eq('user_id', user.uid).limit(1);
            const existingRest = existingRests?.[0];`
);

fs.writeFileSync('src/pages/DonorProfile.tsx', code);
