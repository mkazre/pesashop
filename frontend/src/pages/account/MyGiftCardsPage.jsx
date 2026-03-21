import { useState, useEffect } from 'react';
import { giftCardsAPI } from '@/services/api';
import { useCurrencyStore } from '@/store';
import toast from '@/utils/toast';

export default function MyGiftCardsPage() {
  const [purchased, setPurchased] = useState([]);
  const [received, setReceived] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('purchased');
  const { formatPrice } = useCurrencyStore();

  // Balance checker
  const [checkCode, setCheckCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [balanceResult, setBalanceResult] = useState(null);

  // Send to friend
  const [sendModal, setSendModal] = useState(null); // gift card object
  const [sendAmount, setSendAmount] = useState('');
  const [sendEmail, setSendEmail] = useState('');
  const [sendName, setSendName] = useState('');
  const [sendMessage, setSendMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchGiftCards();
  }, []);

  const fetchGiftCards = async () => {
    try {
      const res = await giftCardsAPI.getMyGiftCards();
      if (res.data?.success) {
        setPurchased(res.data.data.purchased || []);
        setReceived(res.data.data.received || []);
      }
    } catch (err) {
      console.error('Failed to fetch gift cards', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckBalance = async (e) => {
    e.preventDefault();
    if (!checkCode.trim()) {
      toast.error('Please enter a gift card code');
      return;
    }
    setChecking(true);
    setBalanceResult(null);
    try {
      const res = await giftCardsAPI.checkBalance(checkCode.trim());
      if (res.data?.success) {
        setBalanceResult(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gift card not found');
    } finally {
      setChecking(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const amt = parseFloat(sendAmount);
    if (!amt || amt <= 0 || !sendEmail) {
      toast.error('Please fill in amount and recipient email');
      return;
    }
    setSending(true);
    try {
      const res = await giftCardsAPI.sendToFriend({
        giftCardId: sendModal._id,
        amount: amt,
        recipientEmail: sendEmail,
        recipientName: sendName,
        message: sendMessage
      });
      if (res.data?.success) {
        toast.success(res.data.message);
        setSendModal(null);
        setSendAmount('');
        setSendEmail('');
        setSendName('');
        setSendMessage('');
        fetchGiftCards();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send gift card');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const GiftCardItem = ({ card, type }) => {
    const isExpired = card.expiryDate && new Date(card.expiryDate) < new Date();
    const hasBalance = card.currentBalance > 0;

    return (
      <div className={`border-2 rounded-xl overflow-hidden ${isExpired ? 'border-red-200 opacity-70' : hasBalance ? 'border-gray-200' : 'border-gray-200 opacity-70'}`}>
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-5 py-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-100 uppercase tracking-wider">Gift Card</p>
              <p className="font-mono text-lg font-bold tracking-wider mt-1">{card.code}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-purple-100">Balance</p>
              <p className="text-2xl font-bold">{formatPrice(card.currentBalance)}</p>
            </div>
          </div>
        </div>
        <div className="px-5 py-3 space-y-2">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
            <span>Initial: {formatPrice(card.initialBalance)}</span>
            {type === 'purchased' && card.recipientEmail && (
              <span>To: {card.recipientEmail}</span>
            )}
            {type === 'received' && card.senderName && (
              <span>From: {card.senderName}</span>
            )}
            {card.expiryDate && (
              <span className={isExpired ? 'text-red-500' : ''}>
                {isExpired ? 'Expired' : 'Expires'}: {new Date(card.expiryDate).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            )}
            <span>Created: {new Date(card.createdAt).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
          </div>
          {card.senderMessage && (
            <p className="text-sm text-gray-600 italic">"{card.senderMessage}"</p>
          )}
          {hasBalance && !isExpired && (
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(card.code);
                  toast.success(`Copied: ${card.code}`);
                }}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Copy Code
              </button>
              <button
                onClick={() => setSendModal(card)}
                className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700"
              >
                Send to Friend
              </button>
            </div>
          )}
          {!hasBalance && (
            <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">Fully Redeemed</span>
          )}
          {isExpired && (
            <span className="inline-block px-2 py-0.5 bg-red-100 text-red-600 rounded text-xs">Expired</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Gift Cards</h1>
        <p className="text-gray-500 mt-1">Manage your gift cards, check balances, and send to friends</p>
      </div>

      {/* Balance Checker */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 mb-3">Check Gift Card Balance</h3>
        <form onSubmit={handleCheckBalance} className="flex gap-2 max-w-md">
          <input
            type="text"
            value={checkCode}
            onChange={(e) => { setCheckCode(e.target.value.toUpperCase()); setBalanceResult(null); }}
            placeholder="Enter gift card code (e.g. XXXX-XXXX-XXXX-XXXX)"
            className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-sm"
          />
          <button
            type="submit"
            disabled={checking}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
          >
            {checking ? 'Checking...' : 'Check'}
          </button>
        </form>
        {balanceResult && (
          <div className={`mt-3 p-3 rounded-lg border ${balanceResult.isValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono font-bold text-sm">{balanceResult.code}</p>
                <p className={`text-xs mt-0.5 ${balanceResult.isValid ? 'text-green-600' : 'text-red-600'}`}>
                  {balanceResult.message}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Balance</p>
                <p className="text-xl font-bold text-gray-900">{formatPrice(balanceResult.currentBalance)}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          <button
            onClick={() => setTab('purchased')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              tab === 'purchased' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Purchased ({purchased.length})
          </button>
          <button
            onClick={() => setTab('received')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              tab === 'received' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Received ({received.length})
          </button>
        </nav>
      </div>

      {/* Content */}
      {tab === 'purchased' && (
        <div className="space-y-4">
          {purchased.length > 0 ? (
            purchased.map(card => <GiftCardItem key={card._id} card={card} type="purchased" />)
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <p className="text-gray-500">You haven't purchased any gift cards yet</p>
              <a href="/gift-cards" className="text-purple-600 hover:underline text-sm mt-2 inline-block">Purchase a Gift Card</a>
            </div>
          )}
        </div>
      )}

      {tab === 'received' && (
        <div className="space-y-4">
          {received.length > 0 ? (
            received.map(card => <GiftCardItem key={card._id} card={card} type="received" />)
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <p className="text-gray-500">You haven't received any gift cards yet</p>
            </div>
          )}
        </div>
      )}

      {/* Send to Friend Modal */}
      {sendModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Send Gift Card to a Friend</h3>
              <button onClick={() => setSendModal(null)} className="text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Send part or all of your gift card <span className="font-mono font-bold">{sendModal.code}</span> (Balance: {formatPrice(sendModal.currentBalance)})
            </p>
            <form onSubmit={handleSend} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max={sendModal.currentBalance}
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  placeholder={`Max: ${sendModal.currentBalance}`}
                  required
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Email *</label>
                <input
                  type="email"
                  value={sendEmail}
                  onChange={(e) => setSendEmail(e.target.value)}
                  placeholder="friend@example.com"
                  required
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Name</label>
                <input
                  type="text"
                  value={sendName}
                  onChange={(e) => setSendName(e.target.value)}
                  placeholder="Friend's name"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={sendMessage}
                  onChange={(e) => setSendMessage(e.target.value)}
                  placeholder="A gift for you!"
                  rows={2}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSendModal(null)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50"
                >
                  {sending ? 'Sending...' : 'Send Gift Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
