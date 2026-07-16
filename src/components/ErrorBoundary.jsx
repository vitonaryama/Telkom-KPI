import { Component } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

/**
 * ErrorBoundary — tangkap React render error supaya halaman tidak blank total.
 * Bungkus komponen yang berpotensi crash, terutama yang fetch data dari API.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Di production bisa dikirim ke logging service (Sentry, dll.)
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex items-center justify-center bg-gray-50 p-6">
          <div className="bg-white rounded-xl border border-red-200 p-8 max-w-md w-full text-center shadow-sm">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={22} className="text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Terjadi Kesalahan</h2>
            <p className="text-sm text-gray-500 mb-1">
              {this.state.error?.message || "Komponen mengalami error tak terduga."}
            </p>
            <p className="text-xs text-gray-400 mb-6">
              Silakan muat ulang halaman atau hubungi administrator.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <RefreshCw size={15} /> Muat Ulang
            </button>
            {import.meta.env.DEV && this.state.errorInfo && (
              <details className="mt-5 text-left">
                <summary className="text-xs text-gray-400 cursor-pointer">Detail error (dev only)</summary>
                <pre className="mt-2 text-[10px] text-red-700 bg-red-50 rounded p-2 overflow-auto max-h-40">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
