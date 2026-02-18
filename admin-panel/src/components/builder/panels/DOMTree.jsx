import React from 'react';
import ReactDOM from 'react-dom';
import { useEditor, ROOT_NODE } from '@craftjs/core';
import { Layers, ChevronRight, ChevronDown, ArrowRight, AlertCircle, Trash2, Copy } from 'lucide-react';
import { getElementCategory } from '@/components/builder/utils/NestingRules';
import { ContextMenu } from '@/components/builder/utils/ContextMenu';
import { useClipboard } from '@/components/builder/utils/Clipboard';

// Module-level drag store — avoids the HTML5 dataTransfer security restriction
// where getData() returns empty during dragOver events in most browsers.
let dragStore = { nodeId: null, nodeType: null };

const TreeNode = ({ nodeId, depth = 0, expandedByDefault = true }) => {
  const { actions, query } = useEditor();
  const clipboard = useClipboard();
  const [expanded, setExpanded] = React.useState(expandedByDefault);
  React.useEffect(() => {
    setExpanded(expandedByDefault);
  }, [expandedByDefault]);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [dropPosition, setDropPosition] = React.useState(null); // 'above', 'below', 'inside'
  const [ctxMenu, setCtxMenu] = React.useState(null); // { x, y }
  const selected = useEditor((state) => state.events.selected?.has(nodeId));

  const node = query.node(nodeId).get();
  const isRoot = nodeId === ROOT_NODE || nodeId === 'ROOT';
  const displayName = isRoot
    ? 'Body'
    : node?.data?.displayName || node?.data?.name || node?.data?.type?.resolvedName || 'Component';
  const childNodes = node?.data?.nodes || [];
  const hasChildren = childNodes.length > 0;
  const isCanvas = node?.data?.isCanvas === true;

  const handleDragStart = (e) => {
    if (isRoot) { e.preventDefault(); return; }
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', nodeId); // required for Firefox
    dragStore = {
      nodeId,
      nodeType: node?.data?.type?.resolvedName || 'Unknown',
    };
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    dragStore = { nodeId: null, nodeType: null };
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const srcId = dragStore.nodeId;
    if (!srcId || srcId === nodeId) return;

    // Calculate drop position based on mouse position
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;

    let position = 'inside';
    if (y < height * 0.25) position = 'above';
    else if (y > height * 0.75) position = 'below';

    // Only allow 'inside' if this node is a canvas (can accept children)
    if (position === 'inside' && !isCanvas) {
      position = y < height * 0.5 ? 'above' : 'below';
    }

    setDropPosition(position);
    setIsDragOver(true);
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setDropPosition(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const srcId = dragStore.nodeId;
    if (!srcId || srcId === nodeId) {
      resetDragState();
      return;
    }

    try {
      if (dropPosition === 'inside' && isCanvas) {
        // Move as last child of this canvas node
        actions.move(srcId, nodeId, childNodes.length);
      } else {
        // Move as sibling (above or below this node in its parent)
        const parentId = node?.data?.parent;
        if (!parentId) { resetDragState(); return; }
        const parentNode = query.node(parentId).get();
        const siblings = parentNode?.data?.nodes || [];
        let targetIndex = siblings.indexOf(nodeId);
        if (targetIndex === -1) { resetDragState(); return; }

        // If the dragged node is already a sibling and comes before the target, adjust index
        const srcCurrentIndex = siblings.indexOf(srcId);
        if (srcCurrentIndex !== -1 && srcCurrentIndex < targetIndex) {
          targetIndex -= 1;
        }

        if (dropPosition === 'below') targetIndex += 1;
        actions.move(srcId, parentId, targetIndex);
      }
    } catch (error) {
      console.error('DOMTree move failed:', error);
    }

    resetDragState();
  };

  const resetDragState = () => {
    setIsDragging(false);
    setIsDragOver(false);
    setDropPosition(null);
  };

  const handleSelect = () => {
    actions.selectNode(nodeId);
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    actions.selectNode(nodeId);
    setCtxMenu({ x: e.clientX, y: e.clientY });
  };

  const handleDelete = (e) => {
    if (e) e.stopPropagation();
    if (isRoot) return;
    const nodeName = node?.data?.displayName || node?.data?.name || 'Element';
    if (window.confirm(`Delete "${nodeName}"?`)) {
      try { actions.delete(nodeId); } catch (err) { console.error('Delete failed:', err); }
    }
  };

  const handleDuplicate = (e) => {
    if (e) e.stopPropagation();
    try { clipboard.duplicate(nodeId); } catch (err) { console.error('Duplicate failed:', err); }
  };

  const category = !isRoot ? getElementCategory(node?.data?.type?.resolvedName) : null;
  const categoryLabel = category === 'UNKNOWN' ? 'Element' : category;
  const categoryClass =
    category === 'TEXT_ONLY' ? 'bg-blue-100 text-blue-700' :
    category === 'STRUCTURAL' ? 'bg-green-100 text-green-700' :
    category === 'MEDIA' ? 'bg-purple-100 text-purple-700' :
    category === 'INTERACTIVE' ? 'bg-orange-100 text-orange-700' :
    category === 'COMPLEX' ? 'bg-indigo-100 text-indigo-700' :
    category === 'ENHANCED' ? 'bg-pink-100 text-pink-700' :
    'bg-gray-200 text-gray-600';

  return (
    <div className="select-none">
      {/* Drop zone indicator for above */}
      {isDragOver && dropPosition === 'above' && (
        <div className="h-0.5 mx-2 bg-blue-500 transition-all duration-150" />
      )}

      <div
        draggable={!isRoot}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleSelect}
        onContextMenu={handleContextMenu}
        className={`flex items-center gap-2 py-1 px-2 rounded cursor-pointer hover:bg-gray-100 transition-all duration-150 ${
          selected ? 'bg-blue-100 ring-1 ring-blue-300' : ''
        } ${isDragging ? 'opacity-50' : ''} ${
          isDragOver && dropPosition === 'inside' ? 'ring-1 ring-green-400 bg-green-50' : ''
        }`}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        {hasChildren ? (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="p-0.5 hover:bg-gray-200 rounded"
          >
            {expanded ? (
              <ChevronDown size={14} className="text-gray-500" />
            ) : (
              <ChevronRight size={14} className="text-gray-500" />
            )}
          </button>
        ) : (
          <div className="w-5 flex items-center justify-center">
            {depth > 0 && <div className="w-2 h-2 border-2 border-gray-300 rounded-full" />}
          </div>
        )}

        <Layers size={14} className="text-gray-500" />
        <span className="text-sm text-gray-700 flex-1">{displayName}</span>

        {/* Element category indicator */}
        {!isRoot && (
          <span className={`text-xs px-1.5 py-0.5 rounded ${categoryClass}`}>
            {categoryLabel}
          </span>
        )}

        {/* Drop position indicator */}
        {isDragOver && dropPosition === 'inside' && (
          <ArrowRight size={12} className="text-green-600" />
        )}

        {/* Action buttons */}
        {!isRoot && (
          <div className="flex items-center gap-1">
            <button onClick={handleDuplicate} className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700" title="Duplicate">
              <Copy size={12} />
            </button>
            <button onClick={handleDelete} className="p-1 hover:bg-red-100 rounded text-gray-500 hover:text-red-600" title="Delete">
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Drop zone indicator for below */}
      {isDragOver && dropPosition === 'below' && (
        <div className="h-0.5 mx-2 bg-blue-500 transition-all duration-150" />
      )}

      {hasChildren && expanded && (
        <div className="relative">
          {depth > 0 && (
            <div
              className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-300"
              style={{ left: `${depth * 20 + 4}px`, marginLeft: '-1px' }}
            />
          )}
          {childNodes.map((childId) => (
            <div key={childId} className="relative">
              {depth > 0 && (
                <div
                  className="absolute top-2.5 h-0.5 bg-gray-300"
                  style={{ left: `${depth * 20 + 4}px`, width: '16px', marginLeft: '-1px' }}
                />
              )}
              <TreeNode nodeId={childId} depth={depth + 1} />
            </div>
          ))}
        </div>
      )}

      {/* Context Menu */}
      {ctxMenu && ReactDOM.createPortal(
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          onClose={() => setCtxMenu(null)}
          nodeName={displayName}
          isRoot={isRoot}
          onCopy={() => clipboard.copy(nodeId)}
          onCut={() => clipboard.cut(nodeId)}
          onPaste={() => clipboard.paste(nodeId)}
          onDuplicate={() => clipboard.duplicate(nodeId)}
          onDelete={handleDelete}
          onWrapWithDiv={!isRoot ? () => clipboard.wrapWithDiv(nodeId) : undefined}
          onMoveUp={!isRoot ? () => clipboard.moveUp(nodeId) : undefined}
          onMoveDown={!isRoot ? () => clipboard.moveDown(nodeId) : undefined}
          onSelectParent={!isRoot ? () => clipboard.selectParent(nodeId) : undefined}
          onCopyStyle={() => clipboard.copyStyle(nodeId)}
          onPasteStyle={() => clipboard.pasteStyle(nodeId)}
          hasClipboard={clipboard.hasClipboard}
          hasStyleClipboard={clipboard.hasStyleClipboard}
        />,
        document.body
      )}
    </div>
  );
};

export const DOMTree = ({ expandAll, collapseAll }) => {
  const { nodes } = useEditor((state) => ({
    nodes: state.nodes,
  }));
  const [allExpanded, setAllExpanded] = React.useState(true);

  React.useEffect(() => {
    if (expandAll) setAllExpanded(true);
  }, [expandAll]);
  React.useEffect(() => {
    if (collapseAll) setAllExpanded(false);
  }, [collapseAll]);

  const rootNodeId = Object.keys(nodes).find((id) => !nodes[id].data.parent);

  if (!rootNodeId) {
    return (
      <div className="text-sm text-gray-500 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Layers size={14} />
          <span className="font-medium">Page Structure</span>
        </div>
        <div className="ml-6 text-gray-400">
          <div className="mb-2">No components yet.</div>
          <div className="text-xs">Click "+ Add" to create your first element.</div>
          <div className="text-xs mt-1">Elements will be nested automatically.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-sm">
      <TreeNode nodeId={rootNodeId} expandedByDefault={allExpanded} />
    </div>
  );
};
