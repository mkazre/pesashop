import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { mediaAPI } from '@/services/api';
import toast from '@/utils/toast';
import {
  IoClose, IoCloudUpload, IoSearch, IoGrid, IoList,
  IoImage, IoTrash, IoCheckmarkCircle, IoFolderOpen,
  IoChevronBack, IoChevronForward, IoInformationCircle
} from 'react-icons/io5';

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

function getFullUrl(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${BACKEND_URL}${url}`;
}

const MediaLibraryModal = ({ isOpen, onClose, onSelect, multiple = false, selectedUrls = [] }) => {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('library'); // 'library' | 'upload' | 'url'
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [folder, setFolder] = useState('all');
  const [mimeFilter, setMimeFilter] = useState('image');
  const [selected, setSelected] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [detailItem, setDetailItem] = useState(null);
  const [urlInput, setUrlInput] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch media
  const { data: mediaData, isLoading } = useQuery(
    ['media', page, search, folder, mimeFilter],
    () => mediaAPI.getAll({ page, limit: 40, search: search || undefined, folder: folder !== 'all' ? folder : undefined, mimeType: mimeFilter || undefined }),
    { enabled: isOpen, keepPreviousData: true }
  );

  // Fetch folders
  const { data: foldersData } = useQuery(
    ['media-folders'],
    () => mediaAPI.getFolders(),
    { enabled: isOpen }
  );

  const media = mediaData?.data?.data || [];
  const pagination = mediaData?.data?.pagination || { total: 0, pages: 1, page: 1 };
  const folders = foldersData?.data?.data || [];

  // Upload mutation
  const uploadMutation = useMutation(
    (files) => {
      if (files.length === 1) {
        return mediaAPI.upload(files[0], { folder: folder !== 'all' ? folder : 'general' });
      }
      return mediaAPI.uploadMultiple(Array.from(files), folder !== 'all' ? folder : 'general');
    },
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries('media');
        queryClient.invalidateQueries('media-folders');
        toast.success('Upload successful');
        setTab('library');
      },
      onError: (err) => toast.error(err.response?.data?.message || 'Upload failed')
    }
  );

  // Delete mutation
  const deleteMutation = useMutation(
    (id) => mediaAPI.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('media');
        setDetailItem(null);
        setSelected(prev => prev.filter(s => s._id !== detailItem?._id));
        toast.success('Deleted');
      }
    }
  );

  // Update mutation
  const updateMutation = useMutation(
    ({ id, data }) => mediaAPI.update(id, data),
    {
      onSuccess: (res) => {
        queryClient.invalidateQueries('media');
        setDetailItem(res.data.data);
        toast.success('Updated');
      }
    }
  );

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) uploadMutation.mutate(Array.from(files));
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) uploadMutation.mutate(Array.from(files));
  }, [uploadMutation]);

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);

  const toggleSelect = (item) => {
    if (multiple) {
      setSelected(prev => {
        const exists = prev.find(s => s._id === item._id);
        if (exists) return prev.filter(s => s._id !== item._id);
        return [...prev, item];
      });
    } else {
      setSelected([item]);
    }
  };

  const isSelected = (item) => selected.some(s => s._id === item._id);

  const handleInsert = () => {
    if (tab === 'url' && urlInput) {
      onSelect(multiple ? [urlInput] : urlInput);
      onClose();
      return;
    }
    if (selected.length === 0) { toast.error('Please select an image'); return; }
    const urls = selected.map(s => getFullUrl(s.url));
    onSelect(multiple ? urls : urls[0]);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) { setSelected([]); setDetailItem(null); setSearch(''); setPage(1); setTab('library'); }
  }, [isOpen]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-[95vw] max-w-[1200px] h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-bold">Media Library</h2>
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 rounded-lg p-1">
              {['library', 'upload', 'url'].map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === t ? 'bg-white shadow text-indigo-600' : 'text-gray-600 hover:text-gray-900'}`}>
                  {t === 'library' ? 'Media Library' : t === 'upload' ? 'Upload Files' : 'From URL'}
                </button>
              ))}
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><IoClose size={20} /></button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden">
          {tab === 'library' && (
            <>
              {/* Sidebar */}
              <div className="w-48 border-r bg-gray-50 p-3 overflow-y-auto flex-shrink-0">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Filter</p>
                <select value={mimeFilter} onChange={e => { setMimeFilter(e.target.value); setPage(1); }}
                  className="w-full text-sm border rounded-md px-2 py-1.5 mb-3">
                  <option value="">All Types</option>
                  <option value="image">Images</option>
                  <option value="video">Videos</option>
                  <option value="document">Documents</option>
                </select>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Folders</p>
                <button onClick={() => { setFolder('all'); setPage(1); }}
                  className={`w-full text-left text-sm px-2 py-1.5 rounded-md mb-1 ${folder === 'all' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'hover:bg-gray-100'}`}>
                  <IoFolderOpen className="inline mr-1" size={14} /> All
                </button>
                {folders.map(f => (
                  <button key={f.name} onClick={() => { setFolder(f.name); setPage(1); }}
                    className={`w-full text-left text-sm px-2 py-1.5 rounded-md mb-1 flex justify-between ${folder === f.name ? 'bg-indigo-100 text-indigo-700 font-medium' : 'hover:bg-gray-100'}`}>
                    <span><IoFolderOpen className="inline mr-1" size={14} />{f.name}</span>
                    <span className="text-xs text-gray-400">{f.count}</span>
                  </button>
                ))}
              </div>

              {/* Grid */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Search bar */}
                <div className="flex items-center gap-3 px-4 py-3 border-b">
                  <div className="relative flex-1">
                    <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input type="text" placeholder="Search media..." value={search}
                      onChange={e => { setSearch(e.target.value); setPage(1); }}
                      className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm" />
                  </div>
                  <div className="flex bg-gray-100 rounded-lg p-0.5">
                    <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow' : ''}`}><IoGrid size={16} /></button>
                    <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow' : ''}`}><IoList size={16} /></button>
                  </div>
                  <span className="text-xs text-gray-500">{pagination.total} items</span>
                </div>

                {/* Media grid */}
                <div className="flex-1 overflow-y-auto p-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full text-gray-400">Loading...</div>
                  ) : media.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <IoImage size={48} className="mb-2 opacity-50" />
                      <p>No media found</p>
                      <button onClick={() => setTab('upload')} className="mt-2 text-indigo-600 text-sm hover:underline">Upload files</button>
                    </div>
                  ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-5 gap-3">
                      {media.map(item => (
                        <div key={item._id}
                          onClick={() => toggleSelect(item)}
                          onDoubleClick={() => setDetailItem(item)}
                          className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all aspect-square ${isSelected(item) ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-transparent hover:border-gray-300'}`}>
                          {item.mimeType?.startsWith('image/') ? (
                            <img src={getFullUrl(item.thumbnailUrl || item.url)} alt={item.alt || item.title}
                              className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                              <IoImage size={32} className="text-gray-400" />
                            </div>
                          )}
                          {isSelected(item) && (
                            <div className="absolute top-2 right-2 bg-indigo-500 text-white rounded-full p-0.5">
                              <IoCheckmarkCircle size={20} />
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-white text-xs truncate">{item.title || item.originalName}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {media.map(item => (
                        <div key={item._id}
                          onClick={() => toggleSelect(item)}
                          onDoubleClick={() => setDetailItem(item)}
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer ${isSelected(item) ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-gray-50'}`}>
                          <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
                            {item.mimeType?.startsWith('image/') ? (
                              <img src={getFullUrl(item.thumbnailUrl || item.url)} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-100"><IoImage size={20} className="text-gray-400" /></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.title || item.originalName}</p>
                            <p className="text-xs text-gray-400">{item.mimeType} &middot; {(item.size / 1024).toFixed(1)} KB</p>
                          </div>
                          {isSelected(item) && <IoCheckmarkCircle size={20} className="text-indigo-500" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex items-center justify-center gap-2 px-4 py-3 border-t">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"><IoChevronBack size={16} /></button>
                    <span className="text-sm text-gray-600">Page {page} of {pagination.pages}</span>
                    <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
                      className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"><IoChevronForward size={16} /></button>
                  </div>
                )}
              </div>

              {/* Detail sidebar */}
              {detailItem && (
                <div className="w-72 border-l bg-gray-50 p-4 overflow-y-auto flex-shrink-0">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm">Details</h3>
                    <button onClick={() => setDetailItem(null)} className="p-1 hover:bg-gray-200 rounded"><IoClose size={16} /></button>
                  </div>
                  <div className="rounded-lg overflow-hidden mb-3 bg-white border">
                    {detailItem.mimeType?.startsWith('image/') ? (
                      <img src={getFullUrl(detailItem.url)} alt={detailItem.alt} className="w-full" />
                    ) : (
                      <div className="w-full h-32 flex items-center justify-center"><IoImage size={40} className="text-gray-300" /></div>
                    )}
                  </div>
                  <div className="space-y-3 text-sm">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
                      <input type="text" value={detailItem.title || ''} onChange={e => setDetailItem(prev => ({ ...prev, title: e.target.value }))}
                        onBlur={() => updateMutation.mutate({ id: detailItem._id, data: { title: detailItem.title } })}
                        className="w-full border rounded px-2 py-1.5 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Alt Text</label>
                      <input type="text" value={detailItem.alt || ''} onChange={e => setDetailItem(prev => ({ ...prev, alt: e.target.value }))}
                        onBlur={() => updateMutation.mutate({ id: detailItem._id, data: { alt: detailItem.alt } })}
                        className="w-full border rounded px-2 py-1.5 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Caption</label>
                      <textarea value={detailItem.caption || ''} onChange={e => setDetailItem(prev => ({ ...prev, caption: e.target.value }))}
                        onBlur={() => updateMutation.mutate({ id: detailItem._id, data: { caption: detailItem.caption } })}
                        className="w-full border rounded px-2 py-1.5 text-sm" rows={2} />
                    </div>
                    <div className="text-xs text-gray-400 space-y-1">
                      <p><strong>File:</strong> {detailItem.originalName}</p>
                      <p><strong>Type:</strong> {detailItem.mimeType}</p>
                      <p><strong>Size:</strong> {(detailItem.size / 1024).toFixed(1)} KB</p>
                      {detailItem.width && <p><strong>Dimensions:</strong> {detailItem.width} x {detailItem.height}</p>}
                      <p><strong>URL:</strong></p>
                      <input type="text" readOnly value={getFullUrl(detailItem.url)} className="w-full border rounded px-2 py-1 text-xs bg-gray-100" onClick={e => e.target.select()} />
                    </div>
                    <button onClick={() => { if (confirm('Delete this file?')) deleteMutation.mutate(detailItem._id); }}
                      className="w-full flex items-center justify-center gap-1 text-red-600 hover:bg-red-50 rounded-lg py-2 text-sm">
                      <IoTrash size={16} /> Delete
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {tab === 'upload' && (
            <div className="flex-1 flex items-center justify-center p-8">
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full max-w-lg border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors ${dragOver ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'}`}>
                <IoCloudUpload size={48} className={`mx-auto mb-4 ${dragOver ? 'text-indigo-500' : 'text-gray-400'}`} />
                <p className="text-lg font-medium mb-1">{dragOver ? 'Drop files here' : 'Drag & drop files here'}</p>
                <p className="text-sm text-gray-500 mb-4">or click to browse from your computer</p>
                <p className="text-xs text-gray-400">Supports: JPG, PNG, GIF, WebP, SVG, MP4, PDF &middot; Max 50MB per file</p>
                <input ref={fileInputRef} type="file" multiple accept="image/*,video/*,.pdf,.doc,.docx"
                  onChange={handleFileSelect} className="hidden" />
                {uploadMutation.isLoading && (
                  <div className="mt-4">
                    <div className="w-48 mx-auto bg-gray-200 rounded-full h-2">
                      <div className="bg-indigo-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
                    </div>
                    <p className="text-sm text-indigo-600 mt-2">Uploading...</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'url' && (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="w-full max-w-lg space-y-4">
                <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                  <IoInformationCircle size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-700">Enter an image URL to use directly without uploading to the media library.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Image URL</label>
                  <input type="url" value={urlInput} onChange={e => setUrlInput(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full border-2 rounded-lg px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none" />
                </div>
                {urlInput && (
                  <div className="border rounded-lg overflow-hidden">
                    <img src={urlInput} alt="Preview" className="max-h-64 mx-auto"
                      onError={e => { e.target.style.display = 'none'; }} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
          <div className="text-sm text-gray-500">
            {tab === 'library' && selected.length > 0 && `${selected.length} item${selected.length > 1 ? 's' : ''} selected`}
            {tab === 'url' && urlInput && 'URL ready to insert'}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg">Cancel</button>
            <button onClick={handleInsert}
              disabled={(tab === 'library' && selected.length === 0) || (tab === 'url' && !urlInput)}
              className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed">
              {tab === 'url' ? 'Use URL' : `Insert ${selected.length > 0 ? `(${selected.length})` : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default MediaLibraryModal;
