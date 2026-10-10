const fs = require('fs');

let content = fs.readFileSync('src/pages/DonorProfile.tsx', 'utf-8');

// Replace handleSave signature
content = content.replace(
    `const handleSave = async () => {`,
    `const handleSave = async (locationOverrides?: any) => {\n        const currentData = { ...formData, ...locationOverrides };`
);

// Replace formData usage inside updates
content = content.replace(
    `            const updates = {
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
            };`,
    `            const updates = {
                business_name: currentData.business_name,
                owner_name: currentData.owner_name,
                email: currentData.email,
                phone: currentData.phone,
                website: currentData.website,
                description: currentData.description,
                address: currentData.address,
                city: currentData.city,
                state: currentData.state,
                pincode: currentData.pincode,
                latitude: currentData.latitude ? parseFloat(currentData.latitude) : null,
                longitude: currentData.longitude ? parseFloat(currentData.longitude) : null,
                place_id: currentData.place_id,
                gst_number: currentData.gst_number,
                fssai_number: currentData.fssai_number,
                updated_at: new Date().toISOString(),
                location_verification_status: currentData.verification_status || 'pending'
            };`
);

// Replace formData usage inside donors update
content = content.replace(
    `                await supabase.from('donors').update({
                    organization_name: formData.business_name,
                    address: formData.address,
                    city: formData.city,
                    state: formData.state,
                    zip_code: formData.pincode,
                    location_lat: formData.latitude ? parseFloat(formData.latitude) : null,
                    location_lng: formData.longitude ? parseFloat(formData.longitude) : null,
                }).eq('id', user.uid);`,
    `                await supabase.from('donors').update({
                    organization_name: currentData.business_name,
                    address: currentData.address,
                    city: currentData.city,
                    state: currentData.state,
                    zip_code: currentData.pincode,
                    location_lat: currentData.latitude ? parseFloat(currentData.latitude) : null,
                    location_lng: currentData.longitude ? parseFloat(currentData.longitude) : null,
                }).eq('id', user.uid);`
);

// Replace LocationEditor usage
content = content.replace(
    `<LocationEditor 
        data={{
            address: formData.address || '',
            city: formData.city || '',
            state: formData.state || '',
            postal_code: formData.pincode || '',
            latitude: formData.latitude || null,
            longitude: formData.longitude || null
        }}
        onChange={(updates) => {
            const mappedUpdates = { ...updates } as any;
            if (mappedUpdates.postal_code !== undefined) {
                mappedUpdates.pincode = mappedUpdates.postal_code;
                delete mappedUpdates.postal_code;
            }
            setFormData(prev => ({ ...prev, ...mappedUpdates }));
            setHasChanges(true);
            setSaveStatus('unsaved');
        }}
    />`,
    `<LocationEditor 
        data={{
            address: formData.address || '',
            city: formData.city || '',
            state: formData.state || '',
            postal_code: formData.pincode || '',
            latitude: formData.latitude || null,
            longitude: formData.longitude || null
        }}
        onChange={(updates) => {
            const mappedUpdates = { ...updates } as any;
            if (mappedUpdates.postal_code !== undefined) {
                mappedUpdates.pincode = mappedUpdates.postal_code;
                delete mappedUpdates.postal_code;
            }
            setFormData(prev => ({ ...prev, ...mappedUpdates }));
            setHasChanges(true);
            setSaveStatus('unsaved');
        }}
        onSave={async (mergedData) => {
            const mappedUpdates = { ...mergedData } as any;
            if (mappedUpdates.postal_code !== undefined) {
                mappedUpdates.pincode = mappedUpdates.postal_code;
                delete mappedUpdates.postal_code;
            }
            setFormData(prev => ({ ...prev, ...mappedUpdates }));
            await handleSave(mappedUpdates);
        }}
    />`
);

fs.writeFileSync('src/pages/DonorProfile.tsx', content);
