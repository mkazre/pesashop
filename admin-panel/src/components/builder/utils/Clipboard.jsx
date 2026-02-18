import React from 'react';
import { useState, useCallback, useEffect } from 'react';
import { useEditor, ROOT_NODE } from '@craftjs/core';
import { DivBlock } from '@/components/builder/elements/enhanced/DivBlock';

// Module-level clipboard so it persists across hook instances
let _clipboard = null;
let _styleClipboard = null;
let _listeners = new Set();
const notify = () => _listeners.forEach((fn) => fn());

export const useClipboard = () => {
  const { query, actions } = useEditor();
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const listener = () => forceUpdate((n) => n + 1);
    _listeners.add(listener);
    return () => _listeners.delete(listener);
  }, []);

  // ── Serialise a node + its entire subtree into a portable map ──
  const serialiseTree = useCallback((nodeId) => {
    try {
      const allSerialized = JSON.parse(query.serialize());
      const collect = (id, map) => {
        const nodeData = allSerialized[id];
        if (!nodeData) return map;
        map[id] = nodeData;
        const children = nodeData.nodes || [];
        children.forEach((cid) => collect(cid, map));
        // Also collect linked nodes
        const linked = nodeData.linkedNodes || {};
        Object.values(linked).forEach((lid) => collect(lid, map));
        return map;
      };
      return collect(nodeId, {});
    } catch (e) {
      console.error('serialiseTree error:', e);
      return null;
    }
  }, [query]);

  // ── Build a proper Craft.js node tree from serialized data with fresh IDs ──
  const buildNodeTree = useCallback((serializedTree, originalRootId, newParentId) => {
    // Generate fresh IDs for all nodes
    const idMap = {};
    Object.keys(serializedTree).forEach((oldId) => {
      idMap[oldId] = `node_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    });

    const newRootId = idMap[originalRootId];
    const nodeTree = { rootNodeId: newRootId, nodes: {} };

    Object.entries(serializedTree).forEach(([oldId, serializedData]) => {
      const newId = idMap[oldId];

      // Use Craft.js's own parseSerializedNode to properly resolve types
      const craftNode = query.parseSerializedNode(serializedData).toNode((node) => {
        node.id = newId;
      });

      // Remap child node IDs
      craftNode.data.nodes = (craftNode.data.nodes || []).map((cid) => idMap[cid] || cid);

      // Remap linked node IDs
      if (craftNode.data.linkedNodes) {
        const ln = {};
        Object.entries(craftNode.data.linkedNodes).forEach(([k, v]) => { ln[k] = idMap[v] || v; });
        craftNode.data.linkedNodes = ln;
      }

      // Remap parent
      if (oldId === originalRootId) {
        craftNode.data.parent = newParentId;
      } else {
        craftNode.data.parent = idMap[craftNode.data.parent] || craftNode.data.parent;
      }

      nodeTree.nodes[newId] = craftNode;
    });

    return nodeTree;
  }, [query]);

  // ── Copy ──
  const copy = useCallback((nodeId) => {
    const tree = serialiseTree(nodeId);
    if (tree) {
      _clipboard = { rootId: nodeId, tree };
      notify();
      return true;
    }
    return false;
  }, [serialiseTree]);

  // ── Cut (copy then delete) ──
  const cut = useCallback((nodeId) => {
    if (nodeId === ROOT_NODE || nodeId === 'ROOT') return false;
    const ok = copy(nodeId);
    if (ok) {
      try { actions.delete(nodeId); } catch (e) { console.error('Cut delete failed:', e); }
    }
    return ok;
  }, [copy, actions]);

  // ── Paste into a target node ──
  const paste = useCallback((targetNodeId) => {
    if (!_clipboard) return false;
    try {
      const targetNode = query.node(targetNodeId).get();
      if (!targetNode) return false;

      // Determine paste destination: if target is a canvas, paste inside; otherwise paste as sibling
      const isCanvas = targetNode.data?.isCanvas;
      const parentId = isCanvas ? targetNodeId : targetNode.data?.parent;
      if (!parentId) return false;

      const { rootId, tree } = _clipboard;
      const nodeTree = buildNodeTree(tree, rootId, parentId);

      if (isCanvas) {
        actions.addNodeTree(nodeTree, parentId);
      } else {
        // Paste after the selected node
        const parentNode = query.node(parentId).get();
        const siblings = parentNode?.data?.nodes || [];
        const idx = siblings.indexOf(targetNodeId);
        actions.addNodeTree(nodeTree, parentId, idx + 1);
      }
      return true;
    } catch (e) {
      console.error('Paste error:', e);
    }
    return false;
  }, [query, actions, buildNodeTree]);

  // ── Duplicate ──
  const duplicate = useCallback((nodeId) => {
    if (nodeId === ROOT_NODE || nodeId === 'ROOT') return false;
    try {
      const node = query.node(nodeId).get();
      if (!node?.data?.parent) return false;
      const parentId = node.data.parent;

      const tree = serialiseTree(nodeId);
      if (!tree) return false;

      const nodeTree = buildNodeTree(tree, nodeId, parentId);

      const parentNode = query.node(parentId).get();
      const siblings = parentNode?.data?.nodes || [];
      const idx = siblings.indexOf(nodeId);
      actions.addNodeTree(nodeTree, parentId, idx + 1);
      return true;
    } catch (e) {
      console.error('Duplicate error:', e);
    }
    return false;
  }, [query, actions, serialiseTree, buildNodeTree]);

  // ── Wrap with Div ──
  const wrapWithDiv = useCallback((nodeId) => {
    if (nodeId === ROOT_NODE || nodeId === 'ROOT') return false;
    try {
      const node = query.node(nodeId).get();
      if (!node?.data?.parent) return false;
      const parentId = node.data.parent;
      const parentNode = query.node(parentId).get();
      const siblings = parentNode?.data?.nodes || [];
      const idx = siblings.indexOf(nodeId);

      // Create a DivBlock wrapper
      const divTree = query.parseReactElement(React.createElement(DivBlock)).toNodeTree();

      // Insert the div at the same position
      actions.addNodeTree(divTree, parentId, idx);

      // Move the original node inside the new div
      const divId = divTree.rootNodeId;
      actions.move(nodeId, divId, 0);

      // Select the wrapper
      actions.selectNode(divId);
      return true;
    } catch (e) {
      console.error('Wrap with div error:', e);
    }
    return false;
  }, [query, actions]);

  // ── Move Up / Down ──
  const moveUp = useCallback((nodeId) => {
    try {
      const node = query.node(nodeId).get();
      if (!node?.data?.parent) return;
      const parentId = node.data.parent;
      const parentNode = query.node(parentId).get();
      const siblings = parentNode?.data?.nodes || [];
      const idx = siblings.indexOf(nodeId);
      if (idx > 0) actions.move(nodeId, parentId, idx - 1);
    } catch (e) { console.error('Move up error:', e); }
  }, [query, actions]);

  const moveDown = useCallback((nodeId) => {
    try {
      const node = query.node(nodeId).get();
      if (!node?.data?.parent) return;
      const parentId = node.data.parent;
      const parentNode = query.node(parentId).get();
      const siblings = parentNode?.data?.nodes || [];
      const idx = siblings.indexOf(nodeId);
      if (idx < siblings.length - 1) actions.move(nodeId, parentId, idx + 2);
    } catch (e) { console.error('Move down error:', e); }
  }, [query, actions]);

  // ── Select Parent ──
  const selectParent = useCallback((nodeId) => {
    try {
      const node = query.node(nodeId).get();
      if (node?.data?.parent) actions.selectNode(node.data.parent);
    } catch (e) { console.error('Select parent error:', e); }
  }, [query, actions]);

  // ── Copy / Paste Style ──
  const copyStyle = useCallback((nodeId) => {
    try {
      const node = query.node(nodeId).get();
      if (node?.data?.props?.style) {
        _styleClipboard = JSON.parse(JSON.stringify(node.data.props.style));
        notify();
        return true;
      }
    } catch (e) { console.error('Copy style error:', e); }
    return false;
  }, [query]);

  const pasteStyle = useCallback((nodeId) => {
    if (!_styleClipboard) return false;
    try {
      actions.setProp(nodeId, (props) => {
        props.style = { ...props.style, ..._styleClipboard };
      });
      return true;
    } catch (e) { console.error('Paste style error:', e); }
    return false;
  }, [actions]);

  return {
    copy,
    cut,
    paste,
    duplicate,
    wrapWithDiv,
    moveUp,
    moveDown,
    selectParent,
    copyStyle,
    pasteStyle,
    hasClipboard: !!_clipboard,
    hasStyleClipboard: !!_styleClipboard,
  };
};
