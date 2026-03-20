import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useCartStore, useAuthStore, useCurrencyStore } from '@/store';
import { ordersAPI, giftCardsAPI } from '@/services/api';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import toast from 'react-hot-toast';
import { IoGift, IoClose } from 'react-icons/io5';
import CheckoutLoyaltyPoints from '@/components/loyalty/CheckoutLoyaltyPoints';
import CouponWidget from '@/components/coupon/CouponWidget';
import { usePageTemplate } from '@/hooks/usePageTemplate';
import PageRenderer from '@/components/pagebuilder/PageRenderer';

export default function CheckoutPage() {
  const { formatPrice } = useCurrencyStore();
  const { components: templateComponents, hasTemplate } = usePageTemplate('checkout');
  const navigate = useNavigate();
  const { items, getTotal, clearCart, giftCardCode, giftCardAmount, giftCardBalance, setGiftCard, clearGiftCard } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [giftCardCodeInput, setGiftCardCodeInput] = useState('');
  const [validatingGiftCard, setValidatingGiftCard] = useState(false);
  const [loyaltyPointsUsed, setLoyaltyPointsUsed] = useState(0);
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0);
  const [couponCode, setCouponCode] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'South Africa',
    }
  });

  const subtotal = getTotal();
  const shipping = 0; // Free shipping
  const tax = subtotal * 0.15;
  const giftCardDiscount = giftCardAmount || 0;
  const totalBeforeDiscounts = subtotal + shipping + tax;
  const total = Math.max(0, totalBeforeDiscounts - giftCardDiscount - loyaltyDiscount - couponDiscount);

  const handleCouponApplied = (coupon, discount) => {
    setCouponCode(coupon.code);
    setCouponDiscount(discount);
  };

  const handleCouponRemoved = () => {
    setCouponCode(null);
    setCouponDiscount(0);
  };

  const handleLoyaltyRedemptionChange = (points, value) => {
    setLoyaltyPointsUsed(points);
    setLoyaltyDiscount(value);
  };

  const handleApplyGiftCard = async () => {
    if (!giftCardCodeInput.trim()) {
      toast.error('Please enter a gift card code');
      return;
    }

    setValidatingGiftCard(true);
    try {
      const response = await giftCardsAPI.validate(giftCardCodeInput.trim().toUpperCase().replace(/-/g, ''));
      const giftCard = response.data.data.giftCard;
      const balance = response.data.data.balance;
      
      if (balance <= 0) {
        toast.error('This gift card has no remaining balance');
        return;
      }

      const discountAmount = Math.min(balance, totalBeforeGiftCard);
      setGiftCard(giftCard.code, discountAmount, balance);
      toast.success(`Gift card applied! R${discountAmount.toFixed(2)} discount applied.`);
      setGiftCardCodeInput('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid or expired gift card');
    } finally {
      setValidatingGiftCard(false);
    }
  };

  const handleRemoveGiftCard = () => {
    clearGiftCard();
    toast.success('Gift card removed');
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const currencyState = useCurrencyStore.getState ? useCurrencyStore.getState() : {};
      const selCurrency = currencyState.selectedCurrency;

      const orderData = {
        items: items.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
          price: item.product.salePrice || item.product.regularPrice,
          variant: item.variant
        })),
        shippingAddress: {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          address: data.address,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
          country: data.country,
        },
        paymentMethod,
        subtotal,
        shipping,
        tax,
        total,
        currency: selCurrency?.code || 'ZAR',
        exchangeRate: selCurrency?.exchangeRate || 1,
        giftCardCode: giftCardCode || undefined,
        giftCardAmount: giftCardAmount || undefined,
        loyaltyPointsUsed: loyaltyPointsUsed || undefined,
        loyaltyDiscount: loyaltyDiscount || undefined,
        couponCode: couponCode || undefined,
        couponDiscount: couponDiscount || undefined,
      };

      const response = await ordersAPI.create(orderData);
      clearCart();
      toast.success('Order placed successfully!');
      navigate(`/order-success/${response.data.data?._id || response.data._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If a published checkout template exists, render it via page builder
  if (hasTemplate && templateComponents) {
    return <PageRenderer components={templateComponents} />;
  }

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-6">
        <Breadcrumbs items={[
          { label: 'Cart', href: '/cart' },
          { label: 'Checkout' }
        ]} />

        <h1 className="text-3xl font-bold text-gray-900 my-6">Checkout</h1>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left: Shipping & Payment */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping Address */}
              <div className="bg-white border-2 border-gray-200 p-6">
                <h2 className="text-xl font-bold mb-6">Shipment Address</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="First Name*"
                    {...register('firstName', { required: 'First name is required' })}
                    error={errors.firstName?.message}
                  />
                  <Input
                    label="Last Name*"
                    {...register('lastName', { required: 'Last name is required' })}
                    error={errors.lastName?.message}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <Input
                    label="Phone Number*"
                    type="tel"
                    {...register('phone', { required: 'Phone is required' })}
                    error={errors.phone?.message}
                  />
                  <Input
                    label="Email Address*"
                    type="email"
                    {...register('email', { required: 'Email is required' })}
                    error={errors.email?.message}
                  />
                </div>

                <Input
                  label="Street Address*"
                  containerClassName="mt-4"
                  {...register('address', { required: 'Address is required' })}
                  error={errors.address?.message}
                />

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <Input
                    label="City*"
                    {...register('city', { required: 'City is required' })}
                    error={errors.city?.message}
                  />
                  <Input
                    label="State*"
                    {...register('state', { required: 'State is required' })}
                    error={errors.state?.message}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <Input
                    label="ZIP Code*"
                    {...register('zipCode', { required: 'ZIP code is required' })}
                    error={errors.zipCode?.message}
                  />
                  <Input
                    label="Country"
                    {...register('country')}
                    disabled
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white border-2 border-gray-200 p-6">
                <h2 className="text-xl font-bold mb-6">Payment</h2>

                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-4 border-2 border-gray-300 cursor-pointer hover:border-primary transition-colors">
                    <input
                      type="radio"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-5 h-5"
                    />
                    <span className="flex-1 font-medium">Credit Card</span>
                    <span className="text-sm text-gray-600">VISA</span>
                  </label>

                  <label className="flex items-center gap-3 p-4 border-2 border-gray-300 cursor-pointer hover:border-primary transition-colors">
                    <input
                      type="radio"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-5 h-5"
                    />
                    <span className="flex-1 font-medium">Cash On Delivery</span>
                  </label>

                  <label className="flex items-center gap-3 p-4 border-2 border-gray-300 cursor-pointer hover:border-primary transition-colors">
                    <input
                      type="radio"
                      value="paypal"
                      checked={paymentMethod === 'paypal'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-5 h-5"
                    />
                    <span className="flex-1 font-medium">PayPal</span>
                    <span className="text-sm text-gray-600">PayPal</span>
                  </label>
                </div>

                {/* Gift Card Section */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-bold mb-4">Gift Card</h3>
                  {giftCardCode ? (
                    <div className="p-3 bg-green-50 border-2 border-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <IoGift className="text-green-600" size={20} />
                          <div>
                            <div className="text-sm font-medium text-green-800">
                              Gift Card: {giftCardCode}
                            </div>
                            <div className="text-xs text-green-600">
                              {formatPrice(giftCardAmount)} applied | {formatPrice(giftCardBalance)} remaining
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveGiftCard}
                          className="p-1 hover:bg-green-100 rounded"
                          title="Remove gift card"
                        >
                          <IoClose size={18} className="text-green-600" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={giftCardCodeInput}
                          onChange={(e) => setGiftCardCodeInput(e.target.value.toUpperCase())}
                          placeholder="Enter gift card code"
                          className="flex-1 px-4 py-2 border-2 border-gray-300 focus:border-primary focus:outline-none"
                        />
                        <Button
                          type="button"
                          variant="primary"
                          onClick={handleApplyGiftCard}
                          loading={validatingGiftCard}
                        >
                          Apply
                        </Button>
                      </div>
                      <Link to="/gift-cards" className="text-sm text-primary hover:underline">
                        Purchase a gift card →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
              {/* Coupon Code */}
              <CouponWidget
                onCouponApplied={handleCouponApplied}
                onCouponRemoved={handleCouponRemoved}
              />
              {/* PESA Coins */}
              <CheckoutLoyaltyPoints
                orderTotal={totalBeforeDiscounts}
                onRedemptionChange={handleLoyaltyRedemptionChange}
              />
            </div>

            {/* Right: Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white border-2 border-gray-200 p-6 sticky top-4">
                <h3 className="text-xl font-bold mb-6">Cart Items</h3>

                {/* Cart Items List */}
                <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                  {items.map((item, index) => {
                    const price = item.product.salePrice || item.product.regularPrice;
                    return (
                      <div key={index} className="flex gap-3">
                        <img
                          src={item.product.images?.[0] || '/placeholder.jpg'}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium line-clamp-2">
                            {item.product.name}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {item.quantity} × {formatPrice(price)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Order Summary */}
                <div className="space-y-3 border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-gray-700">
                    <span>Sub-Total</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>VAT (15%)</span>
                    <span>{formatPrice(tax)}</span>
                  </div>
                  {giftCardDiscount > 0 && (
                    <div className="flex justify-between text-gray-700">
                      <span>Gift Card</span>
                      <span className="text-green-600">-{formatPrice(giftCardDiscount)}</span>
                    </div>
                  )}
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-gray-700">
                      <span>Coupon ({couponCode})</span>
                      <span className="text-green-600">-{formatPrice(couponDiscount)}</span>
                    </div>
                  )}
                  {loyaltyDiscount > 0 && (
                    <div className="flex justify-between text-gray-700">
                      <span>PESA Coins ({loyaltyPointsUsed} pts)</span>
                      <span className="text-green-600">-{formatPrice(loyaltyDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-700">
                    <span>Shipment</span>
                    <span className="text-green-600">Free</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold border-t-2 border-gray-200 pt-3">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary-filled"
                  fullWidth
                  size="lg"
                  className="mt-6"
                  loading={isSubmitting}
                >
                  Proceed to checkout
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
