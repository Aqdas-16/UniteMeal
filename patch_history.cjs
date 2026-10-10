const fs = require('fs');
let code = fs.readFileSync('src/pages/NGOHistory.tsx', 'utf8');

if (!code.includes('import { Dialog')) {
    code = code.replace("import { format } from 'date-fns';", "import { format } from 'date-fns';\nimport { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';\nimport { Star, MessageSquare } from 'lucide-react';\nimport { Textarea } from '@/components/ui/textarea';\nimport { toast } from 'sonner';");
}

if (!code.includes('const [ratingDelivery')) {
    code = code.replace("const [statusFilter, setStatusFilter] = useState('all');", "const [statusFilter, setStatusFilter] = useState('all');\n  const [ratingDelivery, setRatingDelivery] = useState<any>(null);\n  const [rating, setRating] = useState(0);\n  const [feedback, setFeedback] = useState('');\n  const [isSubmitting, setIsSubmitting] = useState(false);\n\n  const submitRating = async () => {\n    if (!rating) return toast.error('Please select a rating');\n    setIsSubmitting(true);\n    const { error } = await supabase.from('deliveries').update({ ngo_rating: rating, ngo_feedback: feedback }).eq('id', ratingDelivery.id);\n    setIsSubmitting(false);\n    if (error) return toast.error('Failed to submit feedback');\n    toast.success('Thank you for your feedback!');\n    setTasks(tasks.map(t => t.id === ratingDelivery.id ? { ...t, ngo_rating: rating, ngo_feedback: feedback } : t));\n    setRatingDelivery(null);\n    setRating(0);\n    setFeedback('');\n  };");
}

code = code.replace(
    '<div className="text-right">',
    `<div className="text-right flex flex-col items-end gap-2">`
);

code = code.replace(
    '<div className="text-xs text-slate-500">Total Quantity</div>',
    `<div className="text-xs text-slate-500">Total Quantity</div>\n                  {task.status === 'completed' && !task.ngo_rating && (\n                     <Button variant="outline" size="sm" onClick={() => setRatingDelivery(task)} className="mt-2 h-8 text-xs"><Star className="w-3 h-3 mr-1"/> Rate Donor</Button>\n                  )}\n                  {task.ngo_rating && (\n                     <div className="flex items-center text-amber-500 text-xs font-bold mt-2"><Star className="w-3 h-3 mr-1 fill-amber-500"/> {task.ngo_rating} / 5</div>\n                  )}`
);

if (!code.includes('<Dialog open={!!ratingDelivery}')) {
    code = code.replace(
        '</div>\n  );\n}',
        `</div>\n      <Dialog open={!!ratingDelivery} onOpenChange={() => setRatingDelivery(null)}>\n        <DialogContent>\n          <DialogHeader>\n            <DialogTitle>Rate Restaurant / Donor</DialogTitle>\n          </DialogHeader>\n          <div className="py-4 space-y-4">\n            <div className="flex justify-center gap-2">\n               {[1,2,3,4,5].map(star => (\n                 <button key={star} onClick={() => setRating(star)} className={\`p-2 rounded-full transition-colors \${rating >= star ? 'text-amber-500' : 'text-slate-300'}\`}>\n                    <Star className={\`w-8 h-8 \${rating >= star ? 'fill-amber-500' : ''}\`}/>\n                 </button>\n               ))}\n            </div>\n            <div className="space-y-2">\n               <label className="text-sm font-medium">Additional Feedback (Optional)</label>\n               <Textarea placeholder="How was the food quality?..." value={feedback} onChange={e => setFeedback(e.target.value)} />\n            </div>\n            <Button onClick={submitRating} disabled={isSubmitting || !rating} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">Submit Feedback</Button>\n          </div>\n        </DialogContent>\n      </Dialog>\n    </div>\n  );\n}`
    );
}

fs.writeFileSync('src/pages/NGOHistory.tsx', code);
