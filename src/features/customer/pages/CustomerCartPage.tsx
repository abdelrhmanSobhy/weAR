import { useNavigate } from "react-router-dom";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { useAuthStore } from "@/features/auth/useAuthStore";
import { useCustomerCart, useRemoveCartItem, useUpdateCartItem } from "../queries/cart.queries";

export function CustomerCartPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const customerId = user?.id ?? "";

  const { data: cart, isLoading, error } = useCustomerCart(customerId);
  const { mutate: removeItem } = useRemoveCartItem(customerId);
  const { mutate: updateQty } = useUpdateCartItem(customerId);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#B6A092] border-t-transparent" />
      </div>
    );
  }

  if (error || !cart) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAFA] gap-4">
        <ShoppingBag size={48} className="text-[#C9A390]" />
        <p className="text-[#949E96] text-lg" style={{ fontFamily: '"Hanuman", sans-serif' }}>
          Your cart is empty
        </p>
        <button
          onClick={() => navigate("/customer/dashboard")}
          className="rounded-[12px] bg-[#B6A092] px-6 py-3 text-white text-sm font-semibold hover:bg-[#9F8062] transition"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  const isEmpty = cart.items.length === 0;

  return (
    <div className="min-h-screen bg-[#FAFAFA] py-10 px-4">
      <div className="max-w-[900px] mx-auto">
        <h1
          className="text-[#B6A092] text-[32px] mb-8"
          style={{ fontFamily: '"PT Serif", serif', fontWeight: 700 }}
        >
          Shopping Cart
        </h1>

        {isEmpty ? (
          <div className="flex flex-col items-center gap-4 py-24">
            <ShoppingBag size={48} className="text-[#C9A390]" />
            <p className="text-[#949E96]" style={{ fontFamily: '"Hanuman", sans-serif' }}>
              Your cart is empty
            </p>
            <button
              onClick={() => navigate("/customer/dashboard")}
              className="rounded-[12px] bg-[#B6A092] px-6 py-3 text-white text-sm font-semibold hover:bg-[#9F8062] transition"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 flex flex-col gap-4">
              {cart.items.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center gap-4 rounded-[16px] border border-[#E4DCD1] bg-white p-4"
                >
                  <div className="w-20 h-20 rounded-[10px] bg-[#F5F1EF] flex items-center justify-center overflow-hidden shrink-0">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ShoppingBag size={24} className="text-[#C9A390]" />
                    )}
                  </div>

                  <div className="flex-1">
                    <p
                      className="text-[#4A4A4A] font-medium text-[15px]"
                      style={{ fontFamily: '"Hanuman", sans-serif' }}
                    >
                      {item.productName}
                    </p>
                    <p
                      className="text-[#B6A092] text-[13px] mt-0.5"
                      style={{ fontFamily: '"Hanuman", sans-serif' }}
                    >
                      ${item.price.toFixed(2)} each
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        updateQty({ productId: item.productId, newQuantity: item.quantity - 1 })
                      }
                      className="w-7 h-7 rounded-full border border-[#E4DCD1] flex items-center justify-center hover:bg-[#F5F1EF] transition"
                    >
                      <Minus size={12} className="text-[#949E96]" />
                    </button>
                    <span
                      className="w-8 text-center text-[#4A4A4A] text-[14px]"
                      style={{ fontFamily: '"Hanuman", sans-serif' }}
                    >
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQty({ productId: item.productId, newQuantity: item.quantity + 1 })
                      }
                      className="w-7 h-7 rounded-full border border-[#E4DCD1] flex items-center justify-center hover:bg-[#F5F1EF] transition"
                    >
                      <Plus size={12} className="text-[#949E96]" />
                    </button>
                  </div>

                  <p
                    className="w-20 text-right text-[#4A4A4A] font-semibold text-[15px]"
                    style={{ fontFamily: '"Hanuman", sans-serif' }}
                  >
                    ${item.totalPrice.toFixed(2)}
                  </p>

                  <button
                    onClick={() => removeItem(item.productId)}
                    className="ml-2 text-[#C9A390] hover:text-red-400 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="w-full lg:w-[300px] shrink-0">
              <div className="rounded-[16px] border border-[#E4DCD1] bg-white p-6 sticky top-8">
                <h2
                  className="text-[#C9A390] text-[18px] mb-4"
                  style={{ fontFamily: '"Hanuman", sans-serif' }}
                >
                  Order Summary
                </h2>

                <div className="flex flex-col gap-2 mb-6">
                  {cart.items.map((item) => (
                    <div
                      key={item.productId}
                      className="flex justify-between text-[13px] text-[#949E96]"
                      style={{ fontFamily: '"Hanuman", sans-serif' }}
                    >
                      <span>{item.productName} × {item.quantity}</span>
                      <span>${item.totalPrice.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[#E4DCD1] pt-4 flex justify-between items-center mb-6">
                  <span
                    className="text-[#4A4A4A] font-semibold"
                    style={{ fontFamily: '"Hanuman", sans-serif' }}
                  >
                    Total
                  </span>
                  <span
                    className="text-[#B6A092] text-[22px] font-bold"
                    style={{ fontFamily: '"PT Serif", serif' }}
                  >
                    ${cart.totalAmount.toFixed(2)}
                  </span>
                </div>

                <button
                  onClick={() =>
                    navigate("/customer/checkout", { state: { cart } })
                  }
                  className="w-full rounded-[12px] bg-[#B6A092] py-3.5 text-white font-bold text-[15px] hover:bg-[#9F8062] transition"
                  style={{ fontFamily: '"Hanuman", sans-serif' }}
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
