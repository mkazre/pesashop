import React from 'react';
import BlockWrapper from './BlockWrapper';

export default function CustomHtmlBlock({ block }) {
  if (!block.content) return null;
  return (
    <BlockWrapper block={block}>
      <div dangerouslySetInnerHTML={{ __html: block.content }} />
    </BlockWrapper>
  );
}
