import { IoCheckmarkCircle, IoRefreshCircle, IoCash, IoShieldCheckmark } from 'react-icons/io5';

export default function TrustBadges() {
  const badges = [
    {
      icon: <IoCheckmarkCircle size={40} className="text-secondary" />,
      title: 'Free Shipping',
      description: 'Enjoy the Convenience of Free Shipping on Every Order',
    },
    {
      icon: <IoRefreshCircle size={40} className="text-secondary" />,
      title: '24x7 Support',
      description: 'Round-the-Clock Assistance Anytime You Need It',
    },
    {
      icon: <IoCash size={40} className="text-secondary" />,
      title: '30 Days Return',
      description: 'Your Satisfaction is Our Priority Return Any Product Within 30 Days',
    },
    {
      icon: <IoShieldCheckmark size={40} className="text-secondary" />,
      title: 'Secure Payment',
      description: 'Seamless Shopping Backed by Safe and Secure Payment Options',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 py-8">
      {badges.map((badge, index) => (
        <div key={index} className="text-center">
          <div className="flex justify-center mb-3">
            {badge.icon}
          </div>
          <h4 className="font-bold text-gray-900 mb-2">{badge.title}</h4>
          <p className="text-sm text-gray-600">{badge.description}</p>
        </div>
      ))}
    </div>
  );
}
