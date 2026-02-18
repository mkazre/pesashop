import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { ordersAPI } from '@/services/api';
import { IoCheckmarkCircle } from 'react-icons/io5';
import Button from '@/components/common/Button';
import Loading from '@/components/common/Loading';

export default function OrderSuccessPage() {
  const { orderId } = useParams();

  const { data, isLoading } = useQuery(
    ['order', orderId],
    () => ordersAPI.getOne(orderId),
    { enabled: !!orderId }
  );

  const order = data?.data;

  if (isLoading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white border-2 border-gray-200 p-8 md:p-12 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
            <IoCheckmarkCircle className="text-green-600" size={60} />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Thanks For Your Order
        </h1>
        <p className="text-gray-600 mb-8">
          We're excited to let you know that we've received your order!
        </p>

        {order && (
          <div className="bg-gray-50 p-6 mb-8 text-left">
            <h3 className="font-bold text-lg mb-4">Order Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-medium">#{order._id.slice(-8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount Payable:</span>
                <span className="font-bold text-lg">R{order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/">
            <Button variant="primary-filled" size="lg">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
