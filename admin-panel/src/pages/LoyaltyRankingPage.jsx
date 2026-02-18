import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { loyaltyAPI } from '@/services/api';
import Card from '@/components/common/Card';
import Table from '@/components/common/Table';
import Button from '@/components/common/Button';
import toast from 'react-hot-toast';
import { IoTrophy, IoRefresh } from 'react-icons/io5';

const LoyaltyRankingPage = () => {
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState('all');
  const [limit, setLimit] = useState(10);

  const { data, isLoading, refetch } = useQuery(
    ['loyalty-ranking', period, limit],
    () => loyaltyAPI.getRanking({ period, limit }),
    { keepPreviousData: true }
  );

  const awardBonusMutation = useMutation(
    () => loyaltyAPI.awardTopCustomerBonus(),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries(['loyalty-ranking', period, limit]);
        toast.success(response.data?.message || 'Top customer bonus awarded');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to award bonus');
      },
    }
  );

  const columns = [
    {
      key: 'rank',
      title: 'Rank',
      width: '80px',
      align: 'center',
      render: (_, row, index) => (
        <div className="flex items-center justify-center">
          {index === 0 && <IoTrophy className="text-yellow-500 mr-1" size={20} />}
          <span className="font-bold text-lg">#{index + 1}</span>
        </div>
      ),
    },
    {
      key: 'firstName',
      title: 'Customer',
      render: (firstName, row) => (
        <div>
          <p className="font-medium">{firstName} {row.lastName}</p>
          <p className="text-sm text-gray-500">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'loyaltyPoints',
      title: 'Total Points',
      width: '120px',
      align: 'right',
      render: (points) => (
        <span className="font-bold text-primary">{points?.toLocaleString() || 0}</span>
      ),
    },
    {
      key: 'pointsEarned',
      title: 'Points Earned',
      width: '120px',
      align: 'right',
      render: (points) => (
        <span className="text-green-600 font-medium">{points?.toLocaleString() || 0}</span>
      ),
    },
    {
      key: 'totalSpent',
      title: 'Total Spent',
      width: '120px',
      align: 'right',
      render: (spent) => (
        <span>R {spent?.toFixed(2) || '0.00'}</span>
      ),
    },
    {
      key: 'orderCount',
      title: 'Orders',
      width: '100px',
      align: 'center',
      render: (count) => count || 0,
    },
    {
      key: 'currentLoyaltyLevel',
      title: 'Level',
      render: (level) => (
        level ? (
          <span className="badge badge-info">{level.name}</span>
        ) : (
          <span className="text-gray-400 text-sm">No level</span>
        )
      ),
    },
  ];

  const ranking = data?.data?.data || data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Best Customers Ranking</h1>
        <div className="flex items-center gap-4">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="input"
          >
            <option value="all">All Time</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <select
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value))}
            className="input"
          >
            <option value="10">Top 10</option>
            <option value="25">Top 25</option>
            <option value="50">Top 50</option>
            <option value="100">Top 100</option>
          </select>
          <Button
            variant="secondary"
            onClick={() => refetch()}
          >
            <IoRefresh size={18} className="mr-2" />
            Refresh
          </Button>
          <Button
            onClick={() => awardBonusMutation.mutate()}
            loading={awardBonusMutation.isLoading}
          >
            <IoTrophy size={18} className="mr-2" />
            Award Top Customer Bonus
          </Button>
        </div>
      </div>

      <Card>
        <Table
          columns={columns}
          data={ranking}
          loading={isLoading}
        />
      </Card>

      {/* Ranking Styles Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Boxed Style Preview">
          <div className="space-y-3">
            {ranking.slice(0, 5).map((customer, index) => (
              <div
                key={customer._id || index}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{customer.firstName} {customer.lastName}</p>
                      <p className="text-sm text-gray-500">{customer.pointsEarned?.toLocaleString() || 0} points</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{customer.loyaltyPoints?.toLocaleString() || 0}</p>
                    <p className="text-xs text-gray-500">Total Points</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Classic Style Preview">
          <div className="space-y-2">
            {ranking.slice(0, 5).map((customer, index) => (
              <div
                key={customer._id || index}
                className="flex items-center justify-between p-3 border-b border-gray-200 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-400 w-8">#{index + 1}</span>
                  <div>
                    <p className="font-medium">{customer.firstName} {customer.lastName}</p>
                    <p className="text-xs text-gray-500">{customer.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{customer.loyaltyPoints?.toLocaleString() || 0} pts</p>
                  <p className="text-xs text-gray-500">R {customer.totalSpent?.toFixed(2) || '0.00'}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoyaltyRankingPage;
