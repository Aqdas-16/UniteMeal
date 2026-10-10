const fs = require('fs');

let content = fs.readFileSync('src/pages/DonorProfile.tsx', 'utf-8');

// Replace handleSave
content = content.replace(/const handleSave = async \(\) => \{[\s\S]*?toast\.error\('Business Name and Address are required'\);[\s\S]*?\}\s*catch \(error: any\) \{[\s\S]*?toast\.error\(error\.message \|\| 'Failed to update profile'\);\s*\}\s*finally\s*\{\s*setIsSaving\(false\);\s*\}\s*\};/m, 
`const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);
        setSaveStatus('saving');

        try {
            if (!formData.business_name || !formData.address) {
                toast.error('Business Name and Address are required');
                setSaveStatus('failed');
                setIsSaving(false);
                return;
            }

            const updates = {
                business_name: formData.business_name,
                owner_name: formData.owner_name,
                email: formData.email,
                phone: formData.phone,
                website: formData.website,
                description: formData.description,
                address: formData.address,
                city: formData.city,
                state: formData.state,
                pincode: formData.pincode,
                latitude: formData.latitude ? parseFloat(formData.latitude) : null,
                longitude: formData.longitude ? parseFloat(formData.longitude) : null,
                place_id: formData.place_id,
                gst_number: formData.gst_number,
                fssai_number: formData.fssai_number,
                updated_at: new Date().toISOString(),
                location_verification_status: formData.verification_status || 'pending'
            };

            // Identify existing restaurant profile
            const { data: existingRests, error: checkError } = await supabase.from('restaurants').select('restaurant_id').eq('user_id', user.uid).limit(1);
            if (checkError) throw checkError;
            
            if (existingRests && existingRests.length > 0) {
                const { error: updateError } = await supabase.from('restaurants').update(updates).eq('restaurant_id', existingRests[0].restaurant_id);
                if (updateError) throw updateError;
            } else {
                // User explicitly asked to NEVER insert a duplicate profile, but if it doesn't exist at all, we must insert.
                const { error: insertError } = await supabase.from('restaurants').insert([{ user_id: user.uid, ...updates }]);
                if (insertError) throw insertError;
            }

            // Also update donors table if it exists so they don't get out of sync
            const { data: existingDonor } = await supabase.from('donors').select('id').eq('id', user.uid).limit(1);
            if (existingDonor && existingDonor.length > 0) {
                await supabase.from('donors').update({
                    organization_name: formData.business_name,
                    address: formData.address,
                    city: formData.city,
                    state: formData.state,
                    zip_code: formData.pincode,
                    location_lat: formData.latitude ? parseFloat(formData.latitude) : null,
                    location_lng: formData.longitude ? parseFloat(formData.longitude) : null,
                }).eq('id', user.uid);
            }

            await createAuditLog({ entityName: 'profiles', entityId: user.uid, action: 'updated', performedBy: user.uid, changes: { source: 'manual' } });
            
            setSaveStatus('saved');
            toast.success('Profile updated successfully');
            setHasChanges(false);
            setIsEditing(false);
            
            // Immediately fetch the updated row from Supabase
            await fetchRestaurantData();
            
            if (refreshProfile) {
                await refreshProfile();
            }
        } catch (error: any) {
            console.error('Error saving restaurant data:', error);
            setSaveStatus('failed');
            toast.error(error.message || 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };`);

// Also fix fetchRestaurantData to prefer restData for all fields
content = content.replace(/business_name: restData\?\.business_name \|\| donorData\?\.organization_name \|\| formData\.business_name,[\s\S]*?fssai_number: restData\?\.fssai_number \|\| '',/m, 
`business_name: restData?.business_name || donorData?.organization_name || formData.business_name,
                    owner_name: restData?.owner_name || '',
                    email: restData?.email || user.email || '',
                    phone: restData?.phone || '',
                    website: restData?.website || '',
                    description: restData?.description || '',
                    address: restData?.address || donorData?.address || '',
                    city: restData?.city || donorData?.city || '',
                    state: restData?.state || donorData?.state || '',
                    pincode: restData?.pincode || donorData?.zip_code || '',
                    latitude: restData?.latitude?.toString() || donorData?.location_lat?.toString() || '',
                    longitude: restData?.longitude?.toString() || donorData?.location_lng?.toString() || '',
                    place_id: restData?.place_id || '',
                    gst_number: restData?.gst_number || '',
                    fssai_number: restData?.fssai_number || '',
                    verification_status: restData?.location_verification_status || 'pending',`);

fs.writeFileSync('src/pages/DonorProfile.tsx', content);
