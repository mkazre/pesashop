import React, { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { mediaAPI } from '@/services/api';
import toast from '@/utils/toast';
import { IoCloudUpload, IoSearch, IoGrid, IoList, IoImage, IoTrash, IoCheckmarkCircle, IoFolderOpen, IoChevronBack, IoChevronForward, IoClose } from 'react-icons/io5';

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
const getFullUrl = (url) => (!url ? '' : url.startsWith('http') ? url : `${BACKEND_URL}${url}`);

const MediaLibraryPage = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [folder, setFolder] = useState('all');
  const [mimeFilter, setMimeFilter] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [selected, setSelected] = useState([]);
  const [detail, setDetail] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const { data: mediaData, isLoading } = useQuery(
    ['media', page, search, folder, mimeFilter],
    () => mediaAPI.getAll({ page, limit: 40, search: search || undefined, folder: folder !== 'all' ? folder : undefined, mimeType: mimeFilter || undefined }),
    { keepPreviousData: true }
  );
  const { data: foldersData } = useQuery(['media-folders'], () => mediaAPI.getFolders());

  const media = mediaData?.data?.data || [];
  const pg = mediaData?.data?.pagination || { total: 0, pages: 1 };
  const folders = foldersData?.data?.data || [];

  const uploadMut = useMutation(
    (files) => files.length === 1 ? mediaAPI.upload(files[0], { folder: folder !== 'all' ? folder : 'general' }) : mediaAPI.uploadMultiple(Array.from(files), folder !== 'all' ? folder : 'general'),
    { onSuccess: () => { qc.invalidateQueries('media'); qc.invalidateQueries('media-folders'); toast.success('Uploaded'); }, onError: (e) => toast.error(e.response?.data?.message || 'Upload failed') }
  );
  const deleteMut = useMutation((id) => mediaAPI.delete(id), { onSuccess: () => { qc.invalidateQueries('media'); setDetail(null); toast.success('Deleted'); } });
  const bulkDeleteMut = useMutation((ids) => mediaAPI.bulkDelete(ids), { onSuccess: () => { qc.invalidateQueries('media'); setSelected([]); toast.success('Deleted'); } });
  const updateMut = useMutation(({ id, data }) => mediaAPI.update(id, data), { onSuccess: (r) => { qc.invalidateQueries('media'); setDetail(r.data.data); toast.success('Updated'); } });

  const handleDrop = useCallback((e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files?.length) uploadMut.mutate(Array.from(e.dataTransfer.files)); }, [uploadMut]);
  const toggleSelect = (item) => setSelected(prev => prev.find(s => s._id === item._id) ? prev.filter(s => s._id !== item._id) : [...prev, item]);
  const isSelected = (item) => selected.some(s => s._id === item._id);

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <h1 className="text-2xl font-bold">Media Library</h1>
        <div className="flex items-center gap-3">
          {selected.length > 0 && (
            <button onClick={() => { if (confirm(`Delete ${selected.length} items?`)) bulkDeleteMut.mutate(selected.map(s => s._id)); }}
              className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100">
              <IoTrash size={16} /> Delete ({selected.length})
            </button>
          )}
          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
            <IoCloudUpload size={16} /> Upload
          </button>
          <input ref={fileRef} type="file" multiple accept="image/*,video/*,.pdf" onChange={(e) => { if (e.target.files?.length) uploadMut.mutate(Array.from(e.target.files)); }} className="hidden" />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-48 border-r bg-gray-50 p-3 overflow-y-auto flex-shrink-0">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Type</p>
          <select value={mimeFilter} onChange={e => { setMimeFilter(e.target.value); setPage(1); }} className="w-full text-sm border rounded-md px-2 py-1.5 mb-3">
            <option value="">All</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="document">Documents</option>
          </select>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Folders</p>
          <button onClick={() => { setFolder('all'); setPage(1); }} className={`w-full text-left text-sm px-2 py-1.5 rounded-md mb-1 ${folder === 'all' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'hover:bg-gray-100'}`}>
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

        {/* Main */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b">
            <div className="relative flex-1">
              <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input type="text" placeholder="Search..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm" />
            </div>
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow' : ''}`}><IoGrid size={16} /></button>
              <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow' : ''}`}><IoList size={16} /></button>
            </div>
            <span className="text-xs text-gray-500">{pg.total} items</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4" onDrop={handleDrop} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}>
            {dragOver && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-indigo-50/80 border-2 border-dashed border-indigo-400 rounded-lg">
                <div className="text-center"><IoCloudUpload size={48} className="mx-auto text-indigo-500 mb-2" /><p className="text-indigo-600 font-medium">Drop files to upload</p></div>
              </div>
            )}
            {isLoading ? (
              <div className="flex items-center justify-center h-full text-gray-400">Loading...</div>
            ) : media.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <IoImage size={48} className="mb-2 opacity-50" /><p>No media found</p>
                <button onClick={() => fileRef.current?.click()} className="mt-2 text-indigo-600 text-sm hover:underline">Upload files</button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {media.map(item => (
                  <div key={item._id} onClick={() => toggleSelect(item)} onDoubleClick={() => setDetail(item)}
                    className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all aspect-square ${isSelected(item) ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-transparent hover:border-gray-300'}`}>
                    {item.mimeType?.startsWith('image/') ? (
                      <img src={getFullUrl(item.thumbnailUrl || item.url)} alt={item.alt || item.title} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100"><IoImage size={32} className="text-gray-400" /></div>
                    )}
                    {isSelected(item) && <div className="absolute top-2 right-2 bg-indigo-500 text-white rounded-full p-0.5"><IoCheckmarkCircle size={20} /></div>}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-xs truncate">{item.title || item.originalName}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {media.map(item => (
                  <div key={item._id} onClick={() => toggleSelect(item)} onDoubleClick={() => setDetail(item)}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer ${isSelected(item) ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-gray-50'}`}>
                    <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
                      {item.mimeType?.startsWith('image/') ? <img src={getFullUrl(item.thumbnailUrl || item.url)} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-gray-100"><IoImage size={20} className="text-gray-400" /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.title || item.originalName}</p>
                      <p className="text-xs text-gray-400">{item.mimeType} · {(item.size / 1024).toFixed(1)} KB</p>
                    </div>
                    {isSelected(item) && <IoCheckmarkCircle size={20} className="text-indigo-500" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {pg.pages > 1 && (
            <div className="flex items-center justify-center gap-2 px-4 py-3 border-t">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"><IoChevronBack size={16} /></button>
              <span className="text-sm text-gray-600">Page {page} of {pg.pages}</span>
              <button onClick={() => setPage(p => Math.min(pg.pages, p + 1))} disabled={page === pg.pages} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"><IoChevronForward size={16} /></button>
            </div>
          )}
        </div>

        {/* Detail sidebar */}
        {detail && (
          <div className="w-72 border-l bg-gray-50 p-4 overflow-y-auto flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Details</h3>
              <button onClick={() => setDetail(null)} className="p-1 hover:bg-gray-200 rounded"><IoClose size={16} /></button>
            </div>
            <div className="rounded-lg overflow-hidden mb-3 bg-white border">
              {detail.mimeType?.startsWith('image/') ? <img src={getFullUrl(detail.url)} alt={detail.alt} className="w-full" /> : <div className="w-full h-32 flex items-center justify-center"><IoImage size={40} className="text-gray-300" /></div>}
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
                <input type="text" value={detail.title || ''} onChange={e => setDetail(p => ({ ...p, title: e.target.value }))}
                  onBlur={() => updateMut.mutate({ id: detail._id, data: { title: detail.title } })} className="w-full border rounded px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Alt Text</label>
                <input type="text" value={detail.alt || ''} onChange={e => setDetail(p => ({ ...p, alt: e.target.value }))}
                  onBlur={() => updateMut.mutate({ id: detail._id, data: { alt: detail.alt } })} className="w-full border rounded px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Caption</label>
                <textarea value={detail.caption || ''} onChange={e => setDetail(p => ({ ...p, caption: e.target.value }))}
                  onBlur={() => updateMut.mutate({ id: detail._id, data: { caption: detail.caption } })} className="w-full border rounded px-2 py-1.5 text-sm" rows={2} />
              </div>
              <div className="text-xs text-gray-400 space-y-1">
                <p><strong>File:</strong> {detail.originalName}</p>
                <p><strong>Type:</strong> {detail.mimeType}</p>
                <p><strong>Size:</strong> {(detail.size / 1024).toFixed(1)} KB</p>
                {detail.width && <p><strong>Dimensions:</strong> {detail.width} x {detail.height}</p>}
                <p><strong>URL:</strong></p>
                <input type="text" readOnly value={getFullUrl(detail.url)} className="w-full border rounded px-2 py-1 text-xs bg-gray-100" onClick={e => e.target.select()} />
              </div>
              <button onClick={() => { if (confirm('Delete this file?')) deleteMut.mutate(detail._id); }}
                className="w-full flex items-center justify-center gap-1 text-red-600 hover:bg-red-50 rounded-lg py-2 text-sm">
                <IoTrash size={16} /> Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaLibraryPage;
