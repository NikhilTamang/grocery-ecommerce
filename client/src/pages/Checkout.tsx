import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { dummyAddressData } from "../assets/assets";
import type { Address } from "../types";
import {
  ArrowLeft,
  CheckIcon,
  ChevronRightIcon,
  CreditCardIcon,
  MapPinIcon,
} from "lucide-react";
import CheckoutAddress from "../components/Checkout/CheckoutAddress";
import CheckoutPayment from "../components/Checkout/CheckoutPayment";
import CheckoutReview from "../components/Checkout/CheckoutReview";

const Checkout = () => {
  const navigate = useNavigate();
  const currency = import.meta.env.VITE_CURRENCY_SYMBOL || "Rs.";

  const { items, cartTotal } = useCart();
  const { user } = { user: { addresses: dummyAddressData } };

  const [step, setStep] = useState("address");
  const [loading, setLoading] = useState(false);

  const [address, setAddress] = useState<Address>({
    id: "",
    label: "Home",
    address: "",
    city: "",
    state: "",
    zip: "",
    isDefault: false,
    lat: 0,
    lng: 0,
  });

  const [paymentMethod, setPaymentMethod] = useState("esewa");

  const deliveryFee = cartTotal > 1000 ? 0 : 100;

  const tax = cartTotal * 0.08;
  const total = cartTotal + deliveryFee + tax;

  const steps: { key: string; label: string; icon: typeof MapPinIcon }[] = [
    {
      key: "address",
      label: "Address",
      icon: MapPinIcon,
    },
    {
      key: "payment",
      label: "Payment",
      icon: CreditCardIcon,
    },
    {
      key: "review",
      label: "Review",
      icon: CheckIcon,
    },
  ];

  const handlePlaceOrder = async () => {
    setLoading(true);
    navigate("/orders");
  };

  // Populate address from user's default address
  useEffect(() => {
    if (user?.addresses?.length) {
      const defaultAddr =
        user.addresses.find((a) => a.isDefault) || user.addresses[0];
      setAddress({
        id: defaultAddr?.id,
        label: defaultAddr?.label,
        address: defaultAddr?.address,
        city: defaultAddr?.city,
        state: defaultAddr?.state,
        zip: defaultAddr?.zip,
        isDefault: defaultAddr?.isDefault,
        lat: defaultAddr?.lat,
        lng: defaultAddr?.lng,
      });
    }
  }, []);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-app-cream flex-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-app-green mb-2">
            Your cart is empty
          </h2>
          <p className="text-sm text-app-text-light mb-4">
            Add some products to checkout
          </p>
          <button
            className="px-5 py-2.5 bg-app-green text-white text-sm font-medium rounded-xl hover:bg-app-green-light transition-colors"
            onClick={() => {
              navigate("/products");
            }}
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-cream">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button  */}
        <button
          onClick={() => {
            navigate(-1);
          }}
          className="mb-6 flex items-center gap-2 text-sm text-app-text-light hover:text-app-green transition-colors"
        >
          <ArrowLeft className="size-4" /> Back
        </button>

        <h1 className="text-2xl font-semibold text-app-green mb-8">Checkout</h1>

        {/* Steps  */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <button
                onClick={() => {
                  setStep(s.key);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${step == s.key ? "bg-app-green text-white" : "bg-white text-app-text-light"}`}
              >
                <s.icon className="size-4" /> {s.label}
                {i < steps.length - 1 && (
                  <ChevronRightIcon className="size-4" />
                )}
              </button>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main form */}
          <div className="md:col-span-2">
            {step === "address" && (
              <CheckoutAddress
                address={address}
                setAddress={setAddress}
                setStep={setStep}
                user={user}
              />
            )}

            {step === "payment" && (
              <CheckoutPayment
                paymentMethod={paymentMethod}
                setStep={setStep}
                setPaymentMethod={setPaymentMethod}
              />
            )}

            {step === "review" && (
              <CheckoutReview
                address={address}
                items={items}
                handlePlaceOrder={handlePlaceOrder}
                loading={loading}
                total={total}
              />
            )}
          </div>

          {/* Order summar sidebar  */}
          <div className="bg-white rounded-2xl p-5 h-fit sticky top-24">
            <h3 className="text-sm font-semibold text-app-green mb-4">
              OrderSummary
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-app-text-light">
                  Subtotal ({items.length} items)
                </span>
                <span>
                  {currency}
                  {cartTotal.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-app-text-light">Delivery</span>
                <span>
                  {deliveryFee === 0 ? (
                    <span className="text-app-success">Free</span>
                  ) : (
                    `${currency}${deliveryFee.toFixed(2)}`
                  )}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-app-text-light">Tax</span>
                <span>
                  {currency}
                  {tax.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between pt-3 border-t border-app-border text-base font-semibold">
                <span>Total</span>
                <span className="text-app-green">
                  {currency}
                  {total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
