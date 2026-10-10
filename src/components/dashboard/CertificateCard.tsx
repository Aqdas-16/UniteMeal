
import React, { useEffect, useState } from 'react';
import {
  Award,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type Role = 'donor' | 'ngo' | 'volunteer';

type ProfileWithNames = {
  id?: string;
  full_name?: string | null;
  name?: string | null;
  restaurant_name?: string | null;
  ngo_name?: string | null;
  organization_name?: string | null;
};

function getCertificateName(
  profile: ProfileWithNames | null | undefined,
  role: Role
): string {
  if (!profile) return 'Valued Member';

  const candidates =
    role === 'donor'
      ? [
          profile.restaurant_name,
          profile.full_name,
          profile.name,
        ]
      : role === 'ngo'
        ? [
            profile.ngo_name,
            profile.organization_name,
            profile.full_name,
            profile.name,
          ]
        : [
            profile.full_name,
            profile.name,
          ];

  return (
    candidates.find(
      (value): value is string =>
        typeof value === 'string' && value.trim().length > 0
    )?.trim() || 'Valued Member'
  );
}

export function CertificateCard({ role }: { role: Role }) {
  const { user, profile } = useAuth();

  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const target = 10;

  const certificateName = getCertificateName(
    profile as ProfileWithNames | null,
    role
  );

  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      if (!user || !profile?.id) {
        setCount(0);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        let completedCount = 0;

        if (role === 'donor') {
          const { count: result, error } = await supabase
            .from('donations')
            .select('*', { count: 'exact', head: true })
            .eq('donor_id', profile.id)
            .in('status', ['completed', 'delivered']);

          if (error) throw error;
          completedCount = result ?? 0;
        } else if (role === 'ngo') {
          const { count: result, error } = await supabase
            .from('donations')
            .select('*', { count: 'exact', head: true })
            .eq('ngo_id', profile.id)
            .in('status', ['completed', 'delivered']);

          if (error) throw error;
          completedCount = result ?? 0;
        } else {
          const { count: result, error } = await supabase
            .from('deliveries')
            .select('*', { count: 'exact', head: true })
            .eq('volunteer_id', profile.id)
            .in('status', ['completed', 'delivered']);

          if (error) throw error;
          completedCount = result ?? 0;
        }

        if (cancelled) return;

        setCount(completedCount);

        const storageKey = `cert_${role}_${profile.id}`;
        const hasSeen = localStorage.getItem(storageKey);

        if (completedCount >= target && !hasSeen) {
          toast.success(
            "You've unlocked your Milestone Certificate!",
            {
              duration: 8000,
              icon: '🏆',
            }
          );

          localStorage.setItem(storageKey, 'true');
        }
      } catch (error) {
        console.error(
          'Failed to fetch certificate progress:',
          error
        );

        if (!cancelled) {
          toast.error('Could not load certificate progress.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchStats();

    return () => {
      cancelled = true;
    };
  }, [user?.id, profile?.id, role]);

  const isUnlocked = count >= target;

  const progress = Math.min(
    100,
    Math.round((count / target) * 100)
  );

  const handleCertificateAction = () => {
    toast.error(
      'Certificate temporarily unavailable. Please try again later.',
      { duration: 4000 }
    );
  };

  if (loading) {
    return (
      <Card className="mb-8 border-amber-200 bg-amber-50 p-6">
        <p className="text-center text-amber-800">
          Loading certificate progress...
        </p>
      </Card>
    );
  }

  return (
    <Card className="relative mb-8 overflow-hidden border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6">
      <div className="absolute right-0 top-0 p-4 opacity-10">
        <Award className="h-32 w-32 text-amber-500" />
      </div>

      <div className="relative z-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full shadow-inner ${
              isUnlocked
                ? 'bg-amber-100 text-amber-600'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            {isUnlocked ? (
              <Award className="h-8 w-8" />
            ) : (
              <Lock className="h-8 w-8" />
            )}
          </div>

          <div>
            <h3 className="flex items-center gap-2 text-xl font-bold text-amber-900">
              Impact Milestone Certificate

              {isUnlocked && (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              )}
            </h3>

            <p className="mt-1 max-w-md text-amber-700">
              {role === 'donor' &&
                'Donate 10 times to unlock your official impact certificate.'}

              {role === 'ngo' &&
                'Accept and rescue 10 food donations to unlock your official impact certificate.'}

              {role === 'volunteer' &&
                'Complete 10 food rescue deliveries to unlock your official impact certificate.'}
            </p>

           

            {!isUnlocked && (
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-xs font-semibold text-amber-800">
                  <span>{count} completed</span>
                  <span>{target} required</span>
                </div>

                <div
                  className="h-2 w-full rounded-full bg-amber-200/50"
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Certificate milestone progress"
                >
                  <div
                    className="h-2 rounded-full bg-amber-500 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {isUnlocked && (
              <p className="mt-3 text-sm font-semibold text-emerald-700">
                Milestone unlocked!
              </p>
            )}
          </div>
        </div>

        <div className="shrink-0">
          <Button
            type="button"
            onClick={handleCertificateAction}
            variant={isUnlocked ? 'default' : 'outline'}
            className={
              isUnlocked
                ? 'flex h-auto items-center gap-2 bg-amber-600 px-6 py-6 font-bold text-white shadow-lg hover:bg-amber-700'
                : 'flex h-auto items-center gap-2 border-amber-200 bg-white px-6 py-6 font-bold text-amber-600 shadow-sm hover:bg-amber-50'
            }
          >
            {isUnlocked ? (
              <Award className="h-5 w-5" />
            ) : (
              <Lock className="h-5 w-5" />
            )}

            {isUnlocked ? 'View & Download' : 'Preview Certificate'}
          </Button>
        </div>
      </div>
    </Card>
  );
}