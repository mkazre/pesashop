import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { appPagesAPI } from '@/services/api';
import Button from '@/components/common/Button';
import toast from '@/utils/toast';
import { ArrowLeft, Layers, Settings as SettingsIcon } from 'lucide-react';
import BlockPalette from './BlockPalette';
import BlockCanvas from './BlockCanvas';
import LayersPanel from './LayersPanel';
import BlockStylePanel from './BlockStylePanel';
import ContentFieldsPanel from './ContentFieldsPanel';
import { getBlockMeta, createBlockFromType } from './blockRegistry';

export default function AppPageEditor({ pageId, onBack }) {
  const queryClient = useQueryClient();
  const { data: pageResponse, isLoading } = useQuery(['app-page', pageId], () => appPagesAPI.getOne(pageId));
  const page = pageResponse?.data?.data;

  const [blocks, setBlocks] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [rightTab, setRightTab] = useState('layers'); // layers | settings
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (page) {
      setBlocks(page.blocks || []);
      setDirty(false);
    }
  }, [page?._id]);

  const updateBlocks = (next) => {
    setBlocks(next);
    setDirty(true);
  };

  const insertBlock = (blockType) => {
    const block = createBlockFromType(blockType, blocks.length);
    if (!block) return;
    updateBlocks([...blocks, block]);
    setSelectedId(block._id);
    setRightTab('settings');
  };

  const reorderBlocks = (next) => updateBlocks(next.map((b, i) => ({ ...b, order: i })));
  const toggleEnabled = (id) => updateBlocks(blocks.map((b) => (b._id === id ? { ...b, enabled: !b.enabled } : b)));
  const duplicateBlock = (id) => {
    const idx = blocks.findIndex((b) => b._id === id);
    if (idx === -1) return;
    const copy = { ...JSON.parse(JSON.stringify(blocks[idx])), _id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` };
    const next = [...blocks.slice(0, idx + 1), copy, ...blocks.slice(idx + 1)].map((b, i) => ({ ...b, order: i }));
    updateBlocks(next);
  };
  const removeBlock = (id) => {
    updateBlocks(blocks.filter((b) => b._id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const selectedBlock = useMemo(() => blocks.find((b) => b._id === selectedId) || null, [blocks, selectedId]);
  const selectedMeta = selectedBlock ? getBlockMeta(selectedBlock.blockType) : null;

  const updateSelectedProps = (nextProps) => {
    updateBlocks(blocks.map((b) => (b._id === selectedId ? { ...b, props: nextProps } : b)));
  };

  const saveMutation = useMutation((data) => appPagesAPI.update(pageId, data), {
    onSuccess: () => {
      queryClient.invalidateQueries(['app-page', pageId]);
      queryClient.invalidateQueries('app-pages');
      setDirty(false);
      toast.success('Saved');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to save'),
  });

  const handleSave = () => saveMutation.mutate({ blocks });
  const handleTogglePublish = () => {
    const nextStatus = page.status === 'published' ? 'draft' : 'published';
    appPagesAPI.update(pageId, { status: nextStatus, blocks }).then(() => {
      queryClient.invalidateQueries(['app-page', pageId]);
      queryClient.invalidateQueries('app-pages');
      setDirty(false);
      toast.success(nextStatus === 'published' ? 'Page published' : 'Unpublished — back to draft');
    }).catch((error) => toast.error(error.response?.data?.message || 'Failed to update status'));
  };

  if (isLoading || !page) {
    return <div className="p-6 text-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-gray-500 hover:text-gray-800">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">{page.title}</h2>
            <p className="text-xs text-gray-400">/{page.slug}</p>
          </div>
          {dirty && <span className="px-2 py-0.5 text-xs font-medium rounded bg-amber-100 text-amber-800">Unsaved changes</span>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSave} loading={saveMutation.isLoading}>Save</Button>
          <Button onClick={handleTogglePublish}>
            {page.status === 'published' ? 'Unpublish' : 'Publish'}
          </Button>
        </div>
      </div>

      {/* 3-pane body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: palette */}
        <div className="w-64 border-r border-gray-200 bg-white flex-shrink-0">
          <BlockPalette onInsert={insertBlock} />
        </div>

        {/* Middle: canvas */}
        <div className="flex-1 bg-gray-50 overflow-hidden">
          <BlockCanvas
            blocks={blocks}
            selectedId={selectedId}
            onSelect={(id) => { setSelectedId(id); setRightTab('settings'); }}
            onReorder={reorderBlocks}
            onToggleEnabled={toggleEnabled}
            onDuplicate={duplicateBlock}
            onRemove={removeBlock}
          />
        </div>

        {/* Right: layers / settings */}
        <div className="w-96 border-l border-gray-200 bg-white flex-shrink-0 flex flex-col overflow-hidden">
          <div className="flex items-center border-b border-gray-200">
            <button
              onClick={() => setRightTab('layers')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium ${rightTab === 'layers' ? 'text-blue-700 border-b-2 border-blue-600' : 'text-gray-500'}`}
            >
              <Layers size={14} /> Layers
            </button>
            <button
              onClick={() => setRightTab('settings')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium ${rightTab === 'settings' ? 'text-blue-700 border-b-2 border-blue-600' : 'text-gray-500'}`}
            >
              <SettingsIcon size={14} /> Settings
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {rightTab === 'layers' && (
              <LayersPanel blocks={blocks} selectedId={selectedId} onSelect={(id) => { setSelectedId(id); setRightTab('settings'); }} />
            )}
            {rightTab === 'settings' && (
              selectedBlock ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Content</h3>
                    <ContentFieldsPanel
                      fields={selectedMeta?.contentFields}
                      props={selectedBlock.props || {}}
                      onChange={updateSelectedProps}
                    />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Style</h3>
                    <BlockStylePanel
                      style={selectedBlock.props?.style || {}}
                      onChange={(nextStyle) => updateSelectedProps({ ...(selectedBlock.props || {}), style: nextStyle })}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400 text-center py-8">Select a block to edit its settings.</p>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
