import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Utensils, Info, CheckCircle2, AlertCircle } from 'lucide-react';

const inputClass = "h-8.5 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-[#F8F9F6] dark:bg-[#15171c] px-3 text-[12px] text-slate-900 dark:text-white outline-none focus:bg-white focus:border-[#059669] focus:ring-1 focus:ring-[#059669] transition-all shadow-sm";
const labelClass = "mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400";

export function NGORequestFood() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    food_name: '',
    category: 'Cooked',
    food_type: 'Vegetarian',
    quantity_required: '',
    quantity_unit: 'kg',
    people_in_need: '',
    meals_required: '',
    required_by_date: '',
    required_by_time: '',
    urgency: 'Normal',
    notes: ''
  });

  const categories = ['Cooked', 'Packaged', 'Bakery', 'Produce', 'Dairy', 'Beverage', 'Frozen', 'Dry Goods', 'Fruits', 'Vegetables', 'Snacks', 'Other'];
  const foodTypes = ['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Egg', 'Other'];
  const urgencies = ['Normal', 'Urgent', 'Critical'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.food_name.trim()) return toast.error("Food name is required");
    if (Number(formData.quantity_required) <= 0) return toast.error("Quantity must be greater than zero");
    if (Number(formData.people_in_need) <= 0) return toast.error("People in need must be greater than zero");
    if (!formData.required_by_date) return toast.error("Required date is needed");

    setLoading(true);
    
    try {
      const requiredBy = new Date(`${formData.required_by_date}T${formData.required_by_time || '00:00'}`).toISOString();
      
      const { error } = await supabase.from('requests').insert({
        ngo_id: user.uid,
        title: formData.food_name, 
        food_name: formData.food_name,
        food_category: 'cooked_food', 
        category: formData.category,
        food_type: formData.food_type,
        required_quantity_kg: Number(formData.quantity_required),
        quantity_unit: formData.quantity_unit,
        people_in_need: Number(formData.people_in_need),
        meals_required: Number(formData.meals_required || formData.people_in_need),
        required_by: requiredBy,
        urgency: formData.urgency,
        notes: formData.notes,
        status: 'pending' 
      });

      if (error) throw error;
      
      toast.success("Food request submitted successfully.");
      navigate('/dashboard/ngo/requests');
    } catch (e: any) {
      toast.error(e.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100dvh-64px)] w-full bg-[#F8F9F6] dark:bg-[#0A0A0A] px-4 py-4 sm:px-6 flex flex-col items-center">
      <div className="w-full max-w-[1000px] flex flex-col gap-3">
        
        {/* Compact Header */}
        <div className="flex items-center justify-between shrink-0">
            <button 
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back
            </button>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5">
                New Request
            </Badge>
        </div>

        {/* Main Horizontal Rectangle Card */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_320px] overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111317] shadow-sm">
            
            {/* LEFT PANE: Dense Form */}
            <form id="request-form" onSubmit={handleSubmit} className="p-5 sm:p-6 lg:p-7 flex flex-col">
                <div className="mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <h1 className="text-[16px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Utensils className="w-4 h-4 text-[#059669]" /> Request Food & Supplies
                    </h1>
                    <p className="text-[11px] text-slate-500 mt-1">Broadcast your community's exact needs to local restaurant partners.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-x-4 gap-y-4">
                    
                    {/* Row 1 */}
                    <div className="sm:col-span-12">
                        <Label className={labelClass}>What do you need? *</Label>
                        <Input 
                            placeholder="e.g. 50 plates of Veg Biryani or Raw Rice" 
                            className={inputClass}
                            value={formData.food_name}
                            onChange={e => setFormData({...formData, food_name: e.target.value})}
                            required
                        />
                    </div>

                    {/* Row 2 */}
                    <div className="sm:col-span-6">
                        <Label className={labelClass}>Category *</Label>
                        <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                            <SelectTrigger className={inputClass}><SelectValue placeholder="Category" /></SelectTrigger>
                            <SelectContent>
                                {categories.map(c => <SelectItem className="text-[12px]" key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="sm:col-span-6">
                        <Label className={labelClass}>Dietary Type *</Label>
                        <Select value={formData.food_type} onValueChange={v => setFormData({...formData, food_type: v})}>
                            <SelectTrigger className={inputClass}><SelectValue placeholder="Food Type" /></SelectTrigger>
                            <SelectContent>
                                {foodTypes.map(c => <SelectItem className="text-[12px]" key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Row 3 */}
                    <div className="sm:col-span-6">
                        <Label className={labelClass}>Quantity Needed *</Label>
                        <div className="flex gap-2">
                            <Input 
                                type="number" min="0.1" step="0.1" placeholder="e.g. 10" 
                                className={`${inputClass} flex-1`}
                                value={formData.quantity_required}
                                onChange={e => setFormData({...formData, quantity_required: e.target.value})}
                                required
                            />
                            <Select value={formData.quantity_unit} onValueChange={v => setFormData({...formData, quantity_unit: v})}>
                                <SelectTrigger className={`${inputClass} w-[80px]`}><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem className="text-[12px]" value="kg">kg</SelectItem>
                                    <SelectItem className="text-[12px]" value="liters">liters</SelectItem>
                                    <SelectItem className="text-[12px]" value="units">units</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="sm:col-span-6">
                        <Label className={labelClass}>Urgency Level</Label>
                        <Select value={formData.urgency} onValueChange={v => setFormData({...formData, urgency: v})}>
                            <SelectTrigger className={inputClass}>
                                <SelectValue placeholder="Urgency" />
                            </SelectTrigger>
                            <SelectContent>
                                {urgencies.map(c => <SelectItem className="text-[12px]" key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Row 4 */}
                    <div className="sm:col-span-6">
                        <Label className={labelClass}>People In Need *</Label>
                        <Input 
                            type="number" min="1" placeholder="e.g. 40" 
                            className={inputClass}
                            value={formData.people_in_need}
                            onChange={e => setFormData({...formData, people_in_need: e.target.value, meals_required: e.target.value})}
                            required
                        />
                    </div>
                    <div className="sm:col-span-6">
                        <Label className={labelClass}>Est. Meals Required *</Label>
                        <Input 
                            type="number" min="1" placeholder="e.g. 40" 
                            className={inputClass}
                            value={formData.meals_required}
                            onChange={e => setFormData({...formData, meals_required: e.target.value})}
                            required
                        />
                    </div>

                    {/* Row 5 */}
                    <div className="sm:col-span-6">
                        <Label className={labelClass}>Required By (Date) *</Label>
                        <Input 
                            type="date"
                            className={inputClass}
                            value={formData.required_by_date}
                            onChange={e => setFormData({...formData, required_by_date: e.target.value})}
                            required
                            min={new Date().toISOString().split('T')[0]}
                        />
                    </div>
                    <div className="sm:col-span-6">
                        <Label className={labelClass}>Required By (Time) *</Label>
                        <Input 
                            type="time"
                            className={inputClass}
                            value={formData.required_by_time}
                            onChange={e => setFormData({...formData, required_by_time: e.target.value})}
                            required
                        />
                    </div>

                    {/* Row 6 */}
                    <div className="sm:col-span-12">
                        <Label className={labelClass}>Additional Notes / Dropoff Instructions</Label>
                        <Textarea 
                            placeholder="Specify location details, packaging preferences, or contact person..."
                            className={`${inputClass} min-h-[60px] py-2 resize-none`}
                            value={formData.notes}
                            onChange={e => setFormData({...formData, notes: e.target.value})}
                        />
                    </div>
                </div>

                <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800">
                    <Button type="submit" className="w-full sm:w-auto h-9 px-8 text-[13px] font-bold bg-[#059669] hover:bg-[#047857] text-white shadow-sm" disabled={loading}>
                        {loading ? "Submitting Request..." : "Broadcast Request"}
                    </Button>
                </div>
            </form>

            {/* RIGHT PANE: Live Summary & Guide */}
            <div className="bg-[#FAFBF9] dark:bg-[#111111] p-5 sm:p-6 lg:p-7 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 flex flex-col">
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">Request Summary</h3>
                
                {/* Live Preview Card */}
                <div className="bg-white dark:bg-[#16181D] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm mb-6">
                    <div className="flex items-center justify-between mb-2.5">
                        <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider px-2 py-0 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                            {formData.category || 'Category'}
                        </Badge>
                        {formData.urgency === 'Critical' ? (
                            <span className="flex items-center text-[10px] font-bold text-red-600"><AlertCircle className="w-3 h-3 mr-1"/> Critical</span>
                        ) : formData.urgency === 'Urgent' ? (
                            <span className="flex items-center text-[10px] font-bold text-amber-600"><AlertCircle className="w-3 h-3 mr-1"/> Urgent</span>
                        ) : null}
                    </div>
                    <h4 className="font-bold text-[14px] text-slate-900 dark:text-white leading-snug mb-1 truncate">
                        {formData.food_name || 'Your requested item'}
                    </h4>
                    <p className="text-[11px] text-slate-500 mb-3">
                        {formData.quantity_required ? `${formData.quantity_required} ${formData.quantity_unit}` : '0 kg'} • {formData.food_type}
                    </p>
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Needed for:</span>
                        <span className="font-bold text-slate-900 dark:text-white">{formData.people_in_need || '0'} people</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Guidelines</h3>
                    <div className="flex gap-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                            <strong className="text-slate-900 dark:text-slate-300">Be Specific:</strong> Mention exactly what you need to help restaurants match your request accurately.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                            <strong className="text-slate-900 dark:text-slate-300">Realistic Deadlines:</strong> Give partners enough lead time (ideally 4-6 hours) to prepare and package bulk food.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                            <strong className="text-slate-900 dark:text-slate-300">Urgency Tags:</strong> Only use 'Critical' or 'Urgent' for immediate disaster relief or severe shortages.
                        </p>
                    </div>
                </div>

                <div className="mt-auto pt-6">
                    <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-lg p-3 flex gap-2.5 items-start">
                        <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-emerald-800 dark:text-emerald-400 leading-relaxed">
                            Once submitted, this request will instantly notify all verified restaurant partners within your operational radius.
                        </p>
                    </div>
                </div>
            </div>

        </div>
      </div>
    </main>
  );
}