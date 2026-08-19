import { ArrowLeft, AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    console.error("[Application Error]", error);
    return { hasError: true };
  }

  handleRetry = () => this.setState({ hasError: false });

  handleGoBack = () => window.history.back();

  render() {
    if (this.state.hasError) {
      return (
        <div className="system-recovery" role="alert">
          <div className="system-recovery-panel">
            <AlertTriangle size={34} aria-hidden="true" />
            <p>INTERFACE INTERRUPTION</p>
            <h2>THE CONNECTION<br />LOST ITS RHYTHM.</h2>
            <span>Nothing has been submitted automatically. You can try this view again or return to the previous coordinate.</span>
            <div>
              <button onClick={this.handleRetry}><RotateCcw size={16} /> Try again</button>
              <button className="system-recovery-secondary" onClick={this.handleGoBack}><ArrowLeft size={16} /> Go back</button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
