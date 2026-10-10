
import React, { useState } from 'react';
import { Award } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/components/auth/AuthContext';
import { CertificateCard } from './CertificateCard';

export function CertificateWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { profile } = useAuth();

  if (!profile) return null;

  const role = profile.role as 'donor' | 'ngo' | 'volunteer';

  if (!['donor', 'ngo', 'volunteer'].includes(role)) {
    return null;
  }

  return (
    <>
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 z-[40] flex h-14 w-14 items-center justify-center rounded-full border-2 border-white bg-amber-500 text-white shadow-lg transition-colors hover:bg-amber-600 sm:bottom-6 sm:right-24"
        title="Impact Certificate"
        aria-label="Open Impact Certificate"
      >
        <Award className="h-6 w-6" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setIsOpen(false);
              }
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="certificate-widget-title"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="absolute right-4 top-4 z-[70] rounded-full bg-slate-100 p-2 text-slate-600 transition-colors hover:bg-slate-200"
                aria-label="Close certificate"
              >
                <span className="text-xl leading-none">×</span>
              </button>

              <div className="p-4 pt-12 sm:p-8 sm:pt-12">
                <div className="mb-6 text-center">
                  <h2
                    id="certificate-widget-title"
                    className="text-2xl font-bold text-slate-900"
                  >
                    Your Milestone Certificate
                  </h2>

                  <p className="mt-2 text-slate-500">
                    Track your progress and preview your Impact Certificate.
                  </p>
                </div>

                <CertificateCard role={role} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
