import * as React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
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

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      let errorMessage = 'Ocorreu um erro inesperado.';
      
      try {
        if (this.state.error?.message) {
          const parsedError = JSON.parse(this.state.error.message);
          if (parsedError.error && parsedError.error.includes('Missing or insufficient permissions')) {
            errorMessage = 'Você não tem permissão para realizar esta operação ou acessar estes dados.';
          }
        }
      } catch (e) {
        // Not a JSON error message
      }

      return (
        <div className="min-h-screen bg-brand-gray flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 text-center space-y-6 border border-gray-100">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mx-auto">
              <AlertCircle size={40} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-brand-dark">Ops! Algo deu errado</h2>
              <p className="text-gray-500">{errorMessage}</p>
            </div>
            <button
              onClick={this.handleReset}
              className="w-full bg-brand-dark text-white py-4 rounded-2xl font-bold hover:bg-brand-dark/90 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} />
              Tentar Novamente
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
