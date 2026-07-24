import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, ShieldCheck } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public props: Props;
  public state: State;

  constructor(props: Props) {
    super(props);
    this.props = props;
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught application error:", error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem("wis_policies");
      localStorage.removeItem("wis_session");
      sessionStorage.removeItem("wis_session");
    } catch (e) {
      // ignore
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-black text-white tracking-tight">HRWIS Policy Suite</h1>
              <span className="text-xs text-purple-400 uppercase tracking-widest font-bold block">WESTERN INTERNATIONAL SCHOOL</span>
            </div>

            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs text-left space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Application Recovery Triggered</span>
              </div>
              <p className="leading-relaxed opacity-90">
                A temporary runtime error was intercepted. You can reload the application or reset stored cached data.
              </p>
              {this.state.error && (
                <code className="block p-2 bg-black/40 rounded text-[10px] font-mono text-zinc-400 overflow-x-auto break-all">
                  {this.state.error.message}
                </code>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-2.5 px-4 bg-purple-600 hover:bg-purple-500 rounded-xl text-xs font-bold text-white transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>
              <button
                onClick={this.handleReset}
                className="py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-bold text-zinc-300 transition-colors cursor-pointer"
              >
                Clear Cache & Reset
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
