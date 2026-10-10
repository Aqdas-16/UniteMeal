import { usePushNotifications } from './hooks/usePushNotifications';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { DonorDashboardLayout } from './components/layout/DonorDashboardLayout';
import { NGODashboardLayout } from './components/layout/NGODashboardLayout';
import { NGOAnalytics } from './pages/NGOAnalytics';
import { NGOHistory } from './pages/NGOHistory';
import { NGOProfile } from './pages/NGOProfile';
import { AdminDashboardLayout } from './components/layout/AdminDashboardLayout';
import { DonorDashboard } from './pages/DonorDashboard';
import { NGODashboard } from './pages/NGODashboard';
import { NGOHomepage } from './pages/NGOHomepage';
import { NGOVolunteersContent } from './pages/NGOVolunteersContent';
import { AdminDashboard } from './pages/AdminDashboard';
import { CreateDonationContent, DonationHistoryContent, DonorTrackContent, AIRecommendationContent, DonorRequestsContent } from './pages/DonorFeatures';
import { DonorAnalytics } from './pages/DonorAnalytics';
import { NGODistributionContent, NGOImpactContent } from './pages/NGOFeatures';
import { NGORequestsContent } from './pages/NGORequestsContent';
import { NGORequestFood } from './pages/NGORequestFood';
import { NGOIncomingContent } from './pages/NGOIncomingContent';

import { AdminUsersContent, AdminNGOVerificationContent, AdminDonationMonitoringContent, AdminAnalyticsContent, AdminReportsContent, AdminFeedbackContent } from './pages/AdminFeatures';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { AuthProvider } from '@/components/auth/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ThemeProvider } from './components/theme-provider';

// New Pages
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { FAQPage } from './pages/FAQPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { DonorNGORequests } from './pages/DonorNGORequests';
import { DonorProfile } from './pages/DonorProfile';

import { DonorDocuments } from './pages/DonorDocuments';

import { FloatingAssistant } from './components/FloatingAssistant';
import { CertificateWidget } from './components/dashboard/CertificateWidget';
import { TrackDeliveriesContent } from './pages/TrackDeliveriesContent';
import { VolunteerDashboardLayout } from './components/layout/VolunteerDashboardLayout';
import { VolunteerPortal } from './pages/VolunteerPortal';
import { VolunteerProfile } from './pages/VolunteerProfile';
import { VolunteerHistory } from './pages/VolunteerHistory';

function MainLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const isAuthPage = location.pathname === '/auth';

  return (
    <div className="min-h-screen flex flex-col bg-theme-bg text-theme-text font-sans transition-colors duration-200">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      {!isAuthPage && <Footer />}
      <CertificateWidget /><FloatingAssistant />
    </div>
  );
}

import { Toaster } from '@/components/ui/sonner';


import React from 'react';

function OfflineBanner() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);
    if (isOnline) return null;
    return (
        <div className="fixed top-0 left-0 right-0 bg-rose-500 text-white text-center py-1 text-xs font-bold z-[100] shadow-sm flex items-center justify-center gap-2">
            You are currently offline. Showing cached data.
        </div>
    );
}

