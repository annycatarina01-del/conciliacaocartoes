import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-rose-50 border border-rose-100 rounded-2xl p-8 shadow-sm">
            <h1 className="text-xl font-bold text-rose-900 mb-4">Algo deu errado</h1>
            <p className="text-sm text-rose-700 mb-6 font-medium">
              O sistema encontrou um erro inesperado e não pôde carregar a página.
            </p>
            <div className="bg-white p-4 rounded-xl border border-rose-100 mb-6 overflow-auto max-h-40">
              <code className="text-xs text-rose-600 font-mono italic">
                {this.state.error?.message}
              </code>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-rose-600 text-white rounded-xl font-bold text-sm hover:bg-rose-700 transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
