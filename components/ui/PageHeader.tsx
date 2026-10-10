import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Home } from 'lucide-react';
import { Button } from './button';

interface PageHeaderProps {
  title?: string;
  subtitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
  showBackButton?: boolean;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, breadcrumbs, showBackButton = true, actions }: PageHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      // Fallback
      if (location.pathname.includes('/donor/')) navigate('/dashboard/donor');
      else if (location.pathname.includes('/ngo/')) navigate('/dashboard/ngo');
      else if (location.pathname.includes('/volunteer/')) navigate('/dashboard/volunteer');
      else if (location.pathname.includes('/admin/')) navigate('/dashboard/admin');
      else navigate('/dashboard');
    }
  };

  return (
    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6 w-full">
      <div className="flex flex-col gap-4">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center text-[13px] font-medium text-slate-500 whitespace-nowrap overflow-x-auto pb-1 hide-scrollbar">
            <Link to="/dashboard" className="flex items-center hover:text-emerald-600 transition-colors">
              <Home className="w-3.5 h-3.5 mr-1" />
              Home
            </Link>
            {breadcrumbs.map((crumb, idx) => (
              <div key={idx} className="flex items-center">
                <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-slate-300 dark:text-slate-700 shrink-0" />
                {crumb.href ? (
                  <Link to={crumb.href} className="hover:text-emerald-600 transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-slate-900 dark:text-slate-300 font-semibold">{crumb.label}</span>
                )}
              </div>
            ))}
          </nav>
        )}
        <div className="flex items-center gap-3">
          {showBackButton && (
            <Button 
              variant="outline" 
              size="icon" 
              className="w-9 h-9 rounded-lg shrink-0 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
              onClick={handleBack}
              title="Go Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <div>
            {title && <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white line-clamp-1">{title}</h1>}
            {subtitle && <p className="text-sm text-slate-500 font-medium mt-1">{subtitle}</p>}
          </div>
        </div>
      </div>
      
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