function PushWrapper({ children }: { children: React.ReactNode }) {
    usePushNotifications();
    return <>{children}</>;
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="unitemeal-theme">
      <AuthProvider>
        <PushWrapper>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainLayout><LandingPage /></MainLayout>} />
            <Route path="/auth" element={<MainLayout><AuthPage /></MainLayout>} />
            <Route path="/about" element={<MainLayout><AboutPage /></MainLayout>} />
            <Route path="/contact" element={<MainLayout><ContactPage /></MainLayout>} />
            <Route path="/faq" element={<MainLayout><FAQPage /></MainLayout>} />
            <Route path="/privacy" element={<MainLayout><PrivacyPage /></MainLayout>} />
            <Route path="/terms" element={<MainLayout><TermsPage /></MainLayout>} />
            
            {/* Redirect /dashboard to correct dashboard based on role */}
            <Route path="/dashboard" element={<ProtectedRoute />} />

            {/* Admin Dashboard */}
            <Route path="/dashboard/admin" element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route element={<AdminDashboardLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<div className="p-4 md:p-8"><AdminUsersContent /></div>} />
                <Route path="settings" element={<div className="p-4 md:p-8 max-w-6xl mx-auto"><SettingsPage /></div>} />
                <Route path="verification" element={<div className="p-4 md:p-8"><AdminNGOVerificationContent /></div>} />
                <Route path="donations" element={<div className="p-4 md:p-8"><AdminDonationMonitoringContent /></div>} />
                <Route path="analytics" element={<div className="p-4 md:p-8"><AdminAnalyticsContent /></div>} />
                <Route path="reports" element={<div className="p-4 md:p-8"><AdminReportsContent /></div>} />
                <Route path="feedback" element={<div className="p-4 md:p-8"><AdminFeedbackContent /></div>} />
                <Route path="profile" element={<VolunteerProfile />} />
                <Route path="notifications" element={<NotificationsPage />} />
              </Route>
            </Route>

            {/* Donor Dashboard */}
            <Route path="/dashboard/restaurant" element={<ProtectedRoute allowedRoles={['donor']} />}>
              <Route element={<><DonorDashboardLayout /><CertificateWidget /><FloatingAssistant /></>}>
                <Route index element={<div className="w-full h-full flex-1"><DonorDashboard /></div>} />
                <Route path="create" element={<div className="p-4 md:p-8 max-w-5xl mx-auto w-full"><CreateDonationContent /></div>} />
                <Route path="active" element={<div className="p-4 md:p-8 max-w-[1400px] mx-auto w-full"><DonationHistoryContent /></div>} />
                <Route path="track" element={<div className="p-4 md:p-8 max-w-[1600px] mx-auto w-full"><DonorTrackContent /></div>} />
                <Route path="ai-matches" element={<div className="p-4 md:p-8 max-w-5xl mx-auto w-full"><AIRecommendationContent /></div>} />
                <Route path="analytics" element={<DonorAnalytics />} />
                <Route path="requests" element={<div className="p-4 md:p-8 max-w-6xl mx-auto w-full"><DonorNGORequests /></div>} />
                <Route path="history" element={<Navigate to="/dashboard/restaurant/active" replace />} />
                <Route path="profile" element={<div className="p-4 md:p-8 max-w-5xl mx-auto w-full"><DonorProfile /></div>} />
                <Route path="documents" element={<DonorDocuments />} />
                <Route path="settings" element={<div className="p-4 md:p-8 max-w-6xl mx-auto w-full"><SettingsPage /></div>} />
                <Route path="profile" element={<VolunteerProfile />} />
                <Route path="notifications" element={<NotificationsPage />} />
              </Route>
            </Route>

            {/* NGO Dashboard */}
            <Route path="/dashboard/ngo" element={<ProtectedRoute allowedRoles={['ngo']} />}>
              <Route element={<><NGODashboardLayout /><CertificateWidget /><FloatingAssistant /></>}>
                <Route index element={<div className="w-full h-full flex-1"><NGOHomepage /></div>} />
                <Route path="dashboard" element={<div className="w-full flex-1 p-4 md:p-8"><NGODashboard /></div>} />
                <Route path="analytics" element={<div className="p-4 md:p-8 max-w-7xl mx-auto w-full"><NGOAnalytics /></div>} />
                <Route path="incoming" element={<div className="p-4 md:p-8 max-w-6xl mx-auto"><NGOIncomingContent /></div>} />
                <Route path="request-food" element={<div className="p-4 md:p-8 max-w-4xl mx-auto"><NGORequestFood /></div>} />
                <Route path="requests" element={<div className="p-4 md:p-8 max-w-6xl mx-auto"><NGORequestsContent /></div>} />
                <Route path="volunteers" element={<div className="p-4 md:p-8 max-w-6xl mx-auto"><NGOVolunteersContent /></div>} />
                <Route path="track" element={<div className="p-4 md:p-8 max-w-5xl mx-auto w-full"><TrackDeliveriesContent /></div>} />
                <Route path="distribution" element={<Navigate to="/dashboard/ngo/analytics" replace />} />
                <Route path="impact" element={<Navigate to="/dashboard/ngo/analytics" replace />} />
                <Route path="history" element={<div className="p-4 md:p-8 max-w-6xl mx-auto"><NGOHistory /></div>} />
                <Route path="settings" element={<div className="p-4 md:p-8 max-w-6xl mx-auto"><SettingsPage /></div>} />
                <Route path="profile" element={<div className="p-4 md:p-8 max-w-6xl mx-auto"><NGOProfile /></div>} />
                <Route path="profile" element={<VolunteerProfile />} />
                <Route path="notifications" element={<NotificationsPage />} />
              </Route>
            </Route>

            

            {/* Volunteer Dashboard */}
            <Route path="/dashboard/volunteer" element={<ProtectedRoute allowedRoles={['volunteer']} />}>
              <Route element={<VolunteerDashboardLayout />}>
                <Route index element={<div className="w-full flex-1 p-4 md:p-8"><VolunteerPortal /></div>} />
                <Route path="history" element={<div className="w-full flex-1 p-4 md:p-8"><VolunteerHistory /></div>} />
                <Route path="profile" element={<VolunteerProfile />} />
              </Route>
            </Route>
            {/* Fallback */}
            <Route path="*" element={<div className="p-20 text-center font-bold text-2xl">404 Not Found</div>} />
          </Routes>
        </BrowserRouter>
        <OfflineBanner />
        <Toaster position="top-right" duration={5000} />
      </PushWrapper>
      </AuthProvider>
    </ThemeProvider>
  );
}

