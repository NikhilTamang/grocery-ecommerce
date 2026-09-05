import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Order } from "../types";
import Loading from "../components/Loading";
import { ArrowLeftIcon, MapPinIcon, AlertCircle, Loader2 } from "lucide-react";
import OrderTimeLine from "../components/OrderTracking/OrderTimeLine";
import api from "../config/api";
import toast from "react-hot-toast";

const OrderTracking = () => {
  const currency = import.meta.env.VITE_CURRENCY_SYMBOL || "Rs.";
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    api
      .get(`/orders/${id}`)
      .then((res) => {
        setOrder(res.data.order);
      })
      .catch(() => {
        navigate("/orders");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, navigate]);

  const handleRetryPayment = async () => {
    if (!order) return;
    setRetrying(true);
    try {
      toast.loading("Re-initiating eSewa payment...");
      const { data } = await api.post(`/orders/${order.id}/retry-esewa`);
      if (data.esewaData) {
        const { payment_url, ...fields } = data.esewaData;
        const form = document.createElement("form");
        form.method = "POST";
        form.action = payment_url;

        Object.entries(fields).forEach(([key, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = String(value);
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
      }
    } catch (err: any) {
      toast.dismiss();
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to re-initiate payment."
      );
      setRetrying(false);
    }
  };

  if (loading) return <Loading />;
  if (!order) return null;

  return (
    <div className="min-h-screen bg-app-cream mb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header  */}
        <button
          onClick={() => navigate("/orders")}
          className="mb-6 flex items-center gap-2 text-sm text-app-text-light hover:text-app-green transition-colors"
        >
          <ArrowLeftIcon className="size-4" />
          Back to Orders
        </button>

        {/* order id, date & status  */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-app-green">
              Order #{order!.id.slice(-8).toUpperCase()}
            </h1>
            <p className="text-sm mt-1 text-app-text-light">
              {new Date(order!.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <span
            className={`px-4 py-1.5 text-sm font-semibold rounded-full ${order!.status === "Delivered" ? "bg-green-100 text-green-700" : order!.status === "Cancelled" ? "bg-red-100 text-red-700" : "bg-app-orange/10 text-app-orange"}`}
          >
            {order!.status}
          </span>
        </div>

        {/* eSewa Payment Retry Banner */}
        {order?.paymentMethod === "esewa" && !order?.isPaid && (
          <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="size-11 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                <AlertCircle className="size-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-900">
                  Payment Pending via eSewa
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  This order has not been completed. Retry your payment securely without placing a new order.
                </p>
              </div>
            </div>
            <button
              disabled={retrying}
              onClick={handleRetryPayment}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#60bb46] hover:bg-[#52a43b] disabled:opacity-50 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shrink-0 shadow-sm cursor-pointer"
            >
              {retrying ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Redirecting...
                </>
              ) : (
                "Pay with eSewa Now"
              )}
            </button>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left side - Order Timeline */}
          <div className="lg:col-span-2 space-y-6">
            <OrderTimeLine order={order} />
          </div>

          {/* Right side - Order Details  */}
          <div className="space-y-5">
            {/* Delivery Address  */}
            <div className="bg-white rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-app-green mb-3 flex items-center gap-2">
                <MapPinIcon className="size-4" />
                DeliveryAddress
              </h3>
              <p className="text-sm text-app-text-light leading-relaxed">
                {order?.shippingAddress.label}
                <br />
                {order?.shippingAddress.address}
                <br />
                {order?.shippingAddress.city}, {order?.shippingAddress.state}
                {order?.shippingAddress.zip}
              </p>
            </div>
            {/* Items  */}
            <div className="bg-white rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-app-green mb-3">
                Items ({order?.items.length})
              </h3>
              <div className="space-y-3">
                {order?.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="object-cover size-10 rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-app-green truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-app-text-light">
                        x{item.quantity}
                      </p>
                    </div>
                    <span className="text-sm font-semibold">
                      {currency}
                      {(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-app-border space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-app-text-light">Subtotal</span>
                  <span>
                    {currency}
                    {order?.subtotal.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-app-text-light">Delivery</span>
                  <span>
                    {order?.deliveryFee === 0
                      ? "Free"
                      : `${currency}${order?.deliveryFee.toFixed(2)}`}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-app-text-light">Tax</span>
                  <span>
                    {currency}
                    {order?.tax.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between pt-2 border-t border-app-border font-semibold text-app-green">
                  <span className="text-app-text-light">Total</span>
                  <span>
                    {currency}
                    {order?.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
