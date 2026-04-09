import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from '@/utils/toast';
import { mobileAppConfigAPI } from '@/services/api';
import {
  IoAddOutline,
  IoTrashOutline,
  IoArrowUpOutline,
  IoArrowDownOutline,
  IoCloudUploadOutline,
  IoPhonePortraitOutline,
  IoEyeOutline,
} from 'react-icons/io5';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const STYLES = [
  { id: 'centered', label: 'Centered', desc: 'Image above, heading & text centered below' },
  { id: 'fullImage', label: 'Full Image', desc: 'Full-screen background image with text overlay at bottom' },
  { id: 'bottomCard', label: 'Bottom Card', desc: 'Image top half, white card bottom half with text' },
  { id: 'gradient', label: 'Gradient', desc: 'Gradient background with image, heading & text centered' },
  { id: 'split', label: 'Split', desc: 'Image top 60%, text & buttons bottom 40%' },
];

const DEFAULT_SLIDE = { image: '', heading: 'Welcome', text: 'Discover amazing products', order: 0 };

function ColorField({ label, value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-700 w-32">{label}</label>
      <input type="color" value={value || '#000000'} onChange={(e) => onChange(e.target.value)} className="w-10 h-8 border rounded cursor-pointer" />
      <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} className="border rounded px-2 py-1 text-sm w-24 font-mono" />
    </div>
  );
}

