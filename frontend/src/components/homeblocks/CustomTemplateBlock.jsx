import React from 'react';
import { useQuery } from 'react-query';
import { pageTemplatesAPI } from '../../services/api';
import BlockWrapper from './BlockWrapper';

const PageRenderer = React.lazy(() => import('../pagebuilder/PageRenderer'));

export default function CustomTemplateBlock({ block }) {
  const templateId = block.templateId;

  const { data: template, isLoading, isError } = useQuery(
    ['homeBlockTemplate', templateId],
    async () => {
      if (!templateId) return null;
      // templateId can be a slug or a MongoDB _id — try slug first
      const res = await pageTemplatesAPI.getBySlug(templateId).catch(() => null);
      const t = res?.data?.data || res?.data;
      if (t && t.components) return t;
      return null;
    },
    {
      enabled: !!templateId,
      staleTime: 60 * 1000,
      retry: 1,
    }
  );

  if (!templateId) {
    return (
      <BlockWrapper block={block}>
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm">No template selected. Configure this block in the admin panel.</p>
        </div>
      </BlockWrapper>
    );
  }

  if (isLoading) {
    return (
      <BlockWrapper block={block}>
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#0F604B', borderTopColor: 'transparent' }} />
        </div>
      </BlockWrapper>
    );
  }

  if (isError || !template || !template.components) {
    return (
      <BlockWrapper block={block}>
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">Template not found or has no content.</p>
        </div>
      </BlockWrapper>
    );
  }

  return (
    <BlockWrapper block={block}>
      <React.Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#0F604B', borderTopColor: 'transparent' }} />
        </div>
      }>
        <PageRenderer components={template.components} />
      </React.Suspense>
    </BlockWrapper>
  );
}
