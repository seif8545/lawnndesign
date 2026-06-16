import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

// Catches render-time errors in the subtree so a single broken component
// shows a recoverable fallback instead of white-screening the whole app.
//
//   <ErrorBoundary resetKey={view}>{page}</ErrorBoundary>
//
// `resetKey` — when it changes (e.g. the user navigates to another view) the
// boundary clears its error state so the new content gets a fresh chance.
export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught an error:', error, info);
  }

  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex items-center justify-center px-4 py-20" style={{ minHeight: '50vh' }}>
        <div className="max-w-md w-full text-center">
          <div
            className="mx-auto mb-5 flex items-center justify-center rounded-full"
            style={{ width: 56, height: 56, background: '#ff904418', color: '#ff9044' }}
          >
            <AlertTriangle size={26} />
          </div>
          <h2 className="font-display text-2xl font-bold mb-2" style={{ color: '#21326c' }}>
            Something went wrong
          </h2>
          <p className="font-body text-sm mb-6" style={{ color: '#21326c99' }}>
            This part of the page ran into an unexpected error. You can try again, or reload if it
            keeps happening.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={this.reset}
              className="inline-flex items-center gap-2 px-4 py-2 rounded font-body text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: '#21326c' }}
            >
              <RefreshCw size={15} /> Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded font-body text-sm font-semibold transition-colors"
              style={{ color: '#21326c', border: '1px solid rgba(33,50,108,0.2)' }}
            >
              Reload page
            </button>
          </div>
          {this.state.error?.message && (
            <p className="mt-6 font-body text-xs break-words" style={{ color: '#21326c66' }}>
              {this.state.error.message}
            </p>
          )}
        </div>
      </div>
    );
  }
}
