import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardBody, Button } from '@nextui-org/react';
import { ExclamationCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

interface Props {
  children: ReactNode;
  pageName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// Wrapper component to use hooks
function PageErrorBoundaryWrapper(props: Props) {
  const navigate = useNavigate();
  return <PageErrorBoundaryClass {...props} navigate={navigate} />;
}

interface ClassProps extends Props {
  navigate: ReturnType<typeof useNavigate>;
}

class PageErrorBoundaryClass extends Component<ClassProps, State> {
  constructor(props: ClassProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Error in ${this.props.pageName || 'page'}:`, error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null
    });
  };

  handleNavigateHome = () => {
    this.setState({
      hasError: false,
      error: null
    });
    this.props.navigate('/');
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <Card className="max-w-2xl mx-auto shadow-lg">
            <CardBody className="gap-4">
              <div className="flex items-center gap-3">
                <ExclamationCircleIcon className="w-6 h-6 text-danger" />
                <h3 className="text-lg font-semibold">
                  Error in {this.props.pageName || 'this page'}
                </h3>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  color="primary"
                  variant="flat"
                  onPress={this.handleReset}
                  startContent={<ArrowPathIcon className="w-4 h-4" />}
                >
                  Try Again
                </Button>
                <Button
                  size="sm"
                  variant="light"
                  onPress={this.handleNavigateHome}
                >
                  Go to Home
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default PageErrorBoundaryWrapper;