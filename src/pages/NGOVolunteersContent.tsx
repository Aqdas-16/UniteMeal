
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Users,
  Plus,
  Phone,
  Mail,
  UserRound,
  Bike,
  Car,
  Truck,
  Search,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

type VolunteerForm = {
  name: string;
  phone: string;
  username: string;
  password: string;
  vehicleType: string;
  vehicleNumber: string;
};

type VolunteerMember = {
  id: string;
  availability?: string | null;
  vehicle_type?: string | null;
  vehicle_plate?: string | null;
  profiles?: {
    full_name?: string | null;
    phone_number?: string | null;
    email?: string | null;
    avatar_url?: string | null;
  } | null;
  deliveries?: Array<{
    status: string;
    donations?: {
      title?: string | null;
    } | null;
  }>;
  activeDelivery?: {
    status: string;
    donations?: {
      title?: string | null;
    } | null;
  };
};

const initialForm: VolunteerForm = {
  name: '',
  phone: '',
  username: '',
  password: '',
  vehicleType: 'bicycle',
  vehicleNumber: '',
};

export function NGOVolunteersContent() {
  const { user } = useAuth();

  const [team, setTeam] = useState<VolunteerMember[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] =
    useState<VolunteerForm>(initialForm);

  const fetchTeam = useCallback(async () => {
    if (!user) {
      setTeam([]);
      setIsFetching(false);
      return;
    }

    setIsFetching(true);

    try {
      const { data, error } = await supabase
        .from('volunteers')
        .select(
          '*, profiles!inner(full_name, phone_number, email, avatar_url), deliveries(status, donations(title))'
        )
        .eq('ngo_id', user.uid)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted: VolunteerMember[] = (data ?? []).map(
        (volunteer: any) => {
          const activeDelivery = volunteer.deliveries?.find(
            (delivery: any) =>
              !['completed', 'cancelled', 'failed'].includes(
                delivery.status
              )
          );

          return {
            ...volunteer,
            activeDelivery,
          };
        }
      );

      setTeam(formatted);
    } catch (error) {
      console.error('Failed to fetch volunteers:', error);
      toast.error('Unable to load your volunteer team.');
    } finally {
      setIsFetching(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setTeam([]);
      setIsFetching(false);
      return;
    }

    void fetchTeam();

    const channel = supabase
      .channel('ngo-volunteers-list')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'volunteers',
          filter: `ngo_id=eq.${user.uid}`,
        },
        () => {
          void fetchTeam();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, fetchTeam]);

  const filteredTeam = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return team;

    return team.filter((member) => {
      const name = member.profiles?.full_name ?? '';
      const phone = member.profiles?.phone_number ?? '';
      const email = member.profiles?.email ?? '';
      const vehicle = member.vehicle_type ?? '';
      const plate = member.vehicle_plate ?? '';

      return [name, phone, email, vehicle, plate, member.id].some(
        (value) => value.toLowerCase().includes(query)
      );
    });
  }, [team, searchQuery]);

  const handleSave = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!user) {
      toast.error('Please sign in again to continue.');
      return;
    }

    if (
      !formData.name.trim() ||
      !formData.phone.trim() ||
      !formData.username.trim() ||
      !formData.password
    ) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setIsLoading(true);

    try {
      const email =
        `${formData.username.trim()}@volunteer.unitemeal.org`;

      const response = await fetch('/api/admin/create-volunteer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ngo_id: user.uid,
          ...formData,
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          username: formData.username.trim(),
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || 'Failed to create volunteer.'
        );
      }

      toast.success('Volunteer added successfully.');

      setIsAddOpen(false);
      setFormData(initialForm);

      await fetchTeam();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again.';

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const getVehicleIcon = (type?: string | null) => {
    switch (type?.toLowerCase()) {
      case 'car':
        return Car;
      case 'motorcycle':
      case 'scooter':
        return Bike;
      case 'truck':
      case 'van':
        return Truck;
      default:
        return Bike;
    }
  };

  const getVehicleLabel = (type?: string | null) => {
    const labels: Record<string, string> = {
      bicycle: 'Bicycle',
      motorcycle: 'Motorcycle',
      scooter: 'Scooter',
      car: 'Car',
      van: 'Van',
      truck: 'Truck',
    };

    return labels[type?.toLowerCase() ?? ''] ?? type ?? 'Not specified';
  };

  const getStatus = (availability?: string | null) => {
    if (availability === 'busy') {
      return {
        label: 'On delivery',
        className: 'border-amber-200 bg-amber-50 text-amber-700',
        dotClassName: 'bg-amber-500',
      };
    }

    if (availability === 'offline') {
      return {
        label: 'Offline',
        className: 'border-slate-200 bg-slate-100 text-slate-600',
        dotClassName: 'bg-slate-400',
      };
    }

    return {
      label: 'Available',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      dotClassName: 'bg-emerald-500',
    };
  };

  const updateForm = (
    field: keyof VolunteerForm,
    value: string
  ) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  return (
    <div className="min-h-full space-y-5 pb-6">
      {/* Compact heading */}
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Team Members
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your NGO delivery volunteers.
          </p>
        </div>

        <Button
          onClick={() => setIsAddOpen(true)}
          className="h-9 shrink-0 rounded-lg bg-[#176B4D] px-3 text-sm font-medium hover:bg-[#12583F]"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add Volunteer
        </Button>
      </section>

      {/* Search and member count */}
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">
          {team.length} {team.length === 1 ? 'volunteer' : 'volunteers'}
          {searchQuery.trim() &&
            ` · ${filteredTeam.length} matching`}
        </p>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search members..."
            aria-label="Search volunteers"
            className="h-9 rounded-lg border-slate-200 bg-white pl-9 text-sm shadow-none focus-visible:ring-emerald-600"
          />
        </div>
      </section>

      {/* Minimal team list: no individual cards */}
      <section className="border-y border-slate-200">
        {isFetching ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin text-emerald-700" />
            Loading team members...
          </div>
        ) : filteredTeam.length > 0 ? (
          filteredTeam.map((member) => {
            const status = getStatus(member.availability);
            const VehicleIcon = getVehicleIcon(member.vehicle_type);
            const memberName =
              member.profiles?.full_name?.trim() ||
              'Unnamed volunteer';

            return (
              <div
                key={member.id}
                className="flex flex-col gap-2.5 border-b border-slate-100 py-3 last:border-b-0 sm:flex-row sm:items-center sm:gap-4"
              >
                {/* Member */}
                <div className="flex min-w-0 items-center gap-2.5 sm:w-48 sm:shrink-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-slate-500">
                    {member.profiles?.avatar_url ? (
                      <img
                        src={member.profiles.avatar_url}
                        alt={memberName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserRound className="h-4 w-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {memberName}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      UM-VOL-
                      {String(member.id).slice(0, 4).toUpperCase()}
                    </p>
                  </div>
                </div>

                {/* Contact details */}
                <div className="grid min-w-0 flex-1 grid-cols-1 gap-1.5 text-xs sm:grid-cols-2">
                  <p className="flex min-w-0 items-center gap-2 text-slate-600">
                    <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">
                      {member.profiles?.phone_number || 'No phone'}
                    </span>
                  </p>

                  <p className="flex min-w-0 items-center gap-2 text-slate-600">
                    <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">
                      {member.profiles?.email || 'No email'}
                    </span>
                  </p>
                </div>

                {/* Vehicle */}
                <div className="flex items-center gap-2 text-xs text-slate-600 sm:w-32 sm:shrink-0">
                  <VehicleIcon className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="truncate">
                    {getVehicleLabel(member.vehicle_type)}
                  </span>
                  {member.vehicle_plate && (
                    <span className="truncate text-[10px] text-slate-400">
                      ({member.vehicle_plate})
                    </span>
                  )}
                </div>

                {/* Availability */}
                <div className="flex flex-wrap items-center gap-2 sm:w-36 sm:shrink-0 sm:justify-end">
                  <Badge
                    variant="outline"
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${status.className}`}
                  >
                    <span
                      className={`mr-1.5 h-1.5 w-1.5 rounded-full ${status.dotClassName}`}
                    />
                    {status.label}
                  </Badge>

                  {member.activeDelivery && (
                    <span className="flex items-center gap-1 text-[11px] text-amber-700">
                      <Truck className="h-3.5 w-3.5" />
                      On delivery
                    </span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-10 text-center">
            <Users className="mx-auto h-7 w-7 text-slate-300" />

            <p className="mt-2 text-sm font-medium text-slate-800">
              {searchQuery
                ? 'No matching members'
                : 'No team members yet'}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {searchQuery
                ? 'Try a different search.'
                : 'Add a volunteer to your team to get started.'}
            </p>

            {searchQuery && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="mt-3 h-8 rounded-lg"
              >
                Clear search
              </Button>
            )}
          </div>
        )}
      </section>

      {/* Add volunteer dialog */}
      <Dialog
        open={isAddOpen}
        onOpenChange={(open) => {
          if (!isLoading) {
            setIsAddOpen(open);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-xl border-slate-200 p-0 sm:max-w-[500px]">
          <div className="border-b border-slate-100 px-5 py-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-slate-900">
                Add Volunteer
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-slate-500">
                Enter the volunteer's account and transport details.
              </DialogDescription>
            </DialogHeader>
          </div>

          <form
            onSubmit={handleSave}
            className="space-y-4 px-5 py-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="volunteer-name">
                Full name <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="volunteer-name"
                required
                autoComplete="name"
                placeholder="Enter full name"
                value={formData.name}
                onChange={(event) =>
                  updateForm('name', event.target.value)
                }
                className="h-10 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="volunteer-phone">
                  Phone number <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="volunteer-phone"
                  required
                  type="tel"
                  autoComplete="tel"
                  placeholder="Phone number"
                  value={formData.phone}
                  onChange={(event) =>
                    updateForm('phone', event.target.value)
                  }
                  className="h-10 rounded-lg"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="volunteer-username">
                  Username <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="volunteer-username"
                  required
                  autoComplete="off"
                  placeholder="e.g. volunteer01"
                  value={formData.username}
                  onChange={(event) =>
                    updateForm('username', event.target.value)
                  }
                  className="h-10 rounded-lg"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="volunteer-password">
                Temporary password{' '}
                <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="volunteer-password"
                required
                type="password"
                autoComplete="new-password"
                minLength={6}
                placeholder="Create a password"
                value={formData.password}
                onChange={(event) =>
                  updateForm('password', event.target.value)
                }
                className="h-10 rounded-lg"
              />
              <p className="text-[11px] text-slate-400">
                Share the login credentials with the volunteer securely.
              </p>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-800">
                Transport details
              </h3>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="vehicle-type">Vehicle type</Label>
                  <Select
                    value={formData.vehicleType}
                    onValueChange={(value) =>
                      updateForm('vehicleType', value)
                    }
                  >
                    <SelectTrigger
                      id="vehicle-type"
                      className="h-10 rounded-lg"
                    >
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="bicycle">Bicycle</SelectItem>
                      <SelectItem value="motorcycle">
                        Motorcycle / Scooter
                      </SelectItem>
                      <SelectItem value="car">Car</SelectItem>
                      <SelectItem value="van">Van</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="vehicle-number">
                    Vehicle number
                  </Label>
                  <Input
                    id="vehicle-number"
                    placeholder="e.g. MH-02-AB-1234"
                    value={formData.vehicleNumber}
                    onChange={(event) =>
                      updateForm('vehicleNumber', event.target.value)
                    }
                    className="h-10 rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={isLoading}
                onClick={() => setIsAddOpen(false)}
                className="h-9 rounded-lg"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={isLoading}
                className="h-9 rounded-lg bg-[#176B4D] hover:bg-[#12583F]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <Plus className="mr-1.5 h-4 w-4" />
                    Create Volunteer
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
