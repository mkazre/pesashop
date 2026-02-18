import React from 'react';
import { useQuery } from 'react-query';
import { ordersAPI, productsAPI, customersAPI, dashboardAPI } from '@/services/api';
import Card from '@/components/common/Card';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  IoCashOutline, 
  IoReceiptOutline, 
  IoPeopleOutline, 
  IoCubeOutline 
} from 'react-icons/io5';

const Dashboard = () => {
  // Get dashboard statistics
  const { data: statsData, isLoading: statsLoading } = useQuery('dashboard-stats',
    () => dashboardAPI.getStats()
  );

  const { data: orders, isLoading: ordersLoading } = useQuery('dashboard-orders', 
    () => ordersAPI.getAll({ limit: 100 })
  );
  
  const { data: products } = useQuery('dashboard-products',
    () => productsAPI.getAll({ limit: 10 })
  );
  
  const { data: customers } = useQuery('dashboard-customers',
    () => customersAPI.getAll({ limit: 10 })
  );

  // Use stats from API or calculate from orders
  const stats = React.useMemo(() => {
    if (statsData?.data?.data) {
      const apiStats = statsData.data.data;
      return {
        revenue: apiStats.revenue?.total || 0,
        orders: apiStats.orders?.total || 0,
        customers: apiStats.customers?.total || 0,
        products: apiStats.products?.total || 0,
        todayRevenue: apiStats.revenue?.today || 0,
        monthRevenue: apiStats.revenue?.month || 0,
        pendingOrders: apiStats.orders?.byStatus?.pending || 0,
        completedOrders: apiStats.orders?.byStatus?.completed || 0,
        activeProducts: apiStats.products?.active || 0,
        outOfStock: apiStats.products?.outOfStock || 0,
        activeCustomers: apiStats.customers?.active || 0,
        newCustomers: apiStats.customers?.newMonth || 0,
        totalCategories: apiStats.categories?.total || 0,
        totalLaybyes: apiStats.laybyes?.total || 0,
        activeLaybyes: apiStats.laybyes?.active || 0,
        overdueLaybyes: apiStats.laybyes?.overdue || 0,
      };
    }
    
    // Fallback to calculating from orders if API fails
    if (!orders?.data?.data) return null;
    
    const ordersList = orders.data.data;
    const totalRevenue = ordersList.reduce((sum, order) => sum + (order.total || 0), 0);
    const completedOrders = ordersList.filter(o => o.status === 'completed').length;
    
    return {
      revenue: totalRevenue,
      orders: ordersList.length,
      customers: customers?.data?.pagination?.total || customers?.data?.total || 0,
      products: products?.data?.pagination?.total || products?.data?.total || 0,
      todayRevenue: 0,
      monthRevenue: 0,
      pendingOrders: ordersList.filter(o => o.status === 'pending').length,
      completedOrders,
      activeProducts: 0,
      outOfStock: 0,
      activeCustomers: 0,
      newCustomers: 0,
      totalCategories: 0,
      totalLaybyes: 0,
      activeLaybyes: 0,
      overdueLaybyes: 0,
    };
  }, [statsData, orders, customers, products]);

  // Sales chart data
  const salesData = React.useMemo(() => {
    if (!orders?.data?.data) return [];
    
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });
    
    return last7Days.map(date => {
      const dayOrders = orders.data.data.filter(o => 
        o.createdAt.split('T')[0] === date
      );
      
      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: dayOrders.reduce((sum, o) => sum + o.total, 0),
        orders: dayOrders.length,
      };
    });
  }, [orders]);

  // Order status distribution
  const orderStatusData = React.useMemo(() => {
    if (!orders?.data?.data) return [];
    
    const statuses = orders.data.data.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(statuses).map(([name, value]) => ({
      name: name.replace('-', ' ').toUpperCase(),
      value,
    }));
  }, [orders]);

  const COLORS = ['#0e604a', '#f7bd20', '#ff6b6b', '#4ecdc4', '#95e1d3'];

  if (statsLoading || ordersLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-500">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-primary">
                R {typeof stats.revenue === 'number' ? stats.revenue.toFixed(2) : '0.00'}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary bg-opacity-10 flex items-center justify-center">
              <IoCashOutline size={24} className="text-primary" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-primary">{stats?.orders || 0}</p>
            </div>
            <div className="w-12 h-12 bg-secondary bg-opacity-10 flex items-center justify-center">
              <IoReceiptOutline size={24} className="text-secondary" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-primary">{stats?.customers || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 flex items-center justify-center">
              <IoPeopleOutline size={24} className="text-green-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-primary">{stats?.products || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 flex items-center justify-center">
              <IoCubeOutline size={24} className="text-blue-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <Card title="Sales Overview" subtitle="Last 7 days">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#0e604a" strokeWidth={2} />
              <Line type="monotone" dataKey="orders" stroke="#f7bd20" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Order Status Distribution */}
        <Card title="Order Status" subtitle="Current distribution">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={orderStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {orderStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card title="Recent Orders" subtitle="Latest transactions">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Status</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {orders?.data?.data?.slice(0, 10).map((order) => (
                <tr key={order._id}>
                  <td className="font-medium">#{order.orderNumber}</td>
                  <td>{order.customer?.firstName} {order.customer?.lastName}</td>
                  <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${
                      order.status === 'completed' ? 'badge-success' :
                      order.status === 'pending' ? 'badge-warning' :
                      order.status === 'cancelled' ? 'badge-error' :
                      'badge-info'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="font-medium">R {order.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
