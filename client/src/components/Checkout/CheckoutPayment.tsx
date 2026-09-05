import { ChevronRightIcon, CreditCardIcon } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";

interface CheckoutPaymentProps {
    setStep: Dispatch<SetStateAction<string>>;
    paymentMethod: string;
    setPaymentMethod: Dispatch<SetStateAction<string>>;
}

export default function CheckoutPayment({ setStep, paymentMethod, setPaymentMethod }: CheckoutPaymentProps) {
    return (
        <div className="bg-white rounded-2xl p-6 animate-fade-in">
            <h2 className="text-lg font-semibold text-app-green mb-5 flex items-center gap-2">
                <CreditCardIcon className="size-5" /> Payment Method
            </h2>
            <div className="space-y-3">
                {[
                    {
                        value: "esewa",
                        label: "eSewa Mobile Wallet",
                        desc: "Fast & secure digital payment via eSewa (Nepal)",
                        badge: "eSewa",
                        badgeBg: "bg-[#60bb46] text-white",
                    },
                    {
                        value: "cash",
                        label: "Cash on Delivery",
                        desc: "Pay in cash when your groceries arrive",
                        badge: "COD",
                        badgeBg: "bg-zinc-100 text-zinc-700",
                    },
                ].map((method) => (
                    <label
                        key={method.value}
                        className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                            paymentMethod === method.value
                                ? "border-[#60bb46] bg-emerald-50/50 shadow-sm ring-1 ring-[#60bb46]"
                                : "border-app-border hover:border-app-green-lighter bg-white"
                        }`}
                    >
                        <div className="flex items-center gap-3.5">
                            <input
                                type="radio"
                                name="payment"
                                value={method.value}
                                checked={paymentMethod === method.value}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="size-4 text-[#60bb46] focus:ring-[#60bb46]"
                            />
                            <div>
                                <p className="text-sm font-semibold text-zinc-900">{method.label}</p>
                                <p className="text-xs text-zinc-500 mt-0.5">{method.desc}</p>
                            </div>
                        </div>
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-md tracking-wider uppercase ${method.badgeBg}`}>
                            {method.badge}
                        </span>
                    </label>
                ))}
            </div>
            <button onClick={() => { setStep("review"); scrollTo(0, 0) }} className="mt-6 px-6 py-3 bg-app-green text-white font-semibold rounded-xl hover:bg-app-green-light transition-colors flex items-center gap-2">
                Review Order <ChevronRightIcon className="size-4" />
            </button>
        </div>
    )
}
