import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { statsAPI } from '../services/api';
import toast from '@/utils/toast';
import {
  IoTrendingUp, IoTrendingDown, IoEye, IoSearch, IoCart,
  IoBag, IoPeople, IoFlame, IoAnalytics, IoWarning,
  IoTime, IoPhonePortrait, IoDesktop, IoArrowUp, IoArrowDown,
  IoStatsChart, IoHelpCircle, IoRefresh,
} from 'react-icons/io5';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const getImg = (src) => {
  if (!src) return '';
  return src?.startsWith('http') ? src : `${API_URL}${src}`;
};

export default function StatsPage() {
  const [days, setDays] = useState(30);
  const queryClient = useQueryClient();

  const backfillMutation = useMutation(() => statsAPI.backfillOrders(), {
    onSuccess: (res) => {
      const d = res.data;
      toast.success(d.message || `Backfilled ${d.data?.created || 0} purchase events`);
      queryClient.invalidateQueries('stats-overview');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Backfill failed'),
  });

  const { data: overviewRes, isLoading: overviewLoading, refetch: refetchOverview } = useQuery(
    ['stats-overview', days],
    () => statsAPI.getOverview({ days }),
    { staleTime: 60 * 1000 }
  );
  const { data: hotspotsRes, isLoading: hotspotsLoading } = useQuery(
    ['stats-hotspots', days],
    () => statsAPI.getHotspots({ days }),
    { staleTime: 60 * 1000 }
  );
  const { data: insightsRes, isLoading: insightsLoading } = useQuery(
    ['stats-insights', days],
    () => statsAPI.getConversionInsights({ days }),
    { staleTime: 60 * 1000 }
  );

  const overview = overviewRes?.data?.data || {};
  const hotspots = hotspotsRes?.data?.data || {};
  const insights = insightsRes?.data?.data || {};

  const current = overview.current || {};
  const changes = overview.changes || {};
  const funnel = overview.funnel || {};

  const isLoading = overviewLoading || hotspotsLoading || insightsLoading;

  const StatCard = ({ icon: Icon, iconColor, label, value, change, suffix = '' }) => {
    const changeNum = parseFloat(change);
    const isPositive = changeNum > 0;
    const isNeutral = changeNum === 0 || isNaN(changeNum);
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconColor || 'bg-blue-50 text-blue-600'}`}>
            <Icon size={20} />
          </div>
          {!isNeutral && (
            <span className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
              {isPositive ? <IoArrowUp size={10} /> : <IoArrowDown size={10} />}
              {Math.abs(changeNum)}%
            </span>
          )}
        </div>
        <div className="text-2xl font-bold text-gray-900">{typeof value === 'number' ? value.toLocaleString() : value}{suffix}</div>
        <div className="text-xs text-gray-500 mt-1">{label}</div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <IoAnalytics className="text-indigo-600" /> Site Analytics & Insights
          </h1>
          <p className="text-sm text-gray-500 mt-1">Real-time stats powering smart features across your store</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={60}>Last 60 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button onClick={() => refetchOverview()} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors" title="Refresh">
            <IoRefresh size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => backfillMutation.mutate()}
            disabled={backfillMutation.isLoading}
            className="px-3 py-2 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            title="Import purchase data from existing orders"
          >
            {backfillMutation.isLoading ? 'Syncing...' : 'Sync Orders'}
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && (
        <>
          {/* ── Overview Cards ── */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <StatCard icon={IoEye} iconColor="bg-blue-50 text-blue-600" label="Page Views" value={current.pageViews || 0} change={changes.pageViews} />
            <StatCard icon={IoPeople} iconColor="bg-purple-50 text-purple-600" label="Unique Visitors" value={current.uniqueVisitors || 0} change={changes.uniqueVisitors} />
            <StatCard icon={IoSearch} iconColor="bg-cyan-50 text-cyan-600" label="Searches" value={current.searches || 0} change={changes.searches} />
            <StatCard icon={IoCart} iconColor="bg-yellow-50 text-yellow-600" label="Add to Cart" value={current.addToCart || 0} change={changes.addToCart} />
            <StatCard icon={IoBag} iconColor="bg-green-50 text-green-600" label="Purchases" value={current.purchases || 0} change={changes.purchases} />
            <StatCard icon={IoStatsChart} iconColor="bg-indigo-50 text-indigo-600" label="Total Events" value={current.totalEvents || 0} change="0" />
          </div>

          {/* ── Conversion Funnel ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
              <div className="text-sm font-medium opacity-80">View → Cart Rate</div>
              <div className="text-3xl font-bold mt-1">{funnel.viewToCartRate || 0}%</div>
              <div className="text-xs opacity-70 mt-2">Of page views result in add-to-cart</div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white">
              <div className="text-sm font-medium opacity-80">Cart → Purchase Rate</div>
              <div className="text-3xl font-bold mt-1">{funnel.cartToPurchaseRate || 0}%</div>
              <div className="text-xs opacity-70 mt-2">Of cart additions result in purchase</div>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-5 text-white">
              <div className="text-sm font-medium opacity-80">Cart Abandonment</div>
              <div className="text-3xl font-bold mt-1">{insights.cartAbandonment?.abandonmentRate || 0}%</div>
              <div className="text-xs opacity-70 mt-2">{insights.cartAbandonment?.abandonedSessions || 0} of {insights.cartAbandonment?.totalCartSessions || 0} cart sessions abandoned</div>
            </div>
          </div>

          {/* ── Two-Column: Hotspots + Insights ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Most Viewed Products */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <IoFlame className="text-orange-500" size={18} />
                <h3 className="font-semibold text-gray-900">Most Viewed Products</h3>
              </div>
              <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
                {(hotspots.topProducts || []).slice(0, 10).map((item, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50">
                    <span className="text-xs font-bold text-gray-400 w-5">#{i + 1}</span>
                    {item.product?.featuredImage && (
                      <img src={getImg(item.product.featuredImage)} alt="" className="w-9 h-9 rounded object-cover" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{item.product?.name || 'Unknown'}</div>
                      <div className="text-xs text-gray-400">{item.uniqueVisitors} unique visitors</div>
                    </div>
                    <span className="text-sm font-bold text-gray-700">{item.views} views</span>
                  </div>
                ))}
                {(!hotspots.topProducts || hotspots.topProducts.length === 0) && (
                  <div className="px-5 py-8 text-center text-sm text-gray-400">No product view data yet. Events will appear as customers browse.</div>
                )}
              </div>
            </div>

            {/* Most Visited Pages */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <IoEye className="text-blue-500" size={18} />
                <h3 className="font-semibold text-gray-900">Most Visited Pages</h3>
              </div>
              <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
                {(hotspots.topPages || []).slice(0, 10).map((item, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50">
                    <span className="text-xs font-bold text-gray-400 w-5">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate font-mono">{item.page}</div>
                      <div className="text-xs text-gray-400">{item.uniqueVisitors} unique visitors</div>
                    </div>
                    <span className="text-sm font-bold text-gray-700">{item.views} views</span>
                  </div>
                ))}
                {(!hotspots.topPages || hotspots.topPages.length === 0) && (
                  <div className="px-5 py-8 text-center text-sm text-gray-400">No page view data yet.</div>
                )}
              </div>
            </div>
          </div>

          {/* ── Search Analytics + Categories ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Top Searches */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <IoSearch className="text-cyan-500" size={18} />
                <h3 className="font-semibold text-gray-900">Top Searches</h3>
              </div>
              <div className="divide-y divide-gray-50 max-h-[350px] overflow-y-auto">
                {(hotspots.topSearches || []).slice(0, 10).map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-xs font-bold text-gray-400">#{i + 1}</span>
                      <span className="text-sm font-medium text-gray-900 truncate">"{item.query}"</span>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <div className="text-sm font-bold text-gray-700">{item.count}</div>
                      <div className="text-[10px] text-gray-400">searches</div>
                    </div>
                  </div>
                ))}
                {(!hotspots.topSearches || hotspots.topSearches.length === 0) && (
                  <div className="px-5 py-8 text-center text-sm text-gray-400">No search data yet.</div>
                )}
              </div>
            </div>

            {/* Zero-Result Searches (Opportunities) */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <IoWarning className="text-amber-500" size={18} />
                <h3 className="font-semibold text-gray-900">Zero-Result Searches</h3>
                <span className="ml-auto text-[10px] font-semibold bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">Opportunities</span>
              </div>
              <div className="divide-y divide-gray-50 max-h-[350px] overflow-y-auto">
                {(hotspots.zeroResults || []).slice(0, 10).map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-xs font-bold text-gray-400">#{i + 1}</span>
                      <span className="text-sm font-medium text-gray-900 truncate">"{item.query}"</span>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <div className="text-sm font-bold text-amber-600">{item.count}×</div>
                      <div className="text-[10px] text-gray-400">searches</div>
                    </div>
                  </div>
                ))}
                {(!hotspots.zeroResults || hotspots.zeroResults.length === 0) && (
                  <div className="px-5 py-8 text-center text-sm text-gray-400">No zero-result searches — great!</div>
                )}
              </div>
            </div>

            {/* Top Categories */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <IoTrendingUp className="text-green-500" size={18} />
                <h3 className="font-semibold text-gray-900">Top Categories</h3>
              </div>
              <div className="divide-y divide-gray-50 max-h-[350px] overflow-y-auto">
                {(hotspots.topCategories || []).slice(0, 10).map((item, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50">
                    <span className="text-xs font-bold text-gray-400 w-5">#{i + 1}</span>
                    {item.category?.iconImage?.url && (
                      <img src={getImg(item.category.iconImage.url)} alt="" className="w-7 h-7 rounded object-contain" />
                    )}
                    <span className="text-sm font-medium text-gray-900 flex-1 truncate">{item.category?.name || 'Unknown'}</span>
                    <span className="text-sm font-bold text-gray-700">{item.views}</span>
                  </div>
                ))}
                {(!hotspots.topCategories || hotspots.topCategories.length === 0) && (
                  <div className="px-5 py-8 text-center text-sm text-gray-400">No category data yet.</div>
                )}
              </div>
            </div>
          </div>

          {/* ── Conversion Insights ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Missed Opportunities */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <IoHelpCircle className="text-red-500" size={18} />
                <h3 className="font-semibold text-gray-900">Missed Opportunities</h3>
                <span className="ml-auto text-[10px] font-semibold bg-red-50 text-red-600 px-2 py-0.5 rounded-full">Viewed but not purchased</span>
              </div>
              <div className="divide-y divide-gray-50 max-h-[350px] overflow-y-auto">
                {(insights.missedOpportunities || []).slice(0, 8).map((item, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50">
                    <span className="text-xs font-bold text-gray-400 w-5">#{i + 1}</span>
                    {item.product?.featuredImage && (
                      <img src={getImg(item.product.featuredImage)} alt="" className="w-9 h-9 rounded object-cover" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{item.product?.name || 'Unknown'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-red-600">{item.views} views</div>
                      <div className="text-[10px] text-gray-400">0 purchases</div>
                    </div>
                  </div>
                ))}
                {(!insights.missedOpportunities || insights.missedOpportunities.length === 0) && (
                  <div className="px-5 py-8 text-center text-sm text-gray-400">No missed opportunities detected.</div>
                )}
              </div>
            </div>

            {/* Peak Hours + Device Breakdown */}
            <div className="space-y-6">
              {/* Peak Hours */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                  <IoTime className="text-indigo-500" size={18} />
                  <h3 className="font-semibold text-gray-900">Peak Purchase Hours</h3>
                </div>
                <div className="px-5 py-4">
                  {(insights.peakHours || []).length > 0 ? (
                    <div className="flex gap-3">
                      {(insights.peakHours || []).slice(0, 5).map((h, i) => (
                        <div key={i} className="flex-1 text-center">
                          <div className="text-lg font-bold text-gray-900">{h.hour}:00</div>
                          <div className="text-xs text-gray-500">{h.purchases} orders</div>
                          {i === 0 && <div className="text-[10px] font-bold text-indigo-600 mt-1">Peak</div>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-4">No purchase time data yet.</p>
                  )}
                </div>
              </div>

              {/* Device Breakdown */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                  <IoPhonePortrait className="text-teal-500" size={18} />
                  <h3 className="font-semibold text-gray-900">Device Breakdown</h3>
                </div>
                <div className="px-5 py-4">
                  {insights.deviceBreakdown && Object.keys(insights.deviceBreakdown).length > 0 ? (
                    <div className="flex gap-6">
                      {Object.entries(insights.deviceBreakdown).map(([device, count]) => {
                        const total = Object.values(insights.deviceBreakdown).reduce((a, b) => a + b, 0);
                        const pct = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
                        return (
                          <div key={device} className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {device === 'mobile' ? <IoPhonePortrait size={16} className="text-teal-500" /> : <IoDesktop size={16} className="text-blue-500" />}
                              <span className="text-sm font-medium text-gray-900 capitalize">{device}</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">{pct}%</div>
                            <div className="text-xs text-gray-500">{count.toLocaleString()} views</div>
                            <div className="w-full h-2 bg-gray-100 rounded-full mt-2 overflow-hidden">
                              <div className={`h-full rounded-full ${device === 'mobile' ? 'bg-teal-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-4">No device data yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Most Clicked Buttons ── */}
          {(hotspots.topClicks || []).length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <IoStatsChart className="text-pink-500" size={18} />
                <h3 className="font-semibold text-gray-900">Most Clicked Elements</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5">
                {(hotspots.topClicks || []).slice(0, 8).map((item, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm font-medium text-gray-900 truncate">{item.elementText || 'Unknown'}</div>
                    <div className="text-xs text-gray-500 mb-2">{item.section || 'page'}</div>
                    <div className="text-lg font-bold text-gray-900">{item.clicks}</div>
                    <div className="text-[10px] text-gray-400">clicks</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info Banner */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <IoAnalytics className="text-indigo-600 mt-0.5 flex-shrink-0" size={20} />
              <div>
                <h4 className="text-sm font-semibold text-indigo-900">How Analytics Powers Your Store</h4>
                <p className="text-xs text-indigo-700 mt-1 leading-relaxed">
                  This module automatically tracks customer interactions and powers smart features across your store:
                  <strong> Mega Menu</strong> (trending/popular products),
                  <strong> Product Pages</strong> (Customers Also Bought, AI Recommendations),
                  <strong> Search</strong> (trending suggestions),
                  and <strong>Conversion Insights</strong> (missed opportunities, abandonment rates, peak hours).
                  Data is collected passively and auto-deleted after 90 days.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
