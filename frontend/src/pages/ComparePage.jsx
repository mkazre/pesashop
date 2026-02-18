import Breadcrumbs from '@/components/common/Breadcrumbs';

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-6">
        <Breadcrumbs items={[{ label: 'Compare Products' }]} />
        
        <div className="bg-white border-2 border-gray-200 p-6 mt-6">
          <h2 className="text-2xl font-bold mb-6">Compare Products</h2>
          <p className="text-gray-600">Product comparison will appear here.</p>
        </div>
      </div>
    </div>
  );
}
