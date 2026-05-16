import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { referralsAPI } from '../services/api';

const ReferLandingPage = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [referrer, setReferrer] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    referralsAPI.lookup(code).then(res => {
      setReferrer(res.data.data);
      try { localStorage.setItem('pesa_referral_code', code); } catch {}
    }).catch(() => setError('This referral link is invalid or expired.'));
  }, [code]);

  if (error) {
    return (
      <div className="max-w-md mx-auto p-8 text-center">
        <h1 className="text-xl font-bold mb-2">Oops</h1>
        <p className="text-gray-600 mb-6">{error}</p>
        <button onClick={() => navigate('/')} className="px-4 py-2 bg-blue-600 text-white rounded">Go to PesaShop</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-3xl font-bold">🎁</div>
        <h1 className="text-2xl font-bold mb-2">You've been invited!</h1>
        {referrer && <p className="text-gray-600 mb-1">{referrer.firstName} thinks you'll love PesaShop.</p>}
        <p className="text-sm text-gray-500 mb-6">Sign up with code <strong className="text-blue-600">{code?.toUpperCase()}</strong> and get welcome PESA Coins on your first purchase.</p>
        <button onClick={() => navigate(`/?signup=1&ref=${code}`)} className="w-full py-3 bg-blue-600 text-white rounded font-semibold mb-3">Create my account</button>
        <button onClick={() => navigate('/')} className="text-sm text-gray-500 hover:underline">Just browse</button>
      </div>
    </div>
  );
};

export default ReferLandingPage;
