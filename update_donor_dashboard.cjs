const fs = require('fs');
let code = fs.readFileSync('src/pages/DonorDashboard.tsx', 'utf8');

// Replace fetchDashboardData logic and add realtime
const target = `    const fetchDashboardData = async () => {
        const { data: donations, error } = await supabase
            .from('donations')
            .select('*')
            .eq('donor_id', user.uid);
            
        if (error || !donations) {
            // Ignore missing table (42P01) or RLS (42501) errors for clean console
            if (error && !['42P01', '42501'].includes(error.code)) {
                console.error("Error fetching donations:", error);
            }
            setMetricsLoading(false);
            return;
        }

        // Sort manually by created_at
        donations.sort((a: any, b: any) => {
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return dateB - dateA; // descending
        });
        
        const active = donations.filter((d: any) => !['delivered', 'cancelled'].includes(d.status));
        setActiveDonations(active);
        setRecentDonations(donations.slice(0, 5));

        let totalMeals = 0;
        let totalKg = 0;
        let pickups = 0;
        const uniqueNgos = new Set();
        
        donations.forEach((d: any) => {
            if (d.status === 'delivered') {
                totalMeals += Number(d.estimated_meals || 0);
                totalKg += Number(d.quantity_kg || 0);
                pickups++;
                if (d.ngo_id) uniqueNgos.add(d.ngo_id);
            }
        });
        
        setMealsDonated(totalMeals);
        setTotalFood(totalKg);
        setPickupsCompleted(pickups);
        setCarbonSaved(+(totalKg * 2.5).toFixed(1)); 
        setNgosSupported(uniqueNgos.size);
        
        setMetricsLoading(false);
    };`;

const replacement = `    const fetchDashboardData = async () => {
        const { data: donations, error } = await supabase
            .from('donations')
            .select('*')
            .eq('donor_id', user.uid);
            
        if (error || !donations) {
            if (error && !['42P01', '42501'].includes(error.code)) {
                console.error("Error fetching donations:", error);
            }
            setMetricsLoading(false);
            return;
        }

        donations.sort((a: any, b: any) => {
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return dateB - dateA;
        });
        
        const active = donations.filter((d: any) => d.status === 'available');
        setActiveDonations(active);
        setRecentDonations(donations);

        let totalMeals = 0;
        let totalKg = 0;
        let pickups = 0;
        const uniqueNgos = new Set();
        
        donations.forEach((d: any) => {
            if (d.status !== 'cancelled') {
                totalMeals += Number(d.estimated_meals || 0);
                totalKg += Number(d.quantity_kg || 0);
            }
            if (d.status === 'completed' || d.status === 'delivered') {
                pickups++;
                if (d.ngo_id) uniqueNgos.add(d.ngo_id);
            }
        });
        
        setMealsDonated(totalMeals);
        setTotalFood(totalKg);
        setPickupsCompleted(pickups);
        setCarbonSaved(+(totalKg * 2.5).toFixed(1)); 
        setNgosSupported(uniqueNgos.size);
        
        setMetricsLoading(false);
    };`;

code = code.replace(target, replacement);

const targetEffect = `    fetchDashboardData();
  }, [user]);`;

const replacementEffect = `    fetchDashboardData();
    
    const channel = supabase.channel('donor_dashboard_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'donations', filter: \`donor_id=eq.\${user.uid}\` }, () => {
            fetchDashboardData();
        })
        .subscribe();
        
    return () => {
        supabase.removeChannel(channel);
    };
  }, [user]);`;

code = code.replace(targetEffect, replacementEffect);
fs.writeFileSync('src/pages/DonorDashboard.tsx', code);
