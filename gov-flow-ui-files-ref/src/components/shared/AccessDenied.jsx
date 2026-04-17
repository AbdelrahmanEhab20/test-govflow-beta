import React from 'react';
import { Lock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';

export default function AccessDenied({ 
  title = "Access Denied", 
  description = "You don't have permission to access this section.",
  showBackButton = true 
}) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <Lock className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          {title}
        </h1>
        
        <p className="text-slate-600 dark:text-slate-300 mb-8">
          {description}
        </p>

        {showBackButton && (
          <Button 
            onClick={() => navigate(createPageUrl('Tasks'))}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go to Home
          </Button>
        )}
      </div>
    </div>
  );
}