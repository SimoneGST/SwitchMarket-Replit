import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.href = '/';
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-4">
                <img 
                  src="/attached_assets/SWITCHMARKET_logo_1754845138370.png" 
                  alt="Switch Market Logo" 
                  className="h-10 w-auto"
                />
              </div>
              <CardTitle className="text-2xl text-red-600">
                <i className="fas fa-exclamation-triangle mr-2"></i>
                Errore Tecnico
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 text-center">
                Si è verificato un problema imprevisto. Non preoccuparti, i tuoi dati sono al sicuro.
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-red-50 border border-red-200 rounded p-3 text-sm">
                  <strong>Dettagli Tecnici:</strong>
                  <br />
                  {this.state.error.message}
                </div>
              )}
              
              <div className="space-y-2">
                <Button 
                  onClick={this.handleReload}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <i className="fas fa-home mr-2"></i>
                  Torna alla Home
                </Button>
                
                <Button 
                  onClick={this.handleRetry}
                  variant="outline"
                  className="w-full"
                >
                  <i className="fas fa-redo mr-2"></i>
                  Riprova
                </Button>
              </div>
              
              <div className="text-center text-sm text-gray-500">
                Se il problema persiste, ricarica la pagina o contatta il supporto.
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}