import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function RestaurantRating({ donorId, showCount = false }: { donorId: string, showCount?: boolean }) {
    const [rating, setRating] = useState<number>(0);
    const [count, setCount] = useState<number>(0);

    useEffect(() => {
        if (!donorId) return;
        const fetchRating = async () => {
            const { data: rData } = await supabase.rpc('get_restaurant_rating', { restaurant_uuid: donorId });
            const { data: cData } = await supabase.rpc('get_restaurant_rating_count', { restaurant_uuid: donorId });
            if (rData !== null) setRating(Number(rData));
            if (cData !== null) setCount(Number(cData));
        };
        fetchRating();
    }, [donorId]);

    if (count === 0) return <span className="text-slate-400 text-xs italic">No ratings yet</span>;

    return (
        <div className="flex items-center gap-1">
            <span className="flex items-center text-amber-500 font-medium">
                <Star className="w-3 h-3 mr-0.5 fill-current" /> {rating.toFixed(1)}
            </span>
            {showCount && <span className="text-slate-400 text-xs">({count})</span>}
        </div>
    );
}
