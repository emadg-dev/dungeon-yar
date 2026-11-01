import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'خطایی رخ داد',
  message = 'در برقراری ارتباط یا بارگذاری اطلاعات مشکلی پیش آمده است.',
  onRetry,
  retryLabel = 'تلاش مجدد',
  className = '',
}) => {
  return (
    <div
      role="alert"
      className={`py-10 px-4 rounded-2xl bg-red-950/20 border border-red-900/40 flex flex-col items-center justify-center text-center space-y-3 ${className}`}
      dir="rtl"
    >
      <div className="w-12 h-12 rounded-full bg-red-900/30 border border-red-800/50 flex items-center justify-center text-red-400">
        <AlertCircle className="w-6 h-6" />
      </div>

      <div className="max-w-sm space-y-1">
        <h4 className="font-bold text-sm text-red-300">{title}</h4>
        <p className="text-xs text-stone-400 leading-relaxed">{message}</p>
      </div>

      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onRetry}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          className="mt-1"
        >
          {retryLabel}
        </Button>
      )}
    </div>
  );
};