function ImageUploadField({ value, onUpload, label }) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await mobileAppConfigAPI.uploadSplashImage(formData);
      if (res.data?.data?.url) {
        onUpload(res.data.data.url);
        toast.success('Image uploaded');
      }
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="text-sm font-medium text-gray-700 block mb-1">{label}</label>
      {value && (
        <div className="mb-2 relative inline-block">
          <img src={value.startsWith('http') ? value : `${API_URL}${value}`} alt="slide" className="w-40 h-24 object-cover rounded border" />
          <button onClick={() => onUpload('')} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">×</button>
        </div>
      )}
      <label className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded border cursor-pointer ${uploading ? 'opacity-50' : 'hover:bg-gray-50'}`}>
        <IoCloudUploadOutline size={16} />
        {uploading ? 'Uploading...' : 'Upload Image'}
        <input type="file" accept="image/*" onChange={handleFile} className="hidden" disabled={uploading} />
      </label>
    </div>
  );
}

// ─── Phone Preview Component ────────────────────────────────────
function PhonePreview({ config, slides, currentSlide }) {
  const slide = slides[currentSlide] || {};
  const imgSrc = slide.image ? (slide.image.startsWith('http') ? slide.image : `${API_URL}${slide.image}`) : null;
  const style = config.style || 'centered';

  const bg = style === 'gradient'
    ? { background: `linear-gradient(180deg, ${config.gradientFrom || '#0F604B'}, ${config.gradientTo || '#1a8a6a'})` }
    : { background: config.backgroundColor || '#ffffff' };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[260px] h-[520px] rounded-[32px] border-4 border-gray-800 bg-gray-800 overflow-hidden shadow-2xl">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-gray-800 rounded-b-xl z-20" />

        {/* Screen */}
        <div className="w-full h-full rounded-[28px] overflow-hidden flex flex-col" style={bg}>
          {/* ── Centered Style ── */}
          {style === 'centered' && (
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
              {imgSrc && <img src={imgSrc} alt="" className="w-32 h-32 object-contain mb-6" />}
              <h3 className="text-lg font-bold mb-2" style={{ color: config.headingColor }}>{slide.heading || 'Heading'}</h3>
              <p className="text-xs" style={{ color: config.textColor }}>{slide.text || 'Description text'}</p>
            </div>
          )}

          {/* ── Full Image Style ── */}
          {style === 'fullImage' && (
            <div className="flex-1 relative">
              {imgSrc && <img src={imgSrc} alt="" className="absolute inset-0 w-full h-full object-cover" />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-16 left-0 right-0 px-6 text-center">
                <h3 className="text-lg font-bold mb-2 text-white">{slide.heading || 'Heading'}</h3>
                <p className="text-xs text-gray-200">{slide.text || 'Description text'}</p>
              </div>
            </div>
          )}

          {/* ── Bottom Card Style ── */}
          {style === 'bottomCard' && (
            <div className="flex-1 flex flex-col">
              <div className="flex-1 relative" style={{ background: config.gradientFrom || '#0F604B' }}>
                {imgSrc && <img src={imgSrc} alt="" className="w-full h-full object-contain p-8" />}
              </div>
              <div className="bg-white rounded-t-3xl px-6 py-6 -mt-6 relative z-10 text-center">
                <h3 className="text-base font-bold mb-2" style={{ color: config.headingColor }}>{slide.heading || 'Heading'}</h3>
                <p className="text-xs" style={{ color: config.textColor }}>{slide.text || 'Description text'}</p>
              </div>
            </div>
          )}

          {/* ── Gradient Style ── */}
          {style === 'gradient' && (
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
              {imgSrc && <img src={imgSrc} alt="" className="w-28 h-28 object-contain mb-6" />}
              <h3 className="text-lg font-bold mb-2 text-white">{slide.heading || 'Heading'}</h3>
              <p className="text-xs text-white/80">{slide.text || 'Description text'}</p>
            </div>
          )}

          {/* ── Split Style ── */}
          {style === 'split' && (
            <div className="flex-1 flex flex-col">
              <div className="h-[60%] relative" style={{ background: config.backgroundColor || '#f3f4f6' }}>
                {imgSrc && <img src={imgSrc} alt="" className="w-full h-full object-contain p-4" />}
              </div>
              <div className="h-[40%] bg-white px-6 py-4 text-center flex flex-col justify-center">
                <h3 className="text-base font-bold mb-2" style={{ color: config.headingColor }}>{slide.heading || 'Heading'}</h3>
                <p className="text-xs" style={{ color: config.textColor }}>{slide.text || 'Description text'}</p>
              </div>
            </div>
          )}

          {/* Dots */}
          {config.showDots !== false && slides.length > 1 && (
            <div className="flex justify-center gap-1.5 pb-3 pt-1">
              {slides.map((_, i) => (
                <div key={i} className="rounded-full transition-all" style={{
                  width: i === currentSlide ? 20 : 6, height: 6,
                  background: i === currentSlide ? (config.dotActiveColor || '#0F604B') : (config.dotColor || '#d1d5db'),
                  borderRadius: 3,
                }} />
              ))}
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-between px-4 pb-4">
            <button className="text-xs px-3 py-1.5 rounded" style={{ color: config.buttonColor || '#0F604B' }}>
              {config.skipButtonText || 'Skip'}
            </button>
            <button className="text-xs px-4 py-1.5 rounded-full font-semibold" style={{ background: config.buttonColor || '#0F604B', color: config.buttonTextColor || '#fff' }}>
              {currentSlide === slides.length - 1 ? (config.finishButtonText || 'Get Started') : (config.nextButtonText || 'Next')}
            </button>
          </div>
        </div>
      </div>
      {/* Slide nav */}
      <p className="text-xs text-gray-500 mt-3">Slide {currentSlide + 1} of {slides.length || 1}</p>
    </div>
  );
}

// ─── Main Page Component ────────────────────────────────────────
export default function MobileAppSplashPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery('mobile-app-config', () => mobileAppConfigAPI.get());
  const config = data?.data?.data?.splashScreen || {};

  const [formState, setFormState] = useState(null);
  const [previewSlide, setPreviewSlide] = useState(0);

  useEffect(() => {
    if (!data?.data?.data) return;
    const cfg = data.data.data.splashScreen || {};
    setFormState({
      enabled: cfg.enabled ?? true,
      style: cfg.style || 'centered',
      slides: cfg.slides?.length ? cfg.slides.map((s, i) => ({ ...s, order: s.order ?? i })) : [{ ...DEFAULT_SLIDE }],
      backgroundColor: cfg.backgroundColor || '#ffffff',
      headingColor: cfg.headingColor || '#1f2937',
      textColor: cfg.textColor || '#6b7280',
      buttonColor: cfg.buttonColor || '#0F604B',
      buttonTextColor: cfg.buttonTextColor || '#ffffff',
      skipButtonText: cfg.skipButtonText || 'Skip',
      nextButtonText: cfg.nextButtonText || 'Next',
      finishButtonText: cfg.finishButtonText || 'Get Started',
      showDots: cfg.showDots ?? true,
      dotColor: cfg.dotColor || '#d1d5db',
      dotActiveColor: cfg.dotActiveColor || '#0F604B',
      gradientFrom: cfg.gradientFrom || '#0F604B',
      gradientTo: cfg.gradientTo || '#1a8a6a',
    });
  }, [data]);

  const saveMutation = useMutation(
    (payload) => mobileAppConfigAPI.updateSplash(payload),
    {
      onSuccess: (res) => {
        queryClient.invalidateQueries('mobile-app-config');
        toast.success('Onboarding screens saved');
      },
      onError: (err) => {
        const msg = err?.response?.data?.message || err?.message || 'Failed to save';
        toast.error(`Save failed: ${msg}`);
        console.error('[MobileAppSplashPage] Save error:', err?.response?.data || err);
      },
    }
  );

  const handleSave = () => {
    if (!formState) return;
    const payload = {
      ...formState,
      slides: formState.slides.map((s, i) => ({
        image: s.image || '',
        heading: s.heading || '',
        text: s.text || '',
        order: i,
      })),
    };
    saveMutation.mutate(payload);
  };

  const updateField = (field, value) => setFormState((prev) => ({ ...prev, [field]: value }));
  const updateSlide = (index, field, value) => {
    setFormState((prev) => {
      const slides = [...prev.slides];
      slides[index] = { ...slides[index], [field]: value };
      return { ...prev, slides };
    });
  };
  const addSlide = () => {
    setFormState((prev) => ({
      ...prev,
      slides: [...prev.slides, { ...DEFAULT_SLIDE, heading: `Slide ${prev.slides.length + 1}`, order: prev.slides.length }],
    }));
    setPreviewSlide(formState.slides.length);
  };
  const removeSlide = (index) => {
    if (formState.slides.length <= 1) return toast.error('Need at least 1 slide');
    setFormState((prev) => ({ ...prev, slides: prev.slides.filter((_, i) => i !== index) }));
    if (previewSlide >= formState.slides.length - 1) setPreviewSlide(Math.max(0, previewSlide - 1));
  };
  const moveSlide = (index, dir) => {
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= formState.slides.length) return;
    setFormState((prev) => {
      const slides = [...prev.slides];
      [slides[index], slides[newIndex]] = [slides[newIndex], slides[index]];
      return { ...prev, slides };
    });
    setPreviewSlide(newIndex);
  };

  if (isLoading || !formState) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <IoPhonePortraitOutline size={28} />
          <div>
            <h1 className="text-2xl font-bold">Mobile App — Splash Screen</h1>
            <p className="text-sm text-gray-500">Configure the onboarding slides shown when users first open the app</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={saveMutation.isLoading} className="px-6 py-2.5 bg-primary text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50">
          {saveMutation.isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="flex gap-8">
        {/* Left: Settings */}
        <div className="flex-1 space-y-6">

          {/* Enabled toggle */}
          <div className="bg-white border rounded-lg p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={formState.enabled} onChange={(e) => updateField('enabled', e.target.checked)} className="w-5 h-5 accent-primary" />
              <span className="font-semibold">Enable Splash Screen</span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-8">When enabled, new users see onboarding slides on first app launch</p>
          </div>

          {/* Style Picker */}
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-semibold mb-3">Layout Style</h3>
            <div className="grid grid-cols-5 gap-2">
              {STYLES.map((s) => (
                <button key={s.id} onClick={() => updateField('style', s.id)} className={`border-2 rounded-lg p-3 text-center transition-all ${formState.style === s.id ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="text-sm font-semibold">{s.label}</div>
                  <div className="text-[10px] text-gray-500 mt-1">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Slides */}
          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Slides ({formState.slides.length})</h3>
              <button onClick={addSlide} className="flex items-center gap-1 text-sm text-primary hover:underline">
                <IoAddOutline size={16} /> Add Slide
              </button>
            </div>

            <div className="space-y-4">
              {formState.slides.map((slide, i) => (
                <div key={i} onClick={() => setPreviewSlide(i)} className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${previewSlide === i ? 'border-primary bg-primary/5' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-gray-600">Slide {i + 1}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={(e) => { e.stopPropagation(); moveSlide(i, -1); }} disabled={i === 0} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"><IoArrowUpOutline size={14} /></button>
                      <button onClick={(e) => { e.stopPropagation(); moveSlide(i, 1); }} disabled={i === formState.slides.length - 1} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"><IoArrowDownOutline size={14} /></button>
                      <button onClick={(e) => { e.stopPropagation(); removeSlide(i); }} className="p-1 hover:bg-red-50 text-red-500 rounded"><IoTrashOutline size={14} /></button>
                    </div>
                  </div>
                  <ImageUploadField label="Image" value={slide.image} onUpload={(url) => updateSlide(i, 'image', url)} />
                  <div className="mt-3">
                    <label className="text-sm font-medium text-gray-700">Heading</label>
                    <input type="text" value={slide.heading} onChange={(e) => updateSlide(i, 'heading', e.target.value)} className="w-full border rounded px-3 py-1.5 text-sm mt-1" placeholder="Heading text" />
                  </div>
                  <div className="mt-3">
                    <label className="text-sm font-medium text-gray-700">Description</label>
                    <textarea value={slide.text} onChange={(e) => updateSlide(i, 'text', e.target.value)} className="w-full border rounded px-3 py-1.5 text-sm mt-1" rows={2} placeholder="Description text" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Colors & Button Text */}
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-semibold mb-3">Colors & Buttons</h3>
            <div className="space-y-3">
              <ColorField label="Background" value={formState.backgroundColor} onChange={(v) => updateField('backgroundColor', v)} />
              <ColorField label="Heading Color" value={formState.headingColor} onChange={(v) => updateField('headingColor', v)} />
              <ColorField label="Text Color" value={formState.textColor} onChange={(v) => updateField('textColor', v)} />
              <ColorField label="Button Color" value={formState.buttonColor} onChange={(v) => updateField('buttonColor', v)} />
              <ColorField label="Button Text" value={formState.buttonTextColor} onChange={(v) => updateField('buttonTextColor', v)} />
              <ColorField label="Dot Color" value={formState.dotColor} onChange={(v) => updateField('dotColor', v)} />
              <ColorField label="Dot Active" value={formState.dotActiveColor} onChange={(v) => updateField('dotActiveColor', v)} />
              {(formState.style === 'gradient' || formState.style === 'bottomCard') && (
                <>
                  <ColorField label="Gradient From" value={formState.gradientFrom} onChange={(v) => updateField('gradientFrom', v)} />
                  <ColorField label="Gradient To" value={formState.gradientTo} onChange={(v) => updateField('gradientTo', v)} />
                </>
              )}
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 w-32">Skip Button</label>
                <input type="text" value={formState.skipButtonText} onChange={(e) => updateField('skipButtonText', e.target.value)} className="border rounded px-2 py-1 text-sm flex-1" />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 w-32">Next Button</label>
                <input type="text" value={formState.nextButtonText} onChange={(e) => updateField('nextButtonText', e.target.value)} className="border rounded px-2 py-1 text-sm flex-1" />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 w-32">Finish Button</label>
                <input type="text" value={formState.finishButtonText} onChange={(e) => updateField('finishButtonText', e.target.value)} className="border rounded px-2 py-1 text-sm flex-1" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formState.showDots} onChange={(e) => updateField('showDots', e.target.checked)} className="w-4 h-4 accent-primary" />
                <span className="text-sm font-medium text-gray-700">Show page dots</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right: Phone Preview */}
        <div className="w-[300px] flex-shrink-0 sticky top-6 self-start">
          <div className="flex items-center gap-2 mb-4">
            <IoEyeOutline size={18} />
            <h3 className="font-semibold">Live Preview</h3>
          </div>
          <PhonePreview config={formState} slides={formState.slides} currentSlide={previewSlide} />
          <div className="flex justify-center gap-2 mt-3">
            <button disabled={previewSlide === 0} onClick={() => setPreviewSlide((p) => p - 1)} className="px-3 py-1 text-xs border rounded disabled:opacity-30">← Prev</button>
            <button disabled={previewSlide >= formState.slides.length - 1} onClick={() => setPreviewSlide((p) => p + 1)} className="px-3 py-1 text-xs border rounded disabled:opacity-30">Next →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
