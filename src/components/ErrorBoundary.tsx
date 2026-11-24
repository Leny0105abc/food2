import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'An unexpected error occurred.',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('Kusina & Co. ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      let friendly = 'Something went wrong while syncing your kitchen data.';
      try {
        const parsed = JSON.parse(this.state.message);
        if (parsed?.error) {
          friendly = `Sync notice (${parsed.operationType || 'read'}): ${parsed.error}`;
        }
      } catch {
        friendly = this.state.message;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-6 py-12">
          <div className="w-full max-w-md rounded-2xl bg-[var(--surface)] border border-[var(--border-hairline)] p-6 text-center shadow-sm">
            <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 text-[var(--amber-alert)] flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="font-display text-xl font-semibold text-[var(--foreground)]">
              Kitchen Sync Interrupted
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)] break-words">{friendly}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-medium cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
