import React from 'react';

export default function SpacerBlock({ block }) {
  return <div style={{ height: block.spacerHeight || '40px' }} />;
}
