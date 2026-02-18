import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { pageTemplatesAPI } from '@/services/api';
import PageRenderer from '@/components/pagebuilder/PageRenderer';
import Loading from '@/components/common/Loading';

/**
 * Renders a published page from the page builder by slug (e.g. /page/about-us).
 */
export default function DynamicPage() {
  const { slug: rawSlug } = useParams();
  // Normalize: lowercase, trim, replace spaces with hyphens
  const slug = rawSlug?.toLowerCase().trim().replace(/\s+/g, '-');
  const { data, isLoading, error } = useQuery(
    ['page', slug],
    () => pageTemplatesAPI.getBySlug(slug),
    { enabled: !!slug, retry: false }
  );

  const page = data?.data?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loading />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="container-custom py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h1>
        <p className="text-gray-600">The page you're looking for doesn't exist or isn't published.</p>
      </div>
    );
  }

  const hasContent = page.components && Object.keys(page.components).length > 0;

  if (!hasContent) {
    return (
      <div className="container-custom py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{page.name}</h1>
        <p className="text-gray-600">This page has no content yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <PageRenderer components={page.components} />
    </div>
  );
}
