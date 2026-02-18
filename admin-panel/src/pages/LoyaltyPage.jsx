import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { loyaltyAPI } from '@/services/api';
import Card from '@/components/common/Card';
import { IoStar, IoSettings, IoList, IoMedal, IoImage, IoPeople, IoWallet, IoTrendingUp } from 'react-icons/io5';
import LoyaltySettingsPage from './LoyaltySettingsPage';
import LoyaltyRulesPage from './LoyaltyRulesPage';
import LoyaltyLevelsPage from './LoyaltyLevelsPage';
import LoyaltyBannersPage from './LoyaltyBannersPage';
import LoyaltyRankingPage from './LoyaltyRankingPage';
import LoyaltyPointsManagementPage from './LoyaltyPointsManagementPage';

const LoyaltyPage = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: settingsData } = useQuery('loyalty-settings', () => loyaltyAPI.getSettings());
  const { data: rankingData } = useQuery('loyalty-ranking-top', () => loyaltyAPI.getRanking({ limit: 5 }));

  const settings = settingsData?.data?.data || settingsData?.data;
  const topCustomers = rankingData?.data?.data || rankingData?.data || [];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: IoStar },
    { id: 'settings', label: 'Settings', icon: IoSettings },
    { id: 'rules', label: 'Rules', icon: IoList },
    { id: 'levels', label: 'Levels', icon: IoMedal },
    { id: 'banners', label: 'Banners', icon: IoImage },
    { id: 'ranking', label: 'Ranking', icon: IoTrendingUp },
    { id: 'points', label: 'Points Management', icon: IoWallet },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">PESA Coins & Rewards</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Statistics */}
            {settings && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Points Per R1</p>
                      <p className="text-2xl font-bold text-primary">
                        {settings.pointsPerCurrency || 1}
                      </p>
                    </div>
                    <IoStar size={32} className="text-secondary" />
                  </div>
                </Card>
                <Card>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Redemption Rate</p>
                      <p className="text-2xl font-bold text-primary">
                        R {settings.redemptionRate || 0.1} / point
                      </p>
                    </div>
                    <IoWallet size={32} className="text-secondary" />
                  </div>
                </Card>
                <Card>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Min Redemption</p>
                      <p className="text-2xl font-bold text-primary">
                        {settings.minRedemptionPoints || 100} pts
                      </p>
                    </div>
                    <IoMedal size={32} className="text-secondary" />
                  </div>
                </Card>
                <Card>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <p className={`text-2xl font-bold ${settings.enabled ? 'text-green-600' : 'text-red-600'}`}>
                        {settings.enabled ? 'Active' : 'Disabled'}
                      </p>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${settings.enabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  </div>
                </Card>
              </div>
            )}

            {/* Top Customers */}
            <Card title="Top Customers" subtitle="Best performing customers">
              {topCustomers.length > 0 ? (
                <div className="space-y-3">
                  {topCustomers.map((customer, index) => (
                    <div
                      key={customer._id || index}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{customer.firstName} {customer.lastName}</p>
                          <p className="text-sm text-gray-500">{customer.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{customer.loyaltyPoints?.toLocaleString() || 0} points</p>
                        <p className="text-sm text-gray-500">R {customer.totalSpent?.toFixed(2) || '0.00'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No customer data available</p>
                </div>
              )}
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <div className="text-center">
                  <IoList size={48} className="mx-auto mb-4 text-primary" />
                  <h3 className="font-semibold mb-2">Manage Rules</h3>
                  <p className="text-sm text-gray-600 mb-4">Create unlimited earning and redemption rules</p>
                  <button
                    onClick={() => setActiveTab('rules')}
                    className="text-primary hover:underline font-medium"
                  >
                    Go to Rules →
                  </button>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <IoMedal size={48} className="mx-auto mb-4 text-primary" />
                  <h3 className="font-semibold mb-2">Manage Levels</h3>
                  <p className="text-sm text-gray-600 mb-4">Create levels with badges and benefits</p>
                  <button
                    onClick={() => setActiveTab('levels')}
                    className="text-primary hover:underline font-medium"
                  >
                    Go to Levels →
                  </button>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <IoImage size={48} className="mx-auto mb-4 text-primary" />
                  <h3 className="font-semibold mb-2">Manage Banners</h3>
                  <p className="text-sm text-gray-600 mb-4">Create promotional banners</p>
                  <button
                    onClick={() => setActiveTab('banners')}
                    className="text-primary hover:underline font-medium"
                  >
                    Go to Banners →
                  </button>
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'settings' && <LoyaltySettingsPage />}
        {activeTab === 'rules' && <LoyaltyRulesPage />}
        {activeTab === 'levels' && <LoyaltyLevelsPage />}
        {activeTab === 'banners' && <LoyaltyBannersPage />}
        {activeTab === 'ranking' && <LoyaltyRankingPage />}
        {activeTab === 'points' && <LoyaltyPointsManagementPage />}
      </div>
    </div>
  );
};

export default LoyaltyPage;
