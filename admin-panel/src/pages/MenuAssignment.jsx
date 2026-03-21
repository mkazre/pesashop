import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { menusAPI, pageTemplatesAPI } from '@/services/api';
import Button from '@/components/common/Button';
import toast from '@/utils/toast';
import {
  Link, Save, Globe, ChevronDown, ChevronRight, Info, AlertCircle,
  Monitor, Smartphone, Layout, PanelLeft, Menu as MenuIcon, LayoutGrid,
} from 'lucide-react';

// All available location slots
const LOCATION_SLOTS = [
  { value: 'header', label: 'Header Primary', icon: Monitor, color: 'blue' },
  { value: 'header-secondary', label: 'Header Secondary', icon: Monitor, color: 'sky' },
  { value: 'footer', label: 'Footer Primary', icon: Layout, color: 'green' },
  { value: 'footer-secondary', label: 'Footer Secondary', icon: Layout, color: 'emerald' },
  { value: 'mobile-menu', label: 'Mobile Menu', icon: Smartphone, color: 'purple' },
  { value: 'sidebar', label: 'Sidebar', icon: PanelLeft, color: 'amber' },
];

const MenuAssignment = () => {
  const queryClient = useQueryClient();
  const [assignments, setAssignments] = useState({});
  const [expandedPages, setExpandedPages] = useState(new Set());
  const [filterLocation, setFilterLocation] = useState('all');
  const [hasChanges, setHasChanges] = useState(false);

  const { data: menusResponse } = useQuery('menus', () => menusAPI.getAll());
  const { data: pagesResponse } = useQuery('page-templates', () => pageTemplatesAPI.getAll());

  const menus = menusResponse?.data?.data || [];
  const pages = pagesResponse?.data?.data || [];

  // Separate global menus
  const globalMenus = useMemo(() => menus.filter(m => m.isGlobal), [menus]);
  const allMenuOptions = useMemo(() => menus.map(m => ({ value: m._id, label: `${m.name} (${m.location})` })), [menus]);

  // Build effective assignments: global defaults + page overrides
  const getEffectiveAssignment = (page, slot) => {
    // Check page-level override first
    const pageOverrides = assignments[page._id] || page.menuAssignments || {};
    if (pageOverrides[slot]) return { menuId: pageOverrides[slot], source: 'page' };
    // Fall back to global menu for this slot's base location
    const baseLocation = slot.split('-')[0]; // header-secondary -> header
    const globalMenu = globalMenus.find(m => m.location === baseLocation || m.location === slot);
    if (globalMenu) return { menuId: globalMenu._id, source: 'global' };
    return { menuId: '', source: 'none' };
  };

  const getMenuName = (menuId) => {
    if (!menuId) return '';
    const menu = menus.find(m => m._id === menuId);
    return menu ? menu.name : '';
  };

  const updateMutation = useMutation(
    ({ pageId, menuAssignments }) => pageTemplatesAPI.update(pageId, { menuAssignments }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('page-templates');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update assignments');
      },
    }
  );

  const handleAssign = (pageId, location, menuId) => {
    setAssignments(prev => ({
      ...prev,
      [pageId]: {
        ...(prev[pageId] || {}),
        [location]: menuId || undefined,
      },
    }));
    setHasChanges(true);
  };

  const handleSaveAll = async () => {
    const pageIds = Object.keys(assignments);
    if (pageIds.length === 0) {
      toast.success('No changes to save');
      return;
    }
    let successCount = 0;
    for (const pageId of pageIds) {
      const page = pages.find(p => p._id === pageId);
      const merged = { ...(page?.menuAssignments || {}), ...assignments[pageId] };
      // Remove empty values
      Object.keys(merged).forEach(k => { if (!merged[k]) delete merged[k]; });
      try {
        await updateMutation.mutateAsync({ pageId, menuAssignments: merged });
        successCount++;
      } catch (e) { /* error handled by mutation */ }
    }
    if (successCount > 0) {
      toast.success(`Updated assignments for ${successCount} page${successCount > 1 ? 's' : ''}`);
      setAssignments({});
      setHasChanges(false);
    }
  };

  const togglePage = (pageId) => {
    const n = new Set(expandedPages);
    n.has(pageId) ? n.delete(pageId) : n.add(pageId);
    setExpandedPages(n);
  };

  const visibleSlots = filterLocation === 'all'
    ? LOCATION_SLOTS
    : LOCATION_SLOTS.filter(s => s.value === filterLocation || s.value.startsWith(filterLocation));

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu Assignment</h1>
          <p className="text-gray-600 mt-1">Assign menus to pages and template locations. Global menus apply everywhere unless overridden.</p>
        </div>
        <Button onClick={handleSaveAll} loading={updateMutation.isLoading} disabled={!hasChanges}>
          <Save size={18} className="mr-2" />
          Save All Changes
          {hasChanges && <span className="ml-2 w-2 h-2 bg-orange-400 rounded-full inline-block" />}
        </Button>
      </div>

      {/* Global Menus Info */}
      {globalMenus.length > 0 && (
        <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
          <h3 className="text-sm font-semibold text-indigo-900 flex items-center gap-2 mb-2">
            <Globe size={16} /> Global Menus (applied to all pages by default)
          </h3>
          <div className="flex flex-wrap gap-2">
            {globalMenus.map(m => (
              <span key={m._id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-indigo-200 rounded-full text-sm">
                <MenuIcon size={12} className="text-indigo-500" />
                <span className="font-medium text-indigo-800">{m.name}</span>
                <span className="text-indigo-400">→</span>
                <span className="text-indigo-600 text-xs">{m.location}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-sm text-gray-600">Filter by location:</span>
        <div className="flex gap-1">
          {[{ value: 'all', label: 'All' }, { value: 'header', label: 'Header' }, { value: 'footer', label: 'Footer' },
            { value: 'mobile-menu', label: 'Mobile' }, { value: 'sidebar', label: 'Sidebar' }].map(f => (
            <button key={f.value} onClick={() => setFilterLocation(f.value)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                filterLocation === f.value ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Assignment Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 min-w-[200px]">
                  Page
                </th>
                {visibleSlots.map((slot) => (
                  <th key={slot.value} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[180px]">
                    <span className="flex items-center gap-1.5">
                      <slot.icon size={12} /> {slot.label}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pages.length === 0 ? (
                <tr>
                  <td colSpan={visibleSlots.length + 1} className="px-6 py-12 text-center text-gray-400">
                    <AlertCircle size={24} className="mx-auto mb-2 opacity-50" />
                    No pages found. Create pages first.
                  </td>
                </tr>
              ) : (
                pages.map((page) => {
                  const isExpanded = expandedPages.has(page._id);
                  const pageHasOverrides = Object.keys(assignments[page._id] || page.menuAssignments || {}).length > 0;

                  return (
                    <tr key={page._id} className="hover:bg-gray-50 group">
                      <td className="px-4 py-3 whitespace-nowrap sticky left-0 bg-white group-hover:bg-gray-50 z-10">
                        <div className="flex items-center gap-2">
                          <button onClick={() => togglePage(page._id)} className="p-0.5 hover:bg-gray-200 rounded">
                            {isExpanded ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
                          </button>
                          <Link size={14} className="text-gray-400" />
                          <div>
                            <span className="text-sm font-medium text-gray-900">{page.name}</span>
                            <span className="ml-2 text-[10px] text-gray-400">/{page.slug}</span>
                          </div>
                          {pageHasOverrides && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded">override</span>
                          )}
                          {page.isHomepage && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded">home</span>
                          )}
                        </div>
                      </td>
                      {visibleSlots.map((slot) => {
                        const effective = getEffectiveAssignment(page, slot.value);
                        const pageOverrides = assignments[page._id] || page.menuAssignments || {};
                        const currentValue = pageOverrides[slot.value] || '';

                        return (
                          <td key={slot.value} className="px-3 py-3 whitespace-nowrap">
                            {isExpanded ? (
                              <div className="space-y-1">
                                <select
                                  value={currentValue}
                                  onChange={(e) => handleAssign(page._id, slot.value, e.target.value)}
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                  <option value="">
                                    {effective.source === 'global' ? `↳ Global: ${getMenuName(effective.menuId)}` : '— None —'}
                                  </option>
                                  {menus.map(m => (
                                    <option key={m._id} value={m._id}>
                                      {m.name} ({m.location}){m.isGlobal ? ' ★' : ''}
                                    </option>
                                  ))}
                                </select>
                                {effective.source === 'global' && currentValue && (
                                  <button onClick={() => handleAssign(page._id, slot.value, '')}
                                    className="text-[10px] text-red-500 hover:text-red-700">
                                    Remove override
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                {effective.menuId ? (
                                  <>
                                    <span className={`text-sm ${effective.source === 'global' ? 'text-indigo-600' : 'text-gray-800 font-medium'}`}>
                                      {getMenuName(effective.menuId)}
                                    </span>
                                    {effective.source === 'global' && (
                                      <Globe size={10} className="text-indigo-400" title="From global menu" />
                                    )}
                                  </>
                                ) : (
                                  <span className="text-xs text-gray-300">—</span>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1"><Globe size={10} className="text-indigo-400" /> = Inherited from global menu</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-orange-400 rounded-full" /> = Has page-level override</span>
        <span>Click the arrow next to a page name to expand and edit assignments</span>
      </div>
    </div>
  );
};

export default MenuAssignment;
