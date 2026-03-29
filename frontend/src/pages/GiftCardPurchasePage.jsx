import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation } from 'react-query';
import { giftCardsAPI } from '@/services/api';
import { useAuthStore, useCurrencyStore } from '@/store';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import toast from '@/utils/toast';
import { IoGift } from 'react-icons/io5';

export default function GiftCardPurchasePage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { formatPrice } = useCurrencyStore();
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  
  const { data: presetsData } = useQuery('gift-card-presets', () => giftCardsAPI.getPresets());
  const presets = presetsData?.data?.data || [];
  const allowCustom = presetsData?.data?.allowCustom !== false;
  const minAmount = presetsData?.data?.minAmount || 10;
  const maxAmount = presetsData?.data?.maxAmount || 10000;

  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: {
      recipientEmail: '',
      recipientName: '',
      senderName: user?.name || '',
      senderMessage: '',
    }
  });

  const [purchaseComplete, setPurchaseComplete] = useState(false);

  const purchaseMutation = useMutation(
    (data) => giftCardsAPI.purchase(data),
    {
      onSuccess: (response) => {
        toast.success(response.data?.message || 'Gift card purchase submitted!');
        setPurchaseComplete(true);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to purchase gift card');
      },
    }
  );

  const onSubmit = (data) => {
    if (!isAuthenticated) {
      toast.error('Please login to purchase a gift card');
      navigate('/');
      return;
    }

    const amount = selectedPreset || parseFloat(customAmount);
    
    if (!amount || amount < minAmount) {
      toast.error(`Minimum gift card amount is ${formatPrice(minAmount)}`);
      return;
    }
    
    if (amount > maxAmount) {
      toast.error(`Maximum gift card amount is ${formatPrice(maxAmount)}`);
      return;
    }

    purchaseMutation.mutate({
      amount,
      recipientEmail: data.recipientEmail || user.email,
      recipientName: data.recipientName,
      senderName: data.senderName,
      senderMessage: data.senderMessage,
    });
  };

  const handlePresetSelect = (amount) => {
    setSelectedPreset(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (e) => {
    setCustomAmount(e.target.value);
    setSelectedPreset(null);
  };

  const selectedAmount = selectedPreset || parseFloat(customAmount) || 0;

  if (purchaseComplete) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container-custom py-6">
          <Breadcrumbs items={[
            { label: 'Home', href: '/' },
            { label: 'Gift Cards' }
          ]} />
          <div className="max-w-lg mx-auto mt-12 text-center">
            <div className="bg-white border-2 border-amber-300 rounded-2xl p-8 shadow-sm">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Purchase Submitted!</h2>
              <p className="text-gray-600 mb-4">
                Your gift card of <strong>{formatPrice(selectedAmount)}</strong> has been submitted and is awaiting payment confirmation.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm font-semibold text-amber-800 mb-1">What happens next?</p>
                <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
                  <li>Complete your payment via EFT or the payment method provided</li>
                  <li>The store will review and confirm your payment</li>
                  <li>Once confirmed, the gift card code will be revealed in your account</li>
                  <li>The recipient will also receive an email notification</li>
                </ul>
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => navigate('/account/gift-cards')}
                  className="px-6 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                  View My Gift Cards
                </button>
                <button
                  onClick={() => { setPurchaseComplete(false); setSelectedPreset(null); setCustomAmount(''); }}
                  className="px-6 py-2.5 border-2 border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Buy Another
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' },
          { label: 'Gift Cards' }
        ]} />

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <IoGift size={64} className="mx-auto text-primary mb-4" />
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Purchase a Gift Card</h1>
            <p className="text-gray-600">Give the perfect gift - choose an amount or create a custom gift card</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left: Amount Selection */}
              <div className="bg-white border-2 border-gray-200 p-6">
                <h2 className="text-xl font-bold mb-6">Select Amount</h2>

                {/* Preset Amounts */}
                {presets.length > 0 && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Choose a Preset Amount
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {presets.map((preset) => (
                        <button
                          key={preset.amount}
                          type="button"
                          onClick={() => handlePresetSelect(preset.amount)}
                          className={`p-4 border-2 rounded-lg text-center transition-colors ${
                            selectedPreset === preset.amount
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-300 hover:border-primary'
                          }`}
                        >
                          <div className="font-bold text-lg">{formatPrice(preset.amount)}</div>
                          {preset.label && (
                            <div className="text-sm text-gray-600 mt-1">{preset.label}</div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom Amount */}
                {allowCustom && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Or Enter Custom Amount
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min={minAmount}
                      max={maxAmount}
                      value={customAmount}
                      onChange={handleCustomAmountChange}
                      placeholder={`${formatPrice(minAmount)} - ${formatPrice(maxAmount)}`}
                      fullWidth
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Minimum: {formatPrice(minAmount)} | Maximum: {formatPrice(maxAmount)}
                    </p>
                  </div>
                )}

                {/* Selected Amount Display */}
                {selectedAmount > 0 && (
                  <div className="mt-6 p-4 bg-primary/10 border-2 border-primary rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Selected Amount:</span>
                      <span className="text-2xl font-bold text-primary">{formatPrice(selectedAmount)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Recipient Details */}
              <div className="bg-white border-2 border-gray-200 p-6">
                <h2 className="text-xl font-bold mb-6">Gift Card Details</h2>

                <div className="space-y-4">
                  <Input
                    label="Recipient Email*"
                    type="email"
                    {...register('recipientEmail', { 
                      required: 'Recipient email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    error={errors.recipientEmail?.message}
                    fullWidth
                  />

                  <Input
                    label="Recipient Name"
                    {...register('recipientName')}
                    fullWidth
                  />

                  <Input
                    label="Your Name (Sender)*"
                    {...register('senderName', { required: 'Sender name is required' })}
                    error={errors.senderName?.message}
                    fullWidth
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Personal Message (Optional)
                    </label>
                    <textarea
                      {...register('senderMessage')}
                      rows={4}
                      className="w-full px-4 py-2 border-2 border-gray-300 focus:border-primary focus:outline-none rounded"
                      placeholder="Add a personal message to your gift card..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-8 text-center">
              <Button
                type="submit"
                variant="primary-filled"
                size="lg"
                disabled={selectedAmount < minAmount || selectedAmount > maxAmount}
                loading={purchaseMutation.isLoading}
              >
                Purchase Gift Card for {formatPrice(selectedAmount)}
              </Button>
              {!isAuthenticated && (
                <p className="text-sm text-red-600 mt-2">
                  Please login to purchase a gift card
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
