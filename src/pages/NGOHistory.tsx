import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Download,
  Clock,
  MapPin,
  Star,
} from 'lucide-react';
import { format, isValid } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const STATUS_LABELS: Record<string, string> = {
  completed: 'Completed',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  failed: 'Failed',
  rejected: 'Rejected',
};

function statusClasses(status: string) {
  if (status === 'completed' || status === 'delivered') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300';
  }
  if (status === 'cancelled' || status === 'failed' || status === 'rejected') {
    return 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300';
  }
  return 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300';
}

export function NGOHistory() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ratingDelivery, setRatingDelivery] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const fetchHistory = async () => {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('deliveries')
        .select(`
          *,
          donations!inner(*),
          volunteers(profiles(full_name))
        `)
        .eq('ngo_id', user.uid)
        .in('status', ['completed', 'cancelled', 'failed', 'delivered', 'rejected'])
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Failed to load donation history:', error.message);
        if (!cancelled) {
          toast.error('Could not load donation history');
          setTasks([]);
          setIsLoading(false);
        }
        return;
      }

      const enhanced = await Promise.all(
        (data ?? []).map(async (delivery: any) => {
          const donorId = delivery.donations?.donor_id;
          if (!donorId) {
            return { ...delivery, restaurantName: 'Restaurant' };
          }

          const [{ data: restaurantData }, { data: profileData }] = await Promise.all([
            supabase
              .from('restaurants')
              .select('business_name')
              .eq('user_id', donorId)
              .maybeSingle(),
            supabase
              .from('profiles')
              .select('full_name')
              .eq('id', donorId)
              .maybeSingle(),
          ]);

          return {
            ...delivery,
            restaurantName:
              restaurantData?.business_name || profileData?.full_name || 'Restaurant',
          };
        }),
      );

      if (!cancelled) {
        setTasks(enhanced);
        setIsLoading(false);
      }
    };

    fetchHistory();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const filteredTasks = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return tasks.filter((task) => {
      const food = String(task.donations?.title ?? '').toLowerCase();
      const restaurant = String(task.restaurantName ?? '').toLowerCase();
      const volunteer = String(
        task.volunteers?.profiles?.full_name ?? '',
      ).toLowerCase();

      const matchesSearch =
        !query ||
        food.includes(query) ||
        restaurant.includes(query) ||
        volunteer.includes(query);

      const matchesStatus =
        statusFilter === 'all' || task.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [tasks, searchTerm, statusFilter]);


  const downloadCSV = () => {
    const headers = ['Date', 'Restaurant', 'Food', 'Quantity', 'Status', 'Volunteer', 'Rating'];
    const escapeCsv = (value: unknown) =>
      `"${String(value ?? '').replace(/"/g, '""')}"`;

    const csvContent = [
      headers.map(escapeCsv).join(','),
      ...filteredTasks.map((task) =>
        [
          task.updated_at ? format(new Date(task.updated_at), 'yyyy-MM-dd HH:mm') : '',
          task.restaurantName,
          task.donations?.title,
          task.donations?.quantity_kg ?? task.donations?.quantity ?? 0,
          task.status,
          task.volunteers?.profiles?.full_name ?? '',
          task.ngo_rating ?? '',
        ]
          .map(escapeCsv)
          .join(','),
      ),
    ].join('\n');

    const blob = new Blob(['\uFEFF', csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ngo_history.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const submitRating = async () => {
    if (!ratingDelivery || !rating) {
      toast.error('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase
      .from('deliveries')
      .update({ ngo_rating: rating, ngo_feedback: feedback.trim() || null })
      .eq('id', ratingDelivery.id);

    setIsSubmitting(false);

    if (error) {
      toast.error('Failed to submit feedback');
      return;
    }

    toast.success('Thank you for your feedback!');
    setTasks((current) =>
      current.map((task) =>
        task.id === ratingDelivery.id
          ? { ...task, ngo_rating: rating, ngo_feedback: feedback.trim() || null }
          : task,
      ),
    );
    setRatingDelivery(null);
    setRating(0);
    setFeedback('');
  };

  return (
    <main className="min-h-[calc(100dvh-64px)] w-full bg-[#F7F9F6] font-sans text-slate-900 dark:bg-[#0A0F0C] dark:text-slate-100">
      <div className="w-full px-3 py-4 sm:px-5 lg:px-6 2xl:px-8">
        {/* Wide page header */}
        <header className="mb-5 flex flex-col gap-3 border-b border-[#E1E8E0] pb-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
              Donation history
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Review completed, cancelled, and unsuccessful pickups.
            </p>
          </div>
          <Button
            onClick={downloadCSV}
            variant="outline"
            className="h-10 w-full rounded-lg border-[#D7E2D7] bg-white px-4 text-sm font-semibold shadow-none hover:bg-[#F2F7F1] sm:w-auto dark:border-slate-700 dark:bg-[#121915] dark:hover:bg-slate-800"
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </header>

        {/* Full-width history table */}
        <section className="w-full overflow-hidden border-y border-[#DDE6DC] bg-white dark:border-slate-800 dark:bg-[#111713]">
          <div className="flex flex-col gap-4 border-b border-[#E5EBE3] px-4 py-4 dark:border-slate-800 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950 dark:text-white">
                All records
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Showing {filteredTasks.length} of {tasks.length} donations
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-[760px]">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search food, restaurant, or volunteer"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="h-11 rounded-xl border-[#DCE5DA] bg-white pl-10 text-sm shadow-none focus-visible:ring-[#176B4D] dark:border-slate-700 dark:bg-[#0D130F]"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-11 w-full rounded-xl border-[#DCE5DA] bg-white text-sm shadow-none sm:w-[190px] dark:border-slate-700 dark:bg-[#0D130F]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[900px] table-fixed border-collapse">
              <colgroup>
                <col className="w-[27%]" />
                <col className="w-[24%]" />
                <col className="w-[22%]" />
                <col className="w-[12%]" />
                <col className="w-[15%]" />
              </colgroup>
              <thead>
                <tr className="bg-[#F8FAF7] text-left dark:bg-[#0D130F]">
                  <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Donation & status
                  </th>
                  <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Partner & driver
                  </th>
                  <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Date & time
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Quantity
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Rating
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EDE7] dark:divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center text-sm text-slate-500">
                      Loading donation history…
                    </td>
                  </tr>
                ) : filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center">
                      <div className="mx-auto flex max-w-md flex-col items-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EDF4EC] text-[#176B4D] dark:bg-slate-800 dark:text-emerald-400">
                          {searchTerm || statusFilter !== 'all' ? (
                            <Search className="h-6 w-6" />
                          ) : (
                            <PackageCheck className="h-6 w-6" />
                          )}
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {searchTerm || statusFilter !== 'all'
                            ? 'No matching records'
                            : 'No donation history yet'}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                          {searchTerm || statusFilter !== 'all'
                            ? 'Try another search term or change the status filter.'
                            : 'Completed and unsuccessful pickups will appear here.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => {
                    const quantity =
                      task.donations?.quantity_kg ?? task.donations?.quantity ?? 0;
                    const hasKg = task.donations?.quantity_kg != null;

                    return (
                      <tr
                        key={task.id}
                        className="transition-colors hover:bg-[#FAFCF9] dark:hover:bg-[#172019]"
                      >
                        <td className="px-5 py-4 align-middle">
                          <div className="flex min-w-0 items-start">
                            <div className="min-w-0">
                              <p className="truncate text-base font-bold text-slate-950 dark:text-white">
                                {task.donations?.title || task.donations?.food_name || 'Food donation'}
                              </p>
                              <span className={`mt-2 inline-flex rounded-md border px-2 py-1 text-[11px] font-semibold ${statusClasses(task.status)}`}>
                                {STATUS_LABELS[task.status] || task.status}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 align-middle">
                          <div className="space-y-1.5">
                            <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                              <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                              <span className="truncate">{task.restaurantName}</span>
                            </div>
                            <div className="truncate pl-6 text-sm text-slate-500 dark:text-slate-400">
                              {task.volunteers?.profiles?.full_name || 'Driver not assigned'}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 align-middle">
                          <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                            <div>
                              <p className="font-medium text-slate-800 dark:text-slate-200">
                                {task.updated_at && isValid(new Date(task.updated_at))
                                  ? format(new Date(task.updated_at), 'MMM d, yyyy')
                                  : 'Date unavailable'}
                              </p>
                              <p className="mt-1 text-slate-500 dark:text-slate-400">
                                {task.updated_at && isValid(new Date(task.updated_at))
                                  ? format(new Date(task.updated_at), 'h:mm a')
                                  : '—'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right align-middle">
                          <span className="whitespace-nowrap text-base font-bold text-slate-900 dark:text-white">
                            {quantity} {hasKg ? 'kg' : 'items'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right align-middle">
                          {task.ngo_rating ? (
                            <span className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                              <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                              {task.ngo_rating}/5
                            </span>
                          ) : task.status === 'completed' || task.status === 'delivered' ? (
                            <Button
                              variant="outline"
                              onClick={() => setRatingDelivery(task)}
                              className="h-10 rounded-lg border-[#D8E4D6] bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-[#F1F7F0] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                            >
                              <Star className="mr-2 h-4 w-4 text-amber-500" />
                              Rate pickup
                            </Button>
                          ) : (
                            <span className="text-sm text-slate-400">Not applicable</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {!isLoading && filteredTasks.length > 0 && (
            <footer className="flex flex-col gap-2 border-t border-[#E5EBE3] bg-[#FBFCFA] px-5 py-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-[#0D130F] sm:flex-row sm:items-center sm:justify-between">
              <span>
                Displaying <strong className="font-semibold text-slate-700 dark:text-slate-200">{filteredTasks.length}</strong> record{filteredTasks.length === 1 ? '' : 's'}
              </span>
              <span>Export includes the currently filtered records.</span>
            </footer>
          )}
        </section>
      </div>

      <Dialog
        open={!!ratingDelivery}
        onOpenChange={(open) => {
          if (!open) {
            setRatingDelivery(null);
            setRating(0);
            setFeedback('');
          }
        }}
      >
        <DialogContent className="overflow-hidden rounded-2xl border-slate-200 bg-white p-0 shadow-xl dark:border-slate-800 dark:bg-[#111713] sm:max-w-[460px]">
          <DialogHeader className="border-b border-[#E7ECE5] px-6 py-5 text-left dark:border-slate-800">
            <DialogTitle className="text-xl font-bold text-slate-950 dark:text-white">
              Rate your pickup
            </DialogTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Share feedback about the donor and handover experience.
            </p>
          </DialogHeader>
          <div className="space-y-5 p-6">
            <div className="rounded-xl bg-[#F7F9F6] p-4 dark:bg-[#0D130F]">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {ratingDelivery?.donations?.title || 'Food donation'}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {ratingDelivery?.restaurantName || 'Restaurant'}
              </p>
            </div>
            <div>
              <p className="mb-3 text-center text-sm font-semibold text-slate-700 dark:text-slate-300">
                How would you rate this experience?
              </p>
              <div className="flex justify-center gap-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    aria-label={`Rate ${star} out of 5`}
                    aria-pressed={rating === star}
                    onClick={() => setRating(star)}
                    className="rounded-lg p-2 transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        rating >= star
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Additional feedback <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <Textarea
                placeholder="How was the food quality and pickup experience?"
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                className="min-h-[110px] resize-y rounded-xl border-[#DCE5DA] bg-white text-sm dark:border-slate-700 dark:bg-[#0D130F]"
              />
            </div>
            <Button
              onClick={submitRating}
              disabled={isSubmitting || !rating}
              className="h-11 w-full rounded-xl bg-[#176B4D] text-sm font-semibold text-white hover:bg-[#12563E]"
            >
              {isSubmitting ? 'Submitting feedback…' : 'Submit rating'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
