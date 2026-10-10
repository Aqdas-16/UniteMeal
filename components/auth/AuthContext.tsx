import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';
import { onAuthStateChanged, User as FirebaseUser, signOut as firebaseSignOut } from 'firebase/auth';

type UserProfile = {
  verification_status?: 'pending' | 'verified' | 'rejected' | 'approved';
  id: string; 
  role: 'donor' | 'ngo' | 'volunteer' | 'admin' | 'pending';
  full_name: string;
  business_name?: string;
  name?: string;
  email: string;
  avatar_url?: string;
  account_status: string;
};

type AuthContextType = {
  session: FirebaseUser | null;
  user: FirebaseUser | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return null;
      }
      
      if (profileData) {
        const enhancedProfile = { ...profileData };
        
        // Fetch role-specific profile data
        if (profileData.role === 'donor') {
            try {
              const { data: donorData } = await supabase.from('donors').select('*').eq('id', userId).maybeSingle();
              if (donorData) {
                enhancedProfile.donors = [donorData];
                enhancedProfile.business_name = donorData.organization_name;
              }
            } catch (e) { /* ignore */ }
            try {
              const { data: restData } = await supabase.from('restaurants').select('*').eq('user_id', userId).maybeSingle();
              if (restData) {
                enhancedProfile.restaurants = [restData];
                enhancedProfile.business_name = restData.business_name;
                enhancedProfile.verification_status = restData.verification_status;
              }
            } catch (e) { /* ignore */ }
        } else if (profileData.role === 'ngo') {
            try {
              const { data: ngoData } = await supabase.from('ngos').select('*').eq('id', userId).maybeSingle();
              if (ngoData) {
                enhancedProfile.ngos = [ngoData];
                enhancedProfile.business_name = ngoData.organization_name || ngoData.name;
                enhancedProfile.verification_status = ngoData.is_verified ? 'verified' : 'pending';
              }
            } catch (e) { /* ignore */ }
        }
        
        setProfile(enhancedProfile as UserProfile);
        return enhancedProfile as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  useEffect(() => {
    let sub: any = null;
    const setupRealtime = (uid: string) => {
        if (sub) supabase.removeChannel(sub);
        sub = supabase.channel('profile_updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurants', filter: `user_id=eq.${uid}` }, () => {
                fetchProfile(uid);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'ngos', filter: `id=eq.${uid}` }, () => {
                fetchProfile(uid);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${uid}` }, () => {
                fetchProfile(uid);
            })
            .subscribe();
    };

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setSession(firebaseUser);
      setUser(firebaseUser);
      
      if (firebaseUser) {
        let existingProfile = await fetchProfile(firebaseUser.uid);
        let pendingRole = localStorage.getItem('pendingRole');
        
        let assignedRole = pendingRole || (existingProfile?.role) || 'donor';
        if (firebaseUser.email === 'cognixlabs.team@gmail.com') {
          assignedRole = 'admin';
        }
        let pendingFullName = localStorage.getItem('pendingFullName');

        if (!existingProfile) {
          const newProfile: any = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            full_name: pendingFullName || firebaseUser.displayName || 'New User',
            role: assignedRole,
            account_status: 'active'
          };
          
          console.log("Attempting to insert profile into Supabase:", newProfile);

          try {
            const { error: profileError } = await supabase.from('profiles').insert(newProfile);
            if (profileError) {
                if (profileError.code !== '23505' && profileError.code !== '42501' && profileError.code !== '42P01') {
                    console.error("Supabase profile insert error:", profileError);
                }
                throw profileError;
            }
            
            // Auto-create donor record to satisfy FK constraints for donations
            if (assignedRole === 'donor') {
                const { error: donorError } = await supabase.from('donors').insert({
                    id: firebaseUser.uid,
                    donor_type: 'restaurant',
                    organization_name: pendingFullName || firebaseUser.displayName || 'New Restaurant'
                });
                if (donorError) throw donorError;
            } else if (assignedRole === 'ngo') {
                const { error: ngoError } = await supabase.from('ngos').insert({
                    id: firebaseUser.uid,
                    organization_name: pendingFullName || firebaseUser.displayName || 'New NGO'
                });
                if (ngoError) throw ngoError;
            } else if (assignedRole === 'volunteer') {
                const { error: volError } = await supabase.from('volunteers').insert({
                    id: firebaseUser.uid
                });
                if (volError) throw volError;
            }
          } catch(err: any) {
            // Suppress expected DB errors: Unique violation (23505), RLS (42501), or missing table (42P01)
            if (err?.code !== '23505' && err?.code !== '42501' && err?.code !== '42P01') {
                console.error("Failed to create profile in Supabase:", err);
            }
          }
          existingProfile = newProfile;
        } else {
           if (assignedRole !== existingProfile.role && firebaseUser.email !== 'cognixlabs.team@gmail.com') {
              try {
                 const { error } = await supabase.from('profiles').update({ role: assignedRole }).eq('id', firebaseUser.uid);
                 if (error) {
                     console.error("Supabase profile update role error:", error);
                     throw error;
                 }
                 existingProfile.role = assignedRole as any;
              } catch (err) {
                 console.error("Failed to update profile role:", err);
              }
           } else if (firebaseUser.email === 'cognixlabs.team@gmail.com' && existingProfile.role !== 'admin') {
              try {
                 await supabase.from('profiles').update({ role: 'admin' }).eq('id', firebaseUser.uid);
              } catch (err) {
                 console.error("Failed to upgrade admin:", err);
              }
              existingProfile.role = 'admin';
           }
        }

        if (pendingRole) localStorage.removeItem('pendingRole');
        if (pendingFullName) localStorage.removeItem('pendingFullName');
        
        const fetchedProfile = await fetchProfile(firebaseUser.uid);
        if (!fetchedProfile && existingProfile) {
          setProfile(existingProfile);
        }
        
        setIsLoading(false);
        setupRealtime(firebaseUser.uid);
      } else {
        setProfile(null);
        setIsLoading(false);
        if (sub) supabase.removeChannel(sub);
      }
    });

    return () => {
        unsubscribe();
        if (sub) supabase.removeChannel(sub);
    };
  }, []);

  const signOut = async () => {
    setProfile(null);
    setSession(null);
    setUser(null);
    await firebaseSignOut(auth);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.uid);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, isLoading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

