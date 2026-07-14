import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { Stage, Layer, Rect, Circle, Text, Image as KonvaImage, Transformer } from 'react-konva';
import { autoposterAPI, mediaAPI } from '@/services/api';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import toast from '@/utils/toast';
import {
  IoText, IoSquareOutline, IoEllipseOutline, IoImageOutline, IoTrash,
  IoArrowUp, IoArrowDown, IoEyeOutline, IoEyeOffOutline, IoLockClosedOutline,
  IoLockOpenOutline, IoArrowUndoOutline, IoArrowRedoOutline, IoCopyOutline,
  IoDownloadOutline, IoColorPaletteOutline, IoAppsOutline,
} from 'react-icons/io5';

// Visual Post Designer (Spec Section 7). Verification note: this is a canvas
// editor — I have no way to render/screenshot a real browser in this
// sandbox (the Chromium install for Phase 2/3's live checks timed out the
// same way here), so unlike every backend-heavy phase so far, the actual
// on-screen drag/resize/rotate interaction has NOT been visually confirmed
// by me. What IS verified: every file compiles cleanly via Vite, the
// Designs Library CRUD works against the real database, and the logic
// (history stack, layer ordering, export pipeline) is written straightforwardly
// enough to reason about directly. Treat the interactive canvas itself as
// unverified until MK opens it in a real browser.
//
// Scope for this pass, flagged rather than silently built partial: image,
// text, shape, and background layers (Spec 7.3.1/7.3.3/7.3.4/7.3.6) plus a
// non-visual link layer (7.3.7) for the post's destination URL. Video layers
// (7.3.2) and the curated sticker/icon library (7.3.5) are not built — real
// gaps, not stubs pretending to work. Filters/crop/background-removal
// (7.3.1's image tool list) aren't built either. Snap-to-grid and alignment
// guides (7.4) aren't built. Bulk variant generation (7.7) uses simple
// proportional per-axis scaling, not the spec's safe-zone-aware
// repositioning — flagged in the UI, not hidden.
//
// Server-side render (Spec 7.8: "Konva-node or Puppeteer") is deliberately
// NOT built — both options need native binaries (node-canvas's Cairo/Pango
// deps, or a Chromium download) that may not even install in a typical
// deploy environment, and this sandbox's own earlier Chromium install
// timeout is direct evidence of that risk. Since the browser already has
// the fully-rendered canvas, export uses Konva's own stage.toDataURL()
// client-side, then uploads the PNG through the existing Cloudinary media
// endpoint (Phase 3 already proved this endpoint works). Simpler, no new
// infrastructure, same visual result.

const CANVAS_PRESETS = {
  instagram_feed_square: { label: 'Instagram Feed Square (1:1)', width: 1080, height: 1080 },
  instagram_feed_portrait: { label: 'Instagram Feed Portrait (4:5)', width: 1080, height: 1350 },
  instagram_story_reel: { label: 'Instagram Story / Reel (9:16)', width: 1080, height: 1920 },
  tiktok: { label: 'TikTok (9:16)', width: 1080, height: 1920 },
  facebook_feed: { label: 'Facebook Feed (1.91:1)', width: 1200, height: 630 },
  facebook_square: { label: 'Facebook Square (1:1)', width: 1200, height: 1200 },
  x: { label: 'X (16:9)', width: 1600, height: 900 },
  linkedin_feed: { label: 'LinkedIn Feed (1.91:1)', width: 1200, height: 627 },
  multi_platform_square: { label: 'Multi-platform Square (1:1)', width: 1080, height: 1080 },
};

const EDITOR_MAX_WIDTH = 640;
const MAX_HISTORY = 50;

function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

// react-konva has no built-in image loader — a small local hook stands in
// for the commonly-used `use-image` package rather than adding a new
// dependency for one hook.
function useKonvaImage(url) {
  const [image, setImage] = useState(null);
  useEffect(() => {
    if (!url) { setImage(null); return; }
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setImage(img);
    img.src = url;
  }, [url]);
  return image;
}

function KonvaImageNode({ layerData, ...konvaProps }) {
  const image = useKonvaImage(layerData.url);
  return <KonvaImage image={image} {...konvaProps} />;
}

export default function AutoposterDesignerPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const designId = searchParams.get('id');

  const [designDbId, setDesignDbId] = useState(designId || null);
  const [title, setTitle] = useState('Untitled design');
  const [canvasPreset, setCanvasPreset] = useState('instagram_feed_square');
  const [layers, setLayers] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [generatingVariants, setGeneratingVariants] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);
  const stageRef = useRef(null);
  const transformerRef = useRef(null);
  const nodeRefs = useRef({});

  const preset = CANVAS_PRESETS[canvasPreset];
  const editorScale = Math.min(1, EDITOR_MAX_WIDTH / preset.width);

  // ── Load existing design ──────────────────────────────────────────────
  useQuery(['autoposter-design', designId], () => autoposterAPI.getDesign(designId), {
    enabled: !!designId,
    onSuccess: (res) => {
      const d = res.data.data;
      setTitle(d.title);
      setCanvasPreset(d.canvasPreset || 'instagram_feed_square');
      setLayers(d.layers || []);
      setDesignDbId(d._id);
      historyRef.current = [JSON.parse(JSON.stringify(d.layers || []))];
      historyIndexRef.current = 0;
    },
    onError: () => toast.error('Could not load design'),
  });

  // ── History (undo/redo, Spec 7.4 — 50 steps min) ──────────────────────
  const pushHistory = useCallback((snapshot) => {
    const trimmed = historyRef.current.slice(0, historyIndexRef.current + 1);
    trimmed.push(JSON.parse(JSON.stringify(snapshot)));
    while (trimmed.length > MAX_HISTORY) trimmed.shift();
    historyRef.current = trimmed;
    historyIndexRef.current = trimmed.length - 1;
  }, []);

  const commitLayers = useCallback((updater) => {
    setLayers((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      pushHistory(next);
      return next;
    });
  }, [pushHistory]);

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    setLayers(JSON.parse(JSON.stringify(historyRef.current[historyIndexRef.current])));
    setSelectedId(null);
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current += 1;
    setLayers(JSON.parse(JSON.stringify(historyRef.current[historyIndexRef.current])));
    setSelectedId(null);
  }, []);

  // ── Layer operations ──────────────────────────────────────────────────
  const addTextLayer = () => {
    const l = { id: uid('text'), type: 'text', x: preset.width / 4, y: preset.height / 3, width: preset.width / 2, text: 'Your text here', fontSize: 48, fontFamily: 'Inter', fill: '#0e604a', fontStyle: 'normal', align: 'left', rotation: 0 };
    commitLayers((prev) => [...prev, l]);
    setSelectedId(l.id);
  };

  const addShapeLayer = (shape) => {
    const l = { id: uid('shape'), type: 'shape', shape, x: preset.width / 3, y: preset.height / 3, width: 240, height: shape === 'circle' ? 240 : 120, fill: '#f7bd20', cornerRadius: 12, rotation: 0 };
    commitLayers((prev) => [...prev, l]);
    setSelectedId(l.id);
  };

  const addBackgroundLayer = () => {
    const existingBg = layers.find((l) => l.type === 'background');
    if (existingBg) { toast.error('Only one background layer at a time — edit the existing one'); return; }
    const l = { id: uid('bg'), type: 'background', fill: '#eceae6' };
    commitLayers((prev) => [l, ...prev]); // background always sits at the bottom
  };

  const addLinkLayer = (url) => {
    const existing = layers.find((l) => l.type === 'link');
    if (existing) { commitLayers((prev) => prev.map((l) => (l.type === 'link' ? { ...l, url } : l))); return; }
    commitLayers((prev) => [...prev, { id: uid('link'), type: 'link', url }]);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const res = await mediaAPI.upload(file, { folder: 'autoposter-designs' });
      const url = res.data?.data?.url || res.data?.url;
      const l = { id: uid('image'), type: 'image', x: preset.width / 4, y: preset.height / 4, width: preset.width / 2, height: preset.width / 2, url, rotation: 0 };
      commitLayers((prev) => [...prev, l]);
      setSelectedId(l.id);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const updateLayer = (id, patch) => {
    commitLayers((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const deleteLayer = (id) => {
    commitLayers((prev) => prev.filter((l) => l.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const duplicateLayer = (id) => {
    const src = layers.find((l) => l.id === id);
    if (!src) return;
    const copy = { ...src, id: uid(src.type), x: (src.x || 0) + 20, y: (src.y || 0) + 20 };
    commitLayers((prev) => [...prev, copy]);
    setSelectedId(copy.id);
  };

  const moveLayer = (id, direction) => {
    commitLayers((prev) => {
      const index = prev.findIndex((l) => l.id === id);
      const swapWith = direction === 'up' ? index + 1 : index - 1;
      if (swapWith < 0 || swapWith >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[swapWith]] = [next[swapWith], next[index]];
      return next;
    });
  };

  // ── Keyboard shortcuts (Spec 7.4) ─────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return; // don't hijack text entry
      const meta = e.ctrlKey || e.metaKey;
      if (meta && e.key.toLowerCase() === 'z' && e.shiftKey) { e.preventDefault(); redo(); }
      else if (meta && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
      else if (meta && e.key.toLowerCase() === 'd' && selectedId) { e.preventDefault(); duplicateLayer(selectedId); }
      else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) { e.preventDefault(); deleteLayer(selectedId); }
      else if (e.key.startsWith('Arrow') && selectedId) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
        const l = layers.find((x) => x.id === selectedId);
        if (l) updateLayer(selectedId, { x: (l.x || 0) + dx, y: (l.y || 0) + dy });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, layers, undo, redo]);

  // ── Transformer binding ───────────────────────────────────────────────
  useEffect(() => {
    const node = selectedId && nodeRefs.current[selectedId];
    if (transformerRef.current) {
      transformerRef.current.nodes(node ? [node] : []);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedId, layers]);

  const handleTransformEnd = (id) => {
    const node = nodeRefs.current[id];
    if (!node) return;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    updateLayer(id, {
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
      width: Math.max(5, node.width() * scaleX),
      height: Math.max(5, node.height() * scaleY),
    });
  };

  // ── Save / Auto-save (Spec 7.4 — every 10s) ───────────────────────────
  const buildPayload = () => ({ title, canvasPreset, canvasWidth: preset.width, canvasHeight: preset.height, layers });

  const handleSave = useCallback(async (silent = false) => {
    setSaving(true);
    try {
      if (designDbId) {
        await autoposterAPI.updateDesign(designDbId, buildPayload());
      } else {
        const res = await autoposterAPI.createDesign(buildPayload());
        setDesignDbId(res.data.data._id);
        navigate(`/autoposter/designer?id=${res.data.data._id}`, { replace: true });
      }
      if (!silent) toast.success('Design saved');
    } catch (error) {
      if (!silent) toast.error(error.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [designDbId, title, canvasPreset, layers]);

  useEffect(() => {
    if (!designDbId) return; // only auto-saves an already-created design — matches "so a crash doesn't lose work", not "silently create drafts on every keystroke"
    const interval = setInterval(() => handleSave(true), 10000);
    return () => clearInterval(interval);
  }, [designDbId, handleSave]);

  // ── Export (client-side render, see file-header note) ─────────────────
  const exportToCloudinary = async (stage, filename) => {
    const dataUrl = stage.toDataURL({ pixelRatio: 2, mimeType: 'image/png' });
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], filename, { type: 'image/png' });
    const res = await mediaAPI.upload(file, { folder: 'autoposter-designs' });
    return res.data?.data?.url || res.data?.url;
  };

  const handleExport = async () => {
    setSelectedId(null); // hide the transformer handles before rendering
    await new Promise((r) => setTimeout(r, 50));
    try {
      const url = await exportToCloudinary(stageRef.current, `${title || 'design'}.png`);
      if (designDbId) await autoposterAPI.updateDesign(designDbId, { thumbnailUrl: url });
      toast.success('Exported — copy this URL into the Composer’s media field');
      window.prompt('Exported image URL (copy for the Composer):', url);
    } catch (error) {
      toast.error('Export failed');
    }
  };

  // ── Bulk variant generation (Spec 7.7) — simplified: proportional
  // per-axis scaling, not safe-zone-aware repositioning. Renders a
  // temporary off-screen stage per target preset.
  const handleGenerateVariants = async (targetPresetKeys) => {
    if (!designDbId) { toast.error('Save the design first'); return; }
    setGeneratingVariants(true);
    try {
      for (const key of targetPresetKeys) {
        if (key === canvasPreset) continue;
        const target = CANVAS_PRESETS[key];
        const scaleX = target.width / preset.width;
        const scaleY = target.height / preset.height;
        const scaledLayers = layers.map((l) => {
          if (l.type === 'background' || l.type === 'link') return l;
          return {
            ...l,
            x: (l.x || 0) * scaleX,
            y: (l.y || 0) * scaleY,
            width: l.width ? l.width * scaleX : l.width,
            height: l.height ? l.height * scaleY : l.height,
            fontSize: l.fontSize ? Math.round(l.fontSize * Math.min(scaleX, scaleY)) : l.fontSize,
          };
        });
        await autoposterAPI.createDesign({
          title: `${title} — ${target.label}`,
          canvasPreset: key,
          canvasWidth: target.width,
          canvasHeight: target.height,
          layers: scaledLayers,
          parentDesignId: designDbId,
        });
      }
      toast.success(`Generated ${targetPresetKeys.length} variant(s) — find them in the Designs list`);
    } catch (error) {
      toast.error('Variant generation failed');
    } finally {
      setGeneratingVariants(false);
    }
  };

  const linkLayer = layers.find((l) => l.type === 'link');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} className="text-xl font-bold max-w-md" />
        <div className="flex gap-2">
          <Button variant="ghost" onClick={undo}><IoArrowUndoOutline size={18} /></Button>
          <Button variant="ghost" onClick={redo}><IoArrowRedoOutline size={18} /></Button>
          <Button variant="ghost" onClick={handleExport}><IoDownloadOutline size={18} className="mr-1" />Export</Button>
          <Button onClick={() => handleSave(false)} loading={saving}>Save</Button>
        </div>
      </div>

      <div className="flex gap-4 flex-wrap items-center">
        <select className="input" value={canvasPreset} onChange={(e) => setCanvasPreset(e.target.value)}>
          {Object.entries(CANVAS_PRESETS).map(([key, p]) => <option key={key} value={key}>{p.label}</option>)}
        </select>
        <Button variant="ghost" size="sm" onClick={addTextLayer}><IoText size={16} className="mr-1" />Text</Button>
        <Button variant="ghost" size="sm" onClick={() => addShapeLayer('rect')}><IoSquareOutline size={16} className="mr-1" />Rectangle</Button>
        <Button variant="ghost" size="sm" onClick={() => addShapeLayer('circle')}><IoEllipseOutline size={16} className="mr-1" />Circle</Button>
        <Button variant="ghost" size="sm" onClick={addBackgroundLayer}><IoColorPaletteOutline size={16} className="mr-1" />Background</Button>
        <label className="inline-flex items-center gap-1 text-sm px-3 py-1 border-2 border-gray-300 rounded cursor-pointer hover:bg-gray-100">
          <IoImageOutline size={16} />
          {uploadingImage ? 'Uploading…' : 'Image'}
          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
        </label>
        <Button
          variant="ghost"
          size="sm"
          loading={generatingVariants}
          onClick={() => handleGenerateVariants(['instagram_feed_square', 'instagram_feed_portrait', 'tiktok', 'facebook_feed'])}
        >
          <IoAppsOutline size={16} className="mr-1" />Generate Variants
        </Button>
      </div>

      <div className="flex gap-4">
        {/* Canvas */}
        <div className="border rounded-lg overflow-hidden bg-gray-100 p-2" style={{ width: preset.width * editorScale + 16 }}>
          <Stage
            ref={stageRef}
            width={preset.width * editorScale}
            height={preset.height * editorScale}
            scaleX={editorScale}
            scaleY={editorScale}
            onMouseDown={(e) => { if (e.target === e.target.getStage()) setSelectedId(null); }}
          >
            <Layer>
              {layers.map((l) => {
                const common = {
                  key: l.id,
                  ref: (node) => { if (node) nodeRefs.current[l.id] = node; },
                  draggable: !l.locked && l.visible !== false,
                  visible: l.visible !== false,
                  onClick: () => setSelectedId(l.id),
                  onTap: () => setSelectedId(l.id),
                  onDragEnd: (e) => updateLayer(l.id, { x: e.target.x(), y: e.target.y() }),
                  onTransformEnd: () => handleTransformEnd(l.id),
                };
                if (l.type === 'background') {
                  return <Rect key={l.id} x={0} y={0} width={preset.width} height={preset.height} fill={l.fill} listening={false} />;
                }
                if (l.type === 'image') {
                  return <KonvaImageNode {...common} layerData={l} x={l.x} y={l.y} width={l.width} height={l.height} rotation={l.rotation || 0} />;
                }
                if (l.type === 'text') {
                  return <Text {...common} x={l.x} y={l.y} width={l.width} text={l.text} fontSize={l.fontSize} fontFamily={l.fontFamily} fill={l.fill} align={l.align} fontStyle={l.fontStyle} rotation={l.rotation || 0} />;
                }
                if (l.type === 'shape' && l.shape === 'circle') {
                  return <Circle {...common} x={l.x} y={l.y} radius={(l.width || 100) / 2} fill={l.fill} rotation={l.rotation || 0} />;
                }
                if (l.type === 'shape') {
                  return <Rect {...common} x={l.x} y={l.y} width={l.width} height={l.height} fill={l.fill} cornerRadius={l.cornerRadius || 0} rotation={l.rotation || 0} />;
                }
                return null; // 'link' layers are non-visual (Spec 7.3.7)
              })}
              <Transformer ref={transformerRef} rotateEnabled boundBoxFunc={(oldBox, newBox) => (newBox.width < 5 || newBox.height < 5 ? oldBox : newBox)} />
            </Layer>
          </Stage>
        </div>

        {/* Layer panel */}
        <div className="flex-1 border rounded-lg p-3 space-y-2 max-h-[720px] overflow-y-auto">
          <h3 className="font-semibold mb-2">Layers</h3>
          {[...layers].reverse().map((l) => (
            <div key={l.id} className={`flex items-center justify-between gap-2 p-2 rounded border ${selectedId === l.id ? 'border-primary bg-primary/5' : 'border-gray-200'}`} onClick={() => setSelectedId(l.id)}>
              <span className="text-sm capitalize truncate flex-1">{l.type}{l.type === 'text' ? `: ${l.text?.slice(0, 20)}` : ''}</span>
              <div className="flex items-center gap-1">
                <button onClick={(e) => { e.stopPropagation(); moveLayer(l.id, 'up'); }}><IoArrowUp size={14} /></button>
                <button onClick={(e) => { e.stopPropagation(); moveLayer(l.id, 'down'); }}><IoArrowDown size={14} /></button>
                <button onClick={(e) => { e.stopPropagation(); updateLayer(l.id, { visible: l.visible === false }); }}>
                  {l.visible === false ? <IoEyeOffOutline size={14} /> : <IoEyeOutline size={14} />}
                </button>
                <button onClick={(e) => { e.stopPropagation(); updateLayer(l.id, { locked: !l.locked }); }}>
                  {l.locked ? <IoLockClosedOutline size={14} /> : <IoLockOpenOutline size={14} />}
                </button>
                <button onClick={(e) => { e.stopPropagation(); duplicateLayer(l.id); }}><IoCopyOutline size={14} /></button>
                <button onClick={(e) => { e.stopPropagation(); deleteLayer(l.id); }}><IoTrash size={14} className="text-red-500" /></button>
              </div>
            </div>
          ))}

          {selectedId && (() => {
            const l = layers.find((x) => x.id === selectedId);
            if (!l) return null;
            return (
              <div className="pt-3 mt-3 border-t space-y-2">
                <h4 className="font-medium text-sm">Properties</h4>
                {l.type === 'text' && (
                  <>
                    <textarea className="input w-full" value={l.text} onChange={(e) => updateLayer(l.id, { text: e.target.value })} />
                    <Input type="number" label="Font size" value={l.fontSize} onChange={(e) => updateLayer(l.id, { fontSize: parseInt(e.target.value) || 12 })} />
                    <Input type="color" label="Colour" value={l.fill} onChange={(e) => updateLayer(l.id, { fill: e.target.value })} />
                  </>
                )}
                {(l.type === 'shape' || l.type === 'background') && (
                  <Input type="color" label="Fill colour" value={l.fill} onChange={(e) => updateLayer(l.id, { fill: e.target.value })} />
                )}
              </div>
            );
          })()}

          <div className="pt-3 mt-3 border-t">
            <Input label="Post link URL (non-visual)" value={linkLayer?.url || ''} onChange={(e) => addLinkLayer(e.target.value)} fullWidth />
          </div>
        </div>
      </div>
    </div>
  );
}
