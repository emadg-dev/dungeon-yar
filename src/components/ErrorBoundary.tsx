import { Button } from './ui/Button';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg text-text-primary flex items-center justify-center p-4" dir="rtl">
          <div className="max-w-md w-full bg-surface border border-accent/40 rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/30 flex items-center justify-center mx-auto text-accent-hover">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-black text-accent-hover">خطایی رخ داد</h2>
            <p className="text-xs text-text-primary leading-relaxed">
              متأسفانه خطایی در بارگذاری این بخش رخ داد. اطلاعات شما در حافظه ذخیره است و نیازی به بارگذاری مجدد کل صفحه نیست.
            </p>
            {this.state.error?.message && (
              <div className="p-2.5 rounded-xl bg-bg border border-border text-xs text-danger font-mono overflow-x-auto text-start">
                {this.state.error.message}
              </div>
            )}
            <Button 
              type="button"
              onClick={this.handleReset}
              className="w-full py-2.5 px-4 rounded-xl bg-accent hover:bg-accent-hover text-on-accent font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              <span>تلاش دوباره</span>
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
