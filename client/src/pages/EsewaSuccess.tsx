import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2, ArrowRight, ShoppingBag } from "lucide-react";
import api from "../config/api";
import { useCart } from "../context/CartContext";

export default function EsewaSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [countdown, setCountdown] = useState(5);

  const verificationAttempted = useRef(false);

  useEffect(() => {
    const verifyPayment = async () => {
      const dataParam = searchParams.get("data");

      if (!dataParam) {
        setLoading(false);
        setErrorMessage("No payment confirmation data found in the URL.");
        return;
      }

      if (verificationAttempted.current) return;
      verificationAttempted.current = true;

      try {
        const response = await api.post("/orders/esewa/verify", {
          data: dataParam,
        });

        if (response.data.success) {
          clearCart();
          setSuccess(true);
          setOrderId(response.data.orderId);
        } else {
          setErrorMessage(
            response.data.message || "eSewa transaction verification failed."
          );
        }
      } catch (err: any) {
        console.error("Verification error:", err);
        setErrorMessage(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to verify your eSewa payment."
        );
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams, clearCart]);

  // Countdown timer to auto-redirect after successful verification
  useEffect(() => {
    if (!success || !orderId) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate(`/orders/${orderId}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [success, orderId, navigate]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-app-cream">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-sm border border-app-border text-center">
        {loading && (
          <div className="py-8 space-y-4">
            <div className="size-16 mx-auto rounded-full bg-emerald-50 flex items-center justify-center text-[#60bb46]">
              <Loader2 className="size-8 animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900">
              Verifying Payment
            </h2>
            <p className="text-sm text-zinc-500 max-w-xs mx-auto">
              Please wait while we confirm your transaction with eSewa...
            </p>
          </div>
        )}

        {!loading && success && (
          <div className="py-4 space-y-6 animate-fade-in">
            <div className="size-20 mx-auto rounded-full bg-emerald-50 flex items-center justify-center text-[#60bb46] ring-8 ring-emerald-50/50">
              <CheckCircle2 className="size-12" />
            </div>

            <div>
              <span className="inline-block px-3 py-1 bg-[#60bb46]/10 text-[#60bb46] text-xs font-bold rounded-full uppercase tracking-wider mb-2">
                Payment Successful
              </span>
              <h2 className="text-2xl font-bold text-zinc-900">
                Order Confirmed!
              </h2>
              <p className="text-sm text-zinc-500 mt-1">
                Thank you! Your payment was processed securely via eSewa.
              </p>
            </div>

            {orderId && (
              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 text-left">
                <p className="text-xs text-zinc-400 uppercase font-semibold">
                  Order Reference
                </p>
                <p className="text-sm font-mono font-medium text-zinc-800 break-all">
                  {orderId}
                </p>
              </div>
            )}

            <div className="pt-2 space-y-3">
              {orderId && (
                <Link
                  to={`/orders/${orderId}`}
                  className="w-full py-3.5 px-6 bg-app-green hover:bg-app-green-light text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <ShoppingBag className="size-4" /> View Order Status
                  <ArrowRight className="size-4 ml-1" />
                </Link>
              )}

              <p className="text-xs text-zinc-400">
                Redirecting to order details in {countdown}s...
              </p>
            </div>
          </div>
        )}

        {!loading && !success && (
          <div className="py-4 space-y-6 animate-fade-in">
            <div className="size-20 mx-auto rounded-full bg-rose-50 flex items-center justify-center text-rose-500 ring-8 ring-rose-50/50">
              <XCircle className="size-12" />
            </div>

            <div>
              <span className="inline-block px-3 py-1 bg-rose-100 text-rose-700 text-xs font-bold rounded-full uppercase tracking-wider mb-2">
                Verification Failed
              </span>
              <h2 className="text-2xl font-bold text-zinc-900">
                Payment Not Completed
              </h2>
              <p className="text-sm text-zinc-500 mt-2">
                {errorMessage ||
                  "We could not verify your eSewa payment. If money was deducted, please contact support."}
              </p>
            </div>

            <div className="pt-2 space-y-3">
              <Link
                to="/checkout"
                className="w-full py-3 px-6 bg-app-green text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                Return to Checkout
              </Link>
              <Link
                to="/orders"
                className="w-full py-2.5 px-6 text-sm text-zinc-600 font-medium hover:text-zinc-900 block"
              >
                View Your Orders
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
