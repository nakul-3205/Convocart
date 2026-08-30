import { Component } from 'react';
import { logger } from '../lib/logger';

export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    logger.error('Unhandled render error', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <p className="mb-2 font-mono text-sm text-faint">Oops</p>
          <h1 className="mb-3 font-display text-2xl font-semibold text-ink">Something went wrong.</h1>
          <p className="mb-6 max-w-xs text-sm text-muted">
            Try refreshing the page. If this keeps happening, check the browser console for details.
          </p>
          <button className="btn-primary" onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}