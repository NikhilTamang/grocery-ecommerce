import { Link } from "react-router-dom";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";

export default function EsewaFailure() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-app-cream">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-sm border border-app-border text-center space-y-6">
        <div className="size-20 mx-auto rounded-full bg-amber-50 flex items-center justify-center text-amber-500 ring-8 ring-amber-50/50">
          <AlertCircle className="size-12" />
        </div>

        <div>
          <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full uppercase tracking-wider mb-2">
            Payment Cancelled / Failed
          </span>
          <h2 className="text-2xl font-bold text-zinc-900">
            Payment Incomplete
          </h2>
          <p className="text-sm text-zinc-500 mt-2">
            Your eSewa transaction was not completed. No funds were charged and
            no order was placed.
          </p>
        </div>

        <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 text-xs text-zinc-500 text-left space-y-1">
          <p className="font-semibold text-zinc-700">Common reasons:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Cancelled during eSewa authentication</li>
            <li>Insufficient balance in eSewa wallet</li>
            <li>Session timeout (5-minute limit exceeded)</li>
          </ul>
        </div>

        <div className="pt-2 space-y-3">
          <Link
            to="/checkout"
            className="w-full py-3.5 px-6 bg-[#60bb46] hover:bg-[#52a43b] text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <RefreshCw className="size-4" /> Return to Checkout
          </Link>

          <Link
            to="/"
            className="w-full py-2.5 px-6 text-sm text-zinc-600 font-medium hover:text-zinc-900 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="size-4" /> Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
