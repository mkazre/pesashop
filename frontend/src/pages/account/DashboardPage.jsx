import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { useAuthStore, useCurrencyStore } from '@/store';
import { ordersAPI, laybyAPI, loyaltyAPI } from '@/services/api';
import OfferSlot from '@/components/offers/OfferSlot';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { formatPrice } = useCurrencyStore();

  const { data: ordersData } = useQuery('myOrders', () => ordersAPI.getAll(), { retry: 1 });
  const { data: laybyesData } = useQuery('myLaybyes', () => laybyAPI.getMyLaybyes(), { retry: 1 });
  const { data: applicationsData } = useQuery('myApplications', () => laybyAPI.getMyApplications(), { retry: 1 });
  const { data: loyaltyData } = useQuery('myLoyaltyOverview', () => loyaltyAPI.getMyOverview(), { retry: 1, staleTime: 60 * 1000 });
  const loyaltyBalance = loyaltyData?.data?.data?.balance ?? user?.loyaltyPoints ?? 0;

  const orders = ordersData?.data?.data || ordersData?.data || [];
  const laybyes = laybyesData?.data?.data || [];
  const applications = applicationsData?.data?.data || [];

  const activeLaybyes = laybyes.filter(l => l.status === 'active');
  const pendingApplications = applications.filter(a => a.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-gray-500 mt-1">
          Here's a quick overview of your account activity.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/account/orders" className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
          <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
          <p className="text-sm text-gray-500">Total Orders</p>
        </Link>

        <Link to="/account/laybyes" className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
          <p className="text-2xl font-bold text-gray-900">{activeLaybyes.length}</p>
          <p className="text-sm text-gray-500">Active Laybyes</p>
        </Link>

        <Link to="/account/payments" className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatPrice(activeLaybyes.reduce((sum, l) => sum + (l.remainingAmount || 0), 0))}
          </p>
          <p className="text-sm text-gray-500">Outstanding Balance</p>
        </Link>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{loyaltyBalance.toLocaleString()}</p>
          <p className="text-sm text-gray-500">PESA Coins</p>
        </div>
      </div>

      {/* Pending Applications */}
      {pendingApplications.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div>
              <h3 className="font-semibold text-amber-900">Pending Layby Applications</h3>
              <p className="text-sm text-amber-700 mt-1">
                You have {pendingApplications.length} layby application{pendingApplications.length > 1 ? 's' : ''} under review. We'll notify you once a decision has been made.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Payments */}
      {activeLaybyes.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Upcoming Payments</h2>
            <Link to="/account/laybyes" className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All →</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {activeLaybyes.slice(0, 3).map((laybye) => {
              const isOverdue = laybye.nextPaymentDate && new Date(laybye.nextPaymentDate) < new Date();
              return (
                <Link key={laybye._id} to={`/account/laybyes`} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">
                      {laybye.laybyPlan?.name || `Laybye #${laybye._id?.slice(-6)}`}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Next payment: {laybye.nextPaymentDate ? new Date(laybye.nextPaymentDate).toLocaleDateString('en-ZA') : 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatPrice(laybye.installmentPlan?.installmentAmount || 0)}</p>
                    {isOverdue && (
                      <span className="inline-block text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full mt-1">Overdue</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Special Offers */}
      <OfferSlot page="account" className="mt-2" />

      {/* Quick Links */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Link to="/account/orders" className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>
          <p className="text-sm font-medium text-gray-700">View Orders</p>
        </Link>
        <Link to="/account/addresses" className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <p className="text-sm font-medium text-gray-700">Manage Addresses</p>
        </Link>
        <Link to="/account/settings" className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
          <p className="text-sm font-medium text-gray-700">Account Settings</p>
        </Link>
      </div>
    </div>
  );
}
