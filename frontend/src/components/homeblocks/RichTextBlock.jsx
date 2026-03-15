import React from 'react';
import BlockWrapper from './BlockWrapper';

export default function RichTextBlock({ block }) {
  if (!block.content) return null;
  return (
    <BlockWrapper block={block}>
      <div
        className="prose prose-sm sm:prose max-w-none"
        dangerouslySetInnerHTML={{ __html: block.content }}
      />
    </BlockWrapper>
  );
}
