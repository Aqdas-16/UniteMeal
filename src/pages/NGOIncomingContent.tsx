import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DonationDetailsModal } from '../components/dashboard/DonationDetailsModal';
import { AssignVolunteerModal } from '../components/dashboard/AssignVolunteerModal';
import {
  MapPin,
  Package,
  Search,
  Maximize2,
  Minimize2,
  Clock3,
  Navigation,
  Utensils,
  ArrowUpRight,
} from 'lucide-react';
import { Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { MapProvider as APIProvider } from '@/src/components/MapProvider';

const API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  '';

type NgoLocation = { lat: number; lng: number };

function getDistanceFromLatLonInKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getDonationCoordinates(donation: any): NgoLocation | null {
  const lat = Number(
    donation.pickup_latitude ?? donation.pickup_lat ?? donation.latitude,
  );
  const lng = Number(
    donation.pickup_longitude ?? donation.pickup_lng ?? donation.longitude,
  );

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat === 0 && lng === 0) return null;
  return { lat, lng };
}

export function NGOIncomingContent() {
  const { user } = useAuth();
  const [donations, setDonations] = useState<any[]>([]);
  const [ngoLocation, setNgoLocation] = useState<NgoLocation | null>(null);
  const [viewingDonation, setViewingDonation] = useState<any>(null);
  const [assigningDonation, setAssigningDonation] = useState<any>(null);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const fetchNgo = async () => {
      const { data, error } = await supabase
        .from('ngos')
        .select('location_lat, location_lng')
        .eq('id', user.uid)
        .maybeSingle();

      if (cancelled) return;

      if (!error && data?.location_lat != null && data?.location_lng != null) {
        setNgoLocation({
          lat: Number(data.location_lat),
          lng: Number(data.location_lng),
        });
      } else {
        setNgoLocation({ lat: 19.076, lng: 72.8777 });
      }
    };

    fetchNgo();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const fetchDonations = useCallback(async () => {
    if (!user || !ngoLocation) return;

    setIsLoading(true);

    const { data, error } = await supabase
      .from('donations')
      .select(
        '*, donors:donor_id(organization_name), profiles:restaurant_id(full_name, avatar_url), donation_images(image_url)',
      )
      .eq('status', 'available')
      .or(`ngo_id.eq.${user.uid},ngo_id.is.null`);

    if (error) {
      console.error('Unable to load available donations:', error.message);
      setIsLoading(false);
      return;
    }

    const now = new Date();

    const valid = (data ?? [])
      .filter((donation: any) => {
        if (!donation.expiry_time) return true;
        return new Date(donation.expiry_time).getTime() >= now.getTime();
      })
      .map((donation: any) => {
        const coordinates = getDonationCoordinates(donation);
        const distance = coordinates
          ? getDistanceFromLatLonInKm(
              ngoLocation.lat,
              ngoLocation.lng,
              coordinates.lat,
              coordinates.lng,
            )
          : null;

        return { ...donation, distance, coordinates };
      })
      .sort((a: any, b: any) => {
        if (a.distance == null) return 1;
        if (b.distance == null) return -1;
        return a.distance - b.distance;
      });

    setDonations(valid);
    setIsLoading(false);
  }, [user, ngoLocation]);

  useEffect(() => {
    if (!ngoLocation) return;

    fetchDonations();

    const channel = supabase
      .channel('ngo-donations-available')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'donations' },
        () => {
          fetchDonations();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ngoLocation, fetchDonations]);

  const openAcceptFlow = (donation: any) => {
    setViewingDonation(null);
    setAssigningDonation(donation);
  };

  const mapContainerClass = isMapFullscreen
    ? 'fixed inset-0 z-50 rounded-none'
    : 'relative min-h-[440px] h-full rounded-2xl lg:min-h-0';

  return (
    <main className="min-h-[calc(100dvh-64px)] w-full bg-[#F8F9F6] text-slate-900 dark:bg-[#0B100D] dark:text-slate-100">
      <div className="mx-auto flex w-full max-w-[1920px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
        {/* Compact header matching request spacing */}
        <header className="flex flex-col gap-3 border-b border-[#E1E7DF] pb-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
              Available donations
            </h1>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 sm:text-sm">
              Find surplus food nearby, review pickup details, and coordinate collection from one workspace.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <div className="rounded-lg border border-[#D7E5DA] bg-white px-3 py-2 dark:border-slate-700 dark:bg-[#121915]">
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Available now
              </p>
              <p className="mt-0.5 text-xl font-bold tabular-nums text-[#176B4D] dark:text-emerald-400">
                {donations.length}
              </p>
            </div>
            <Badge
              variant="outline"
              className="flex h-fit items-center gap-1.5 rounded-full border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300"
            >
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              Live updates
            </Badge>
          </div>
        </header>

        {/* Wide workspace: large list and substantial map */}
        <section
          className={`grid w-full grid-cols-1 items-stretch gap-6 ${
            isMapFullscreen
              ? 'lg:grid-cols-1'
              : 'lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)] 2xl:grid-cols-[minmax(0,1.12fr)_minmax(520px,0.88fr)]'
          }`}
        >
          {/* Donation list */}
          {!isMapFullscreen && (
            <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#E1E7DF] bg-white shadow-[0_2px_10px_rgba(24,55,35,0.04)] dark:border-slate-800 dark:bg-[#111713]">
              <div className="flex flex-col gap-2 border-b border-[#E8EDE7] px-4 py-3.5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Donation feed
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Sorted by distance from your NGO
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <Navigation className="h-3.5 w-3.5 text-[#176B4D]" />
                  Nearest first
                </div>
              </div>

              <div className="min-h-[420px] flex-1 divide-y divide-[#E9EEE8] dark:divide-slate-800">
                {isLoading ? (
                  <div className="flex min-h-[420px] items-center justify-center px-6 text-sm text-slate-500">
                    Loading available donations…
                  </div>
                ) : donations.length === 0 ? (
                  <div className="flex min-h-[420px] flex-col items-center justify-center px-6 py-16 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EFF5EF] dark:bg-slate-800">
                      <Search className="h-6 w-6 text-[#176B4D] dark:text-emerald-400" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      No donations available
                    </h3>
                    <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">
                      New food donations will appear here when they become available. Keep this page open for live updates.
                    </p>
                  </div>
                ) : (
                  donations.map((donation) => {
                    const imageUrl =
                      donation.donation_images?.[0]?.image_url ||
                      donation.profiles?.avatar_url;
                    const expiry = donation.expiry_time || donation.pickup_end;

                    return (
                      <article
                        key={donation.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setViewingDonation(donation)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            setViewingDonation(donation);
                          }
                        }}
                        className="group grid cursor-pointer grid-cols-1 gap-4 px-4 py-4 transition-colors hover:bg-[#FAFCF9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#176B4D] dark:hover:bg-[#172019] sm:px-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(130px,0.65fr)] 2xl:grid-cols-[minmax(0,1.15fr)_minmax(140px,0.65fr)_minmax(135px,0.65fr)]"
                      >
                        <div className="flex min-w-0 items-start gap-3.5">
                          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[#E1E7DF] bg-[#F1F4EF] dark:border-slate-700 dark:bg-slate-800 sm:h-20 sm:w-20">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={donation.title || donation.food_name || 'Donation'}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <Package className="h-6 w-6 text-slate-400" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="mb-2 flex  min-w-0 flex-wrap items-center gap-2">
                              <Badge className="rounded-md bg-[#EAF4EC] text-[10px] font-semibold text-[#176B4D] hover:bg-[#EAF4EC] dark:bg-emerald-950 dark:text-emerald-300">
                                Available
                              </Badge>
                              {/* {donation.food_category && (
                                <span className="min-w-0 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                  {donation.food_category}
                                </span>
                              )} */}
                            </div>
                            <h3 className="line-clamp-2 text-sm font-bold leading-5 text-slate-950 group-hover:text-[#176B4D] dark:text-white dark:group-hover:text-emerald-400 sm:text-base">
                              {donation.title || donation.food_name || donation.food_category || 'Food donation'}
                            </h3>
                            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                              {donation.donors?.organization_name ||
                                donation.profiles?.full_name ||
                                'Restaurant donor'}
                            </p>
                            <p className="mt-2 flex items-start gap-1.5 text-xs leading-4 text-slate-500 dark:text-slate-400">
                              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#176B4D]" />
                              <span className="line-clamp-2">
                                {donation.pickup_address || 'Pickup address available in details'}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 xl:items-start xl:justify-start xl:pt-0.5 2xl:flex-col 2xl:gap-3">
                          <div>
                            <p className="mt-5 text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                              Quantity
                            </p>
                            <p className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
                              {donation.quantity_kg != null ? `${donation.quantity_kg} kg` : 'Not specified'}
                            </p>
                          </div>
                          <div>
                            {/* <p className="mt-3 text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                              Estimated meals
                            </p> */}
                            {/* <p className="mt-3 flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-white">
                              <Utensils className="h-3.5 w-3.5 text-[#176B4D]" />
                              {donation.estimated_meals ?? '—'}
                            </p> */}
                          </div>
                        </div>

                        <div className="flex min-w-0 flex-col justify-between gap-3 xl:col-span-2 2xl:col-span-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <Clock3 className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                            <span className="text-slate-600 dark:text-slate-300">
                              {expiry
                                ? `Expires ${new Date(expiry).toLocaleString([], {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}`
                                : 'Expiry not specified'}
                            </span>
                          </div>
                          <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                              {donation.distance != null
                                ? `${donation.distance.toFixed(1)} km away`
                                : 'Distance unavailable'}
                            </span>
                            <Button
                              className="h-9 max-w-full shrink rounded-lg bg-[#176B4D] px-3 text-xs font-semibold text-white hover:bg-[#12563E] sm:shrink-0 sm:px-4"
                              onClick={(event) => {
                                event.stopPropagation();
                                openAcceptFlow(donation);
                              }}
                            >
                              Accept donation
                              <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          )}

          {/* Large map panel */}
          <section
            className={`${mapContainerClass} overflow-hidden border border-[#DDE6DC] bg-white shadow-[0_2px_10px_rgba(24,55,35,0.06)] dark:border-slate-800 dark:bg-[#111713]`}
          >
           
            <Button
              type="button"
              variant="secondary"
              size="icon"
              aria-label={isMapFullscreen ? 'Exit full screen map' : 'Expand map'}
              className="absolute right-4 top-4 z-20 h-10 w-10 rounded-xl border border-slate-200 bg-white text-slate-700 shadow-md hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:right-5 sm:top-5"
              onClick={() => setIsMapFullscreen((value) => !value)}
            >
              {isMapFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>

            {ngoLocation && API_KEY ? (
              <div className="h-full min-h-[440px] w-full lg:min-h-0">
                <APIProvider apiKey={API_KEY}>
                  <Map
                    defaultZoom={12}
                    defaultCenter={ngoLocation}
                    mapId="ngo_donation_map"
                    disableDefaultUI={false}
                    gestureHandling="greedy"
                    className="h-full w-full"
                  >
                    <AdvancedMarker position={ngoLocation} zIndex={50}>
                      <Pin
                        background="#2563EB"
                        borderColor="#1D4ED8"
                        glyphColor="#FFFFFF"
                        scale={1.25}
                      />
                    </AdvancedMarker>

                    {donations.map((donation) =>
                      donation.coordinates ? (
                        <AdvancedMarker
                          key={donation.id}
                          position={donation.coordinates}
                          onClick={() => setViewingDonation(donation)}
                        >
                          <Pin
                            background="#059669"
                            borderColor="#047857"
                            glyphColor="#FFFFFF"
                            scale={1.05}
                          />
                        </AdvancedMarker>
                      ) : null,
                    )}
                  </Map>
                </APIProvider>
              </div>
            ) : (
              <div className="flex h-full min-h-[440px] w-full flex-col items-center justify-center bg-[#F3F6F1] px-8 text-center dark:bg-[#151D17]">
                <MapPin className="mb-3 h-8 w-8 text-[#176B4D] dark:text-emerald-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Map unavailable
                </h3>
                <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">
                  Add a valid Google Maps API key and NGO coordinates to display donation locations.
                </p>
              </div>
            )}

            <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-10 flex flex-wrap gap-2.5 sm:bottom-5 sm:left-5 sm:right-5">
              <div className="flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white/95 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-md backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-200">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                Your NGO
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white/95 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-md backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-200">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                Available donations
              </div>
            </div>
          </section>
        </section>
      </div>

      {viewingDonation && (
        <DonationDetailsModal
          isOpen={!!viewingDonation}
          onClose={() => setViewingDonation(null)}
          donation={viewingDonation}
          onAccept={() => openAcceptFlow(viewingDonation)}
          ngoLoc={ngoLocation}
        />
      )}

      {assigningDonation && (
        <AssignVolunteerModal
          isOpen={!!assigningDonation}
          onClose={() => setAssigningDonation(null)}
          donation={assigningDonation}
          ngoId={user?.uid || ''}
          onAssigned={() => {
            setAssigningDonation(null);
            fetchDonations();
          }}
        />
      )}
    </main>
  );
}