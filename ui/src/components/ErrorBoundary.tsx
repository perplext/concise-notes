import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardBody, CardHeader, Button } from '@nextui-org/react';
import { ExclamationTriangleIcon, ArrowPathIcon, HomeIcon } from '@heroicons/react/24/outline';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
    
    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      // Log to service like Sentry, LogRocket, etc.
      console.error('Production error:', {
        error: error.toString(),
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
          <Card className="max-w-2xl w-full shadow-xl">
            <CardHeader className="flex gap-3">
              <ExclamationTriangleIcon className="w-8 h-8 text-danger" />
              <div className="flex flex-col">
                <p className="text-xl font-bold">Something went wrong</p>
                <p className="text-small text-default-500">An unexpected error occurred</p>
              </div>
            </CardHeader>
            <CardBody className="gap-4">
              <div className="bg-danger-50 dark:bg-danger-900/20 p-4 rounded-lg">
                <p className="font-mono text-sm text-danger-600 dark:text-danger-400">
                  {this.state.error?.toString()}
                </p>
              </div>
              
              {process.env.NODE_ENV === 'development' && this.state.error?.stack && (
                <details className="cursor-pointer">
                  <summary className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
                    Show technical details
                  </summary>
                  <div className="mt-2 bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto">
                    <pre className="text-xs font-mono whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                      {this.state.error.stack}
                    </pre>
                    {this.state.errorInfo?.componentStack && (
                      <>
                        <div className="mt-2 mb-1 text-xs font-semibold text-gray-600 dark:text-gray-400">
                          Component Stack:
                        </div>
                        <pre className="text-xs font-mono whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </>
                    )}
                  </div>
                </details>
              )}
              
              <div className="flex gap-3 mt-4">
                <Button
                  color="primary"
                  variant="flat"
                  startContent={<ArrowPathIcon className="w-4 h-4" />}
                  onPress={this.handleReset}
                >
                  Try Again
                </Button>
                <Button
                  color="default"
                  variant="flat"
                  startContent={<HomeIcon className="w-4 h-4" />}
                  onPress={this.handleGoHome}
                >
                  Go Home
                </Button>
              </div>
              
              <div className="mt-4 p-3 bg-warning-50 dark:bg-warning-900/20 rounded-lg">
                <p className="text-sm text-warning-600 dark:text-warning-400">
                  💡 If this error persists, try:
                </p>
                <ul className="text-sm text-warning-600 dark:text-warning-400 mt-2 ml-4 list-disc">
                  <li>Refreshing the page</li>
                  <li>Clearing your browser cache</li>
                  <li>Checking your network connection</li>
                  <li>Restarting the application</li>
                </ul>
              </div>
            </CardBody>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;