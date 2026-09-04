import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6 text-center">
          <h1 className="text-4xl font-black text-red-500 mb-4">Ups! Algo salió mal.</h1>
          <p className="text-slate-400 mb-8">La aplicación encontró un error inesperado.</p>
          <button
            className="bg-primary-600 px-8 py-4 rounded-2xl font-bold"
            onClick={() => window.location.reload()}
          >
            Reiniciar Aplicación
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
