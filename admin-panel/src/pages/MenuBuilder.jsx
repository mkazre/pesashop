import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { menusAPI, pageTemplatesAPI, categoriesAPI } from '@/services/api';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import Modal from '@/components/common/Modal';
import toast from '@/utils/toast';
import {
  Plus,
  Edit,
  Trash2,
  Copy,
  Menu as MenuIcon,
  ChevronRight,
  ChevronDown,
  GripVertical,
  Link as LinkIcon,
  Tag,
  ExternalLink,
  X,
  Globe,
  Eye,
  EyeOff,
  Smartphone,
  Tablet,
  Monitor,
  Settings,
  Palette,
  Type,
  MousePointer,
  Image,
  Layout,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronUp,
  Minus,
  LayoutGrid,
  Columns,
  PanelLeft,
  PanelRight,
  Maximize2,
  Search,
  ArrowRight,
} from 'lucide-react';
import MegaMenuDesigner from '@/components/menu/MegaMenuDesigner';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const MENU_LOCATIONS = [
  { value: 'header', label: 'Header Primary' },
  { value: 'header-secondary', label: 'Header Secondary' },
  { value: 'footer', label: 'Footer Primary' },
  { value: 'footer-secondary', label: 'Footer Secondary' },
  { value: 'mobile-menu', label: 'Mobile Menu' },
  { value: 'sidebar', label: 'Sidebar' },
  { value: 'mobile', label: 'Mobile (Legacy)' },
  { value: 'custom', label: 'Custom' },
];

const MenuBuilder = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);

  const { data: menusResponse, isLoading } = useQuery(
    'menus',
    () => menusAPI.getAll()
  );

  const menus = menusResponse?.data?.data || [];

  const deleteMutation = useMutation(
    (id) => menusAPI.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('menus');
        toast.success('Menu deleted successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to delete menu');
      },
    }
  );

  const duplicateMutation = useMutation(
    (id) => menusAPI.duplicate(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('menus');
        toast.success('Menu duplicated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to duplicate menu');
      },
    }
  );

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (menu) => {
    setEditingMenu(menu);
  };

  const handleDuplicate = (id) => {
    duplicateMutation.mutate(id);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu Builder</h1>
          <p className="text-gray-600 mt-1">Create and manage navigation menus</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/menu-assignment')}
          >
            <LinkIcon size={20} className="mr-2" />
            Assign Menus
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus size={20} className="mr-2" />
            Create New Menu
          </Button>
        </div>
      </div>

      {/* Menus List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Items
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : menus.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No menus found. Create your first menu!
                </td>
              </tr>
            ) : (
              menus.map((menu) => (
                <tr key={menu._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <MenuIcon size={16} className="text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">{menu.name}</span>
                      {menu.isGlobal && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs font-medium rounded bg-indigo-100 text-indigo-800 flex items-center gap-1">
                          <Globe size={10} /> Global
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                      {MENU_LOCATIONS.find(l => l.value === menu.location)?.label || menu.location}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {menu.items?.length || 0} items
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      menu.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {menu.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(menu)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDuplicate(menu._id)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Duplicate"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(menu._id, menu.name)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Menu Modal */}
      {showCreateModal && (
        <CreateMenuModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries('menus');
          }}
        />
      )}

      {/* Edit Menu Modal */}
      {editingMenu && (
        <EditMenuModal
          menu={editingMenu}
          onClose={() => setEditingMenu(null)}
          onSuccess={() => {
            setEditingMenu(null);
            queryClient.invalidateQueries('menus');
          }}
        />
      )}
    </div>
  );
};


// Create Menu Modal
const CreateMenuModal = ({ onClose, onSuccess }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    location: 'header',
    isGlobal: false,
  });

  const createMutation = useMutation(
    (data) => menusAPI.create(data),
    {
      onSuccess: (response) => {
        toast.success('Menu created successfully');
        queryClient.invalidateQueries('menus');
        onSuccess();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to create menu');
      },
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      items: [],
      settings: {},
    });
  };

  return (
    <Modal isOpen onClose={onClose} title="Create New Menu" showFooter={false}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Menu Name</label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Main Navigation"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
          <Select
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            options={MENU_LOCATIONS}
          />
        </div>

        <label className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.isGlobal}
            onChange={(e) => setFormData({ ...formData, isGlobal: e.target.checked })}
            className="rounded text-indigo-600"
          />
          <div>
            <span className="text-sm font-medium text-indigo-900 flex items-center gap-1">
              <Globe size={14} /> Global Menu
            </span>
            <span className="text-xs text-indigo-600">Applies to all pages unless overridden per-page</span>
          </div>
        </label>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={createMutation.isLoading}>Create Menu</Button>
        </div>
      </form>
    </Modal>
  );
};

// ── Collapsible Section Helper ────────────────────────────────────────
const CollapsibleSection = ({ title, icon: Icon, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          {Icon && <Icon size={14} />} {title}
        </span>
        {open ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
      </button>
      {open && <div className="p-3 space-y-3">{children}</div>}
    </div>
  );
};

// ── Small Label + Input helpers ──────────────────────────────────────
const LabeledInput = ({ label, ...props }) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
    <input {...props} className={`w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${props.className || ''}`} />
  </div>
);
const LabeledSelect = ({ label, options, ...props }) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
    <select {...props} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);
const LabeledColor = ({ label, value, onChange }) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
    <div className="flex items-center gap-2">
      <input type="color" value={value || '#000000'} onChange={onChange} className="w-8 h-8 border border-gray-300 rounded cursor-pointer" />
      <input type="text" value={value || ''} onChange={onChange} className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs font-mono" placeholder="#000000" />
    </div>
  </div>
);
const LabeledCheck = ({ label, checked, onChange, description }) => (
  <label className="flex items-start gap-2 cursor-pointer">
    <input type="checkbox" checked={checked || false} onChange={onChange} className="rounded mt-0.5" />
    <div>
      <span className="text-sm text-gray-700">{label}</span>
      {description && <span className="block text-xs text-gray-500">{description}</span>}
    </div>
  </label>
);

// ── Edit Menu Modal ──────────────────────────────────────────────────
const EditMenuModal = ({ menu, onClose, onSuccess }) => {
  const [menuData, setMenuData] = useState(menu);
  const [selectedItem, setSelectedItem] = useState(null);
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [showMegaMenuDesigner, setShowMegaMenuDesigner] = useState(false);
  const [megaMenuItem, setMegaMenuItem] = useState(null);
  const [activeTab, setActiveTab] = useState('items'); // items | settings | responsive | footer

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const updateMutation = useMutation(
    (data) => menusAPI.update(menu._id, data),
    {
      onSuccess: () => { toast.success('Menu updated successfully'); onSuccess(); },
      onError: (error) => { toast.error(error.response?.data?.error || 'Failed to update menu'); },
    }
  );

  // ── Helper: deep-get/set settings ──────────────────────────────────
  const getSettings = (path, fallback = '') => {
    const s = menuData.settings || {};
    return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : fallback), s);
  };
  const setSettings = (path, value) => {
    const s = JSON.parse(JSON.stringify(menuData.settings || {}));
    const keys = path.split('.');
    let obj = s;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]] || typeof obj[keys[i]] !== 'object') obj[keys[i]] = {};
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    setMenuData({ ...menuData, settings: s });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const items = [...menuData.items];
    const oldIndex = items.findIndex(item => item._id === active.id);
    const newIndex = items.findIndex(item => item._id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      setMenuData({ ...menuData, items: arrayMove(items, oldIndex, newIndex) });
    }
  };

  const cleanMenuItems = (items) => {
    return items.map(item => {
      const c = { ...item };
      if (c._id && !c._id.match(/^[0-9a-fA-F]{24}$/)) delete c._id;
      if (c.children?.length > 0) c.children = cleanMenuItems(c.children);
      return c;
    });
  };

  const handleSave = () => {
    updateMutation.mutate({ ...menuData, items: cleanMenuItems(menuData.items) });
  };

  const openMegaMenuDesigner = (item) => { setMegaMenuItem(item); setShowMegaMenuDesigner(true); };

  const updateMegaMenuContent = (itemId, content) => {
    const updateItem = (items) => items.map(item => {
      if (item._id === itemId) return { ...item, megaMenu: { ...item.megaMenu, content } };
      if (item.children?.length > 0) return { ...item, children: updateItem(item.children) };
      return item;
    });
    setMenuData({ ...menuData, items: updateItem(menuData.items) });
  };

  const addMenuItem = () => {
    setMenuData({
      ...menuData,
      items: [...menuData.items, {
        _id: `item-${Date.now()}`, label: 'New Item', link: '#', linkType: 'manual',
        description: '', icon: '', iconPosition: 'left', image: '', badge: '', badgeColor: '#ef4444', badgeBgColor: '#fef2f2',
        openInNewTab: false, noFollow: false, children: [], order: menuData.items.length,
        visibility: { showOnDesktop: true, showOnTablet: true, showOnMobile: true, showLoggedIn: true, showLoggedOut: true },
        itemStyle: {}, megaMenu: { enabled: false, width: 'container', columns: 4, content: {} },
      }],
    });
  };

  const deleteMenuItem = (itemId) => {
    const del = (items) => items.filter(item => {
      if (item._id === itemId) return false;
      if (item.children?.length > 0) item.children = del(item.children);
      return true;
    });
    setMenuData({ ...menuData, items: del(menuData.items) });
    if (selectedItem?._id === itemId) setSelectedItem(null);
  };

  const updateMenuItem = (itemId, updates) => {
    const upd = (items) => items.map(item => {
      if (item._id === itemId) {
        const updated = { ...item, ...updates };
        if (selectedItem && String(selectedItem._id) === String(itemId)) setSelectedItem(updated);
        return updated;
      }
      if (item.children?.length > 0) return { ...item, children: upd(item.children) };
      return item;
    });
    setMenuData({ ...menuData, items: upd(menuData.items) });
  };

  const duplicateMenuItem = (itemId) => {
    const resetIds = (items) => items.map(i => ({
      ...i,
      _id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      children: i.children ? resetIds(i.children) : [],
    }));
    const dupIn = (items) => {
      const result = [];
      for (const item of items) {
        result.push({ ...item, children: item.children?.length > 0 ? dupIn(item.children) : item.children });
        if (item._id === itemId) {
          const clone = JSON.parse(JSON.stringify(item));
          clone._id = `item-${Date.now()}`;
          clone.label = `${clone.label} (Copy)`;
          if (clone.children) clone.children = resetIds(clone.children);
          result.push(clone);
        }
      }
      return result;
    };
    setMenuData({ ...menuData, items: dupIn(menuData.items) });
  };

  const addChildItem = (parentId) => {
    const newChild = {
      _id: `item-${Date.now()}`, label: 'New Sub-item', link: '#', linkType: 'manual',
      description: '', icon: '', badge: '', openInNewTab: false, children: [],
      visibility: { showOnDesktop: true, showOnTablet: true, showOnMobile: true, showLoggedIn: true, showLoggedOut: true },
      itemStyle: {}, megaMenu: { enabled: false },
    };
    const add = (items) => items.map(item => {
      if (item._id === parentId) return { ...item, children: [...(item.children || []), newChild] };
      if (item.children?.length > 0) return { ...item, children: add(item.children) };
      return item;
    });
    setMenuData({ ...menuData, items: add(menuData.items) });
  };

  const toggleExpand = (itemId) => {
    const n = new Set(expandedItems);
    n.has(itemId) ? n.delete(itemId) : n.add(itemId);
    setExpandedItems(n);
  };

  const TABS = [
    { id: 'items', label: 'Items', icon: MenuIcon },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'responsive', label: 'Responsive', icon: Smartphone },
    ...(menuData.location === 'footer' ? [{ id: 'footer', label: 'Footer', icon: Layout }] : []),
  ];

  return (
    <Modal isOpen onClose={onClose} title={`Edit Menu: ${menu.name}`} size="xl" showFooter={false}>
      {/* Tab Bar */}
      <div className="flex items-center gap-1 border-b border-gray-200 -mt-2 mb-4">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon size={15} /> {tab.label}
          </button>
        ))}
        <div className="flex-1" />
        <label className="flex items-center gap-2 mr-2 text-sm">
          <input type="checkbox" checked={menuData.isGlobal || false}
            onChange={(e) => setMenuData({ ...menuData, isGlobal: e.target.checked })} className="rounded text-indigo-600" />
          <Globe size={14} className="text-indigo-600" /> Global
        </label>
      </div>

      {/* ── ITEMS TAB ─────────────────────────────────────────────── */}
      {activeTab === 'items' && (
        <div className="flex" style={{ height: 'calc(70vh - 120px)', minHeight: '500px' }}>
          {/* Left: Menu Items Tree */}
          <div className="w-[45%] border-r border-gray-200 p-3 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 text-sm">Menu Items</h3>
              <Button onClick={addMenuItem} size="sm"><Plus size={14} className="mr-1" /> Add</Button>
            </div>

            <div className="mb-3 p-2 bg-gray-50 rounded border border-gray-200">
              <div className="space-y-1.5">
                <LabeledCheck label="Auto-include published pages" checked={menuData.autoPopulatePages}
                  onChange={(e) => setMenuData({ ...menuData, autoPopulatePages: e.target.checked })} />
                <LabeledCheck label="Auto-include categories" checked={menuData.autoPopulateCategories}
                  onChange={(e) => setMenuData({ ...menuData, autoPopulateCategories: e.target.checked })} />
              </div>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={menuData.items.map(item => item._id)} strategy={verticalListSortingStrategy}>
                <MenuItemsTree items={menuData.items} selectedItem={selectedItem} onSelect={setSelectedItem}
                  onDelete={deleteMenuItem} onAddChild={addChildItem} onUpdate={updateMenuItem} onDuplicate={duplicateMenuItem}
                  expandedItems={expandedItems} onToggleExpand={toggleExpand} onOpenMegaMenu={openMegaMenuDesigner} level={0} />
              </SortableContext>
            </DndContext>
          </div>

          {/* Right: Item Properties */}
          <div className="w-[55%] p-3 overflow-y-auto">
            {selectedItem ? (
              <MenuItemProperties item={selectedItem}
                onUpdate={(updates) => updateMenuItem(selectedItem._id, updates)}
                onOpenMegaMenu={() => openMegaMenuDesigner(selectedItem)} />
            ) : (
              <div className="text-center text-gray-400 py-16">
                <MenuIcon size={40} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">Select a menu item to edit</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SETTINGS TAB ──────────────────────────────────────────── */}
      {activeTab === 'settings' && (
        <div className="overflow-y-auto space-y-3" style={{ height: 'calc(70vh - 120px)', minHeight: '500px' }}>
          <MenuSettingsPanel menuData={menuData} getSettings={getSettings} setSettings={setSettings} setMenuData={setMenuData} />
        </div>
      )}

      {/* ── RESPONSIVE TAB ────────────────────────────────────────── */}
      {activeTab === 'responsive' && (
        <div className="overflow-y-auto space-y-3" style={{ height: 'calc(70vh - 120px)', minHeight: '500px' }}>
          <ResponsiveSettingsPanel getSettings={getSettings} setSettings={setSettings} />
        </div>
      )}

      {/* ── FOOTER TAB ────────────────────────────────────────────── */}
      {activeTab === 'footer' && (
        <div className="overflow-y-auto space-y-3" style={{ height: 'calc(70vh - 120px)', minHeight: '500px' }}>
          <FooterSettingsPanel getSettings={getSettings} setSettings={setSettings} />
        </div>
      )}

      {/* Mega Menu Designer Modal */}
      {showMegaMenuDesigner && megaMenuItem && (
        <MegaMenuDesigner item={megaMenuItem}
          onClose={() => { setShowMegaMenuDesigner(false); setMegaMenuItem(null); }}
          onSave={(content) => { updateMegaMenuContent(megaMenuItem._id, content); setShowMegaMenuDesigner(false); setMegaMenuItem(null); }} />
      )}

      <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 mt-3">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} loading={updateMutation.isLoading}>Save Menu</Button>
      </div>
    </Modal>
  );
};

// ── Menu Settings Panel (Pro features) ───────────────────────────────
const MenuSettingsPanel = ({ menuData, getSettings, setSettings, setMenuData }) => (
  <div className="space-y-3">
    {/* Top Bar */}
    <CollapsibleSection title="Top Bar" icon={Layout} defaultOpen>
      <LabeledCheck label="Show Top Bar" checked={getSettings('topBar.enabled', true)} onChange={(e) => setSettings('topBar.enabled', e.target.checked)}
        description="Utility bar above the main header" />
      {getSettings('topBar.enabled', true) && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <LabeledColor label="Background" value={getSettings('topBar.backgroundColor', '')} onChange={(e) => setSettings('topBar.backgroundColor', e.target.value)} />
            <LabeledColor label="Text Color" value={getSettings('topBar.textColor', '')} onChange={(e) => setSettings('topBar.textColor', e.target.value)} />
          </div>
          <LabeledInput label="Phone Number" value={getSettings('topBar.phone', '')} onChange={(e) => setSettings('topBar.phone', e.target.value)} placeholder="(480) 555-0103" />
          <LabeledInput label="Phone Label" value={getSettings('topBar.phoneLabel', 'Need Support? Call Us:')} onChange={(e) => setSettings('topBar.phoneLabel', e.target.value)} />
          <LabeledInput label="Location Text" value={getSettings('topBar.location', '')} onChange={(e) => setSettings('topBar.location', e.target.value)} placeholder="Johannesburg, South Africa" />
          <LabeledInput label="Promo / Announcement" value={getSettings('topBar.announcement', '')} onChange={(e) => setSettings('topBar.announcement', e.target.value)} placeholder="Free shipping on orders over $50!" />
          <div className="space-y-1.5">
            <LabeledCheck label="Show Language Selector" checked={getSettings('topBar.showLanguage', false)} onChange={(e) => setSettings('topBar.showLanguage', e.target.checked)} />
            {getSettings('topBar.showLanguage', false) && (
              <LabeledInput label="Languages (comma-separated)" value={getSettings('topBar.languages', 'English,Afrikaans')} onChange={(e) => setSettings('topBar.languages', e.target.value)} />
            )}
            <LabeledCheck label="Show Currency Selector" checked={getSettings('topBar.showCurrency', false)} onChange={(e) => setSettings('topBar.showCurrency', e.target.checked)} />
            {getSettings('topBar.showCurrency', false) && (
              <LabeledInput label="Currencies (comma-separated)" value={getSettings('topBar.currencies', 'ZAR,USD,EUR')} onChange={(e) => setSettings('topBar.currencies', e.target.value)} />
            )}
          </div>
          <LabeledInput label="Padding" value={getSettings('topBar.padding', '8px 0')} onChange={(e) => setSettings('topBar.padding', e.target.value)} />
          <LabeledInput label="Font Size" value={getSettings('topBar.fontSize', '13px')} onChange={(e) => setSettings('topBar.fontSize', e.target.value)} />
        </>
      )}
    </CollapsibleSection>

    {/* Main Header Row */}
    <CollapsibleSection title="Main Header Row" icon={Columns}>
      <LabeledCheck label="Show Main Header Row" checked={getSettings('headerRow.enabled', true)} onChange={(e) => setSettings('headerRow.enabled', e.target.checked)}
        description="Row with logo, search, account/cart icons" />
      {getSettings('headerRow.enabled', true) && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <LabeledColor label="Background" value={getSettings('headerRow.backgroundColor', '')} onChange={(e) => setSettings('headerRow.backgroundColor', e.target.value)} />
            <LabeledColor label="Border Color" value={getSettings('headerRow.borderColor', '#e5e7eb')} onChange={(e) => setSettings('headerRow.borderColor', e.target.value)} />
          </div>
          <LabeledInput label="Padding" value={getSettings('headerRow.padding', '16px 0')} onChange={(e) => setSettings('headerRow.padding', e.target.value)} />
          <div className="space-y-1.5">
            <LabeledCheck label="Show Search Bar" checked={getSettings('headerRow.showSearch', true)} onChange={(e) => setSettings('headerRow.showSearch', e.target.checked)} />
            <LabeledCheck label="Show Account Icon" checked={getSettings('headerRow.showAccount', true)} onChange={(e) => setSettings('headerRow.showAccount', e.target.checked)} />
            <LabeledCheck label="Show Wishlist Icon" checked={getSettings('headerRow.showWishlist', true)} onChange={(e) => setSettings('headerRow.showWishlist', e.target.checked)} />
            <LabeledCheck label="Show Cart Icon" checked={getSettings('headerRow.showCart', true)} onChange={(e) => setSettings('headerRow.showCart', e.target.checked)} />
          </div>
          <LabeledSelect label="Icon Style" value={getSettings('headerRow.iconStyle', 'circle')} onChange={(e) => setSettings('headerRow.iconStyle', e.target.value)}
            options={[{ value: 'circle', label: 'Circle Background' }, { value: 'plain', label: 'Plain Icons' }, { value: 'outline', label: 'Outlined' }]} />
          <div className="grid grid-cols-2 gap-3">
            <LabeledColor label="Icon Color" value={getSettings('headerRow.iconColor', '#374151')} onChange={(e) => setSettings('headerRow.iconColor', e.target.value)} />
            <LabeledColor label="Icon BG" value={getSettings('headerRow.iconBgColor', '')} onChange={(e) => setSettings('headerRow.iconBgColor', e.target.value)} />
            <LabeledColor label="Badge Color" value={getSettings('headerRow.badgeColor', '')} onChange={(e) => setSettings('headerRow.badgeColor', e.target.value)} />
            <LabeledColor label="Badge Text" value={getSettings('headerRow.badgeTextColor', '')} onChange={(e) => setSettings('headerRow.badgeTextColor', e.target.value)} />
          </div>
        </>
      )}
    </CollapsibleSection>

    {/* Layout & Alignment */}
    <CollapsibleSection title="Nav Bar Layout & Alignment" icon={Layout}>
      <div className="grid grid-cols-2 gap-3">
        <LabeledSelect label="Layout" value={getSettings('layout', 'horizontal')} onChange={(e) => setSettings('layout', e.target.value)}
          options={[{ value: 'horizontal', label: 'Horizontal' }, { value: 'vertical', label: 'Vertical' }]} />
        <LabeledSelect label="Alignment" value={getSettings('alignment', 'left')} onChange={(e) => setSettings('alignment', e.target.value)}
          options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' },
            { value: 'space-between', label: 'Space Between' }, { value: 'space-around', label: 'Space Around' }]} />
      </div>
      <LabeledCheck label="Full Width" checked={getSettings('fullWidth', false)} onChange={(e) => setSettings('fullWidth', e.target.checked)} />
    </CollapsibleSection>

    {/* Colors & Typography */}
    <CollapsibleSection title="Colors & Typography" icon={Palette}>
      <div className="grid grid-cols-2 gap-3">
        <LabeledColor label="Background" value={getSettings('backgroundColor', '#ffffff')} onChange={(e) => setSettings('backgroundColor', e.target.value)} />
        <LabeledColor label="Text Color" value={getSettings('textColor', '#374151')} onChange={(e) => setSettings('textColor', e.target.value)} />
        <LabeledColor label="Hover Color" value={getSettings('hoverTextColor', '#3b82f6')} onChange={(e) => setSettings('hoverTextColor', e.target.value)} />
        <LabeledColor label="Active Color" value={getSettings('activeTextColor', '#3b82f6')} onChange={(e) => setSettings('activeTextColor', e.target.value)} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <LabeledInput label="Font Size" value={getSettings('fontSize', '14px')} onChange={(e) => setSettings('fontSize', e.target.value)} />
        <LabeledInput label="Font Weight" value={getSettings('fontWeight', '500')} onChange={(e) => setSettings('fontWeight', e.target.value)} />
        <LabeledInput label="Letter Spacing" value={getSettings('letterSpacing', '0px')} onChange={(e) => setSettings('letterSpacing', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <LabeledInput label="Font Family" value={getSettings('fontFamily', '')} onChange={(e) => setSettings('fontFamily', e.target.value)} placeholder="inherit" />
        <LabeledSelect label="Text Transform" value={getSettings('textTransform', 'none')} onChange={(e) => setSettings('textTransform', e.target.value)}
          options={[{ value: 'none', label: 'None' }, { value: 'uppercase', label: 'Uppercase' }, { value: 'lowercase', label: 'Lowercase' }, { value: 'capitalize', label: 'Capitalize' }]} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <LabeledInput label="Item Gap" value={getSettings('itemGap', '0px')} onChange={(e) => setSettings('itemGap', e.target.value)} />
        <LabeledInput label="Item Padding" value={getSettings('itemPadding', '12px 18px')} onChange={(e) => setSettings('itemPadding', e.target.value)} />
      </div>
    </CollapsibleSection>

    {/* Sticky Header */}
    <CollapsibleSection title="Sticky Header" icon={ArrowRight}>
      <LabeledCheck label="Enable Sticky" checked={getSettings('sticky', false)} onChange={(e) => setSettings('sticky', e.target.checked)}
        description="Menu stays fixed at top when scrolling" />
      {getSettings('sticky', false) && (
        <div className="grid grid-cols-2 gap-3 mt-2">
          <LabeledInput label="Sticky Offset" value={getSettings('stickyOffset', '0px')} onChange={(e) => setSettings('stickyOffset', e.target.value)} />
          <LabeledColor label="Sticky BG" value={getSettings('stickyBackgroundColor', '')} onChange={(e) => setSettings('stickyBackgroundColor', e.target.value)} />
          <LabeledColor label="Sticky Text" value={getSettings('stickyTextColor', '')} onChange={(e) => setSettings('stickyTextColor', e.target.value)} />
          <LabeledInput label="Sticky Shadow" value={getSettings('stickyBoxShadow', '0 2px 10px rgba(0,0,0,0.1)')} onChange={(e) => setSettings('stickyBoxShadow', e.target.value)} />
        </div>
      )}
    </CollapsibleSection>

    {/* Transparent Header */}
    <CollapsibleSection title="Transparent Header" icon={Eye}>
      <LabeledCheck label="Enable Transparent" checked={getSettings('transparent', false)} onChange={(e) => setSettings('transparent', e.target.checked)}
        description="Menu overlays content with transparent background" />
      {getSettings('transparent', false) && (
        <LabeledColor label="Text Color (Transparent)" value={getSettings('transparentTextColor', '#ffffff')} onChange={(e) => setSettings('transparentTextColor', e.target.value)} />
      )}
    </CollapsibleSection>

    {/* Dropdown Settings */}
    <CollapsibleSection title="Dropdown Settings" icon={ChevronDown}>
      <div className="grid grid-cols-2 gap-3">
        <LabeledSelect label="Trigger" value={getSettings('dropdown.trigger', 'hover')} onChange={(e) => setSettings('dropdown.trigger', e.target.value)}
          options={[{ value: 'hover', label: 'Hover' }, { value: 'click', label: 'Click' }]} />
        <LabeledSelect label="Animation" value={getSettings('dropdown.animation', 'fade')} onChange={(e) => setSettings('dropdown.animation', e.target.value)}
          options={[{ value: 'none', label: 'None' }, { value: 'fade', label: 'Fade' }, { value: 'slide-down', label: 'Slide Down' }, { value: 'slide-up', label: 'Slide Up' }, { value: 'grow', label: 'Grow' }]} />
        <LabeledInput label="Duration" value={getSettings('dropdown.animationDuration', '200ms')} onChange={(e) => setSettings('dropdown.animationDuration', e.target.value)} />
        <LabeledSelect label="Indicator" value={getSettings('dropdown.indicator', 'chevron')} onChange={(e) => setSettings('dropdown.indicator', e.target.value)}
          options={[{ value: 'chevron', label: 'Chevron' }, { value: 'arrow', label: 'Arrow' }, { value: 'plus', label: 'Plus' }, { value: 'none', label: 'None' }]} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <LabeledColor label="DD Background" value={getSettings('dropdown.backgroundColor', '#ffffff')} onChange={(e) => setSettings('dropdown.backgroundColor', e.target.value)} />
        <LabeledColor label="DD Text" value={getSettings('dropdown.textColor', '#374151')} onChange={(e) => setSettings('dropdown.textColor', e.target.value)} />
        <LabeledColor label="DD Hover Text" value={getSettings('dropdown.hoverTextColor', '#3b82f6')} onChange={(e) => setSettings('dropdown.hoverTextColor', e.target.value)} />
        <LabeledColor label="DD Hover BG" value={getSettings('dropdown.hoverBackgroundColor', '#f3f4f6')} onChange={(e) => setSettings('dropdown.hoverBackgroundColor', e.target.value)} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <LabeledInput label="Border Radius" value={getSettings('dropdown.borderRadius', '8px')} onChange={(e) => setSettings('dropdown.borderRadius', e.target.value)} />
        <LabeledInput label="Min Width" value={getSettings('dropdown.minWidth', '200px')} onChange={(e) => setSettings('dropdown.minWidth', e.target.value)} />
        <LabeledInput label="DD Font Size" value={getSettings('dropdown.fontSize', '13px')} onChange={(e) => setSettings('dropdown.fontSize', e.target.value)} />
      </div>
    </CollapsibleSection>

    {/* Active Indicator */}
    <CollapsibleSection title="Active State Indicator" icon={Minus}>
      <div className="grid grid-cols-3 gap-3">
        <LabeledSelect label="Type" value={getSettings('activeIndicator.type', 'underline')} onChange={(e) => setSettings('activeIndicator.type', e.target.value)}
          options={[{ value: 'none', label: 'None' }, { value: 'underline', label: 'Underline' }, { value: 'overline', label: 'Overline' },
            { value: 'background', label: 'Background' }, { value: 'border-bottom', label: 'Border Bottom' }, { value: 'dot', label: 'Dot' }]} />
        <LabeledColor label="Color" value={getSettings('activeIndicator.color', '#3b82f6')} onChange={(e) => setSettings('activeIndicator.color', e.target.value)} />
        <LabeledInput label="Thickness" value={getSettings('activeIndicator.thickness', '2px')} onChange={(e) => setSettings('activeIndicator.thickness', e.target.value)} />
      </div>
    </CollapsibleSection>

    {/* Dividers */}
    <CollapsibleSection title="Item Dividers" icon={Minus}>
      <LabeledCheck label="Show Dividers" checked={getSettings('divider.enabled', false)} onChange={(e) => setSettings('divider.enabled', e.target.checked)} />
      {getSettings('divider.enabled', false) && (
        <div className="grid grid-cols-3 gap-3">
          <LabeledColor label="Color" value={getSettings('divider.color', '#e5e7eb')} onChange={(e) => setSettings('divider.color', e.target.value)} />
          <LabeledInput label="Width" value={getSettings('divider.width', '1px')} onChange={(e) => setSettings('divider.width', e.target.value)} />
          <LabeledInput label="Height" value={getSettings('divider.height', '20px')} onChange={(e) => setSettings('divider.height', e.target.value)} />
        </div>
      )}
    </CollapsibleSection>

    {/* Logo in Menu */}
    <CollapsibleSection title="Logo" icon={Image}>
      <LabeledCheck label="Show Logo in Menu" checked={getSettings('logo.enabled', false)} onChange={(e) => setSettings('logo.enabled', e.target.checked)} />
      {getSettings('logo.enabled', false) && (
        <>
          <LabeledInput label="Logo URL" value={getSettings('logo.src', '')} onChange={(e) => setSettings('logo.src', e.target.value)} placeholder="https://..." />
          <div className="grid grid-cols-3 gap-3">
            <LabeledInput label="Width" value={getSettings('logo.width', '120px')} onChange={(e) => setSettings('logo.width', e.target.value)} />
            <LabeledInput label="Height" value={getSettings('logo.height', 'auto')} onChange={(e) => setSettings('logo.height', e.target.value)} />
            <LabeledSelect label="Position" value={getSettings('logo.position', 'left')} onChange={(e) => setSettings('logo.position', e.target.value)}
              options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }]} />
          </div>
          <LabeledInput label="Link" value={getSettings('logo.link', '/')} onChange={(e) => setSettings('logo.link', e.target.value)} />
          <LabeledInput label="Sticky Logo URL" value={getSettings('logo.stickyLogo', '')} onChange={(e) => setSettings('logo.stickyLogo', e.target.value)} placeholder="Different logo for sticky state" />
        </>
      )}
    </CollapsibleSection>

    {/* CTA Button */}
    <CollapsibleSection title="CTA Button" icon={MousePointer}>
      <LabeledCheck label="Show CTA Button" checked={getSettings('ctaButton.enabled', false)} onChange={(e) => setSettings('ctaButton.enabled', e.target.checked)} />
      {getSettings('ctaButton.enabled', false) && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <LabeledInput label="Text" value={getSettings('ctaButton.text', 'Get Started')} onChange={(e) => setSettings('ctaButton.text', e.target.value)} />
            <LabeledInput label="Link" value={getSettings('ctaButton.link', '#')} onChange={(e) => setSettings('ctaButton.link', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <LabeledColor label="BG Color" value={getSettings('ctaButton.backgroundColor', '#3b82f6')} onChange={(e) => setSettings('ctaButton.backgroundColor', e.target.value)} />
            <LabeledColor label="Text Color" value={getSettings('ctaButton.textColor', '#ffffff')} onChange={(e) => setSettings('ctaButton.textColor', e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <LabeledInput label="Border Radius" value={getSettings('ctaButton.borderRadius', '6px')} onChange={(e) => setSettings('ctaButton.borderRadius', e.target.value)} />
            <LabeledInput label="Padding" value={getSettings('ctaButton.padding', '10px 20px')} onChange={(e) => setSettings('ctaButton.padding', e.target.value)} />
            <LabeledSelect label="Position" value={getSettings('ctaButton.position', 'right')} onChange={(e) => setSettings('ctaButton.position', e.target.value)}
              options={[{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }]} />
          </div>
        </>
      )}
    </CollapsibleSection>

    {/* Search */}
    <CollapsibleSection title="Search" icon={Search}>
      <LabeledCheck label="Show Search" checked={getSettings('search.enabled', false)} onChange={(e) => setSettings('search.enabled', e.target.checked)} />
      {getSettings('search.enabled', false) && (
        <div className="grid grid-cols-3 gap-3">
          <LabeledSelect label="Style" value={getSettings('search.style', 'icon')} onChange={(e) => setSettings('search.style', e.target.value)}
            options={[{ value: 'icon', label: 'Icon Only' }, { value: 'inline', label: 'Inline' }, { value: 'expandable', label: 'Expandable' }]} />
          <LabeledInput label="Placeholder" value={getSettings('search.placeholder', 'Search...')} onChange={(e) => setSettings('search.placeholder', e.target.value)} />
          <LabeledSelect label="Position" value={getSettings('search.position', 'right')} onChange={(e) => setSettings('search.position', e.target.value)}
            options={[{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }]} />
        </div>
      )}
    </CollapsibleSection>

    {/* Custom CSS */}
    <CollapsibleSection title="Custom CSS" icon={Type}>
      <LabeledInput label="Custom Class" value={getSettings('customClass', '')} onChange={(e) => setSettings('customClass', e.target.value)} placeholder="my-custom-menu" />
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Custom CSS</label>
        <textarea value={getSettings('customCSS', '')} onChange={(e) => setSettings('customCSS', e.target.value)}
          className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500" rows={4}
          placeholder=".menu-item { ... }" />
      </div>
    </CollapsibleSection>
  </div>
);

// ── Responsive Settings Panel ────────────────────────────────────────
const ResponsiveSettingsPanel = ({ getSettings, setSettings }) => (
  <div className="space-y-3">
    {/* Mobile Settings */}
    <CollapsibleSection title="Mobile Menu" icon={Smartphone} defaultOpen>
      <div className="grid grid-cols-2 gap-3">
        <LabeledInput label="Breakpoint" value={getSettings('mobile.breakpoint', '768px')} onChange={(e) => setSettings('mobile.breakpoint', e.target.value)} />
        <LabeledSelect label="Menu Style" value={getSettings('mobile.menuStyle', 'slide-left')} onChange={(e) => setSettings('mobile.menuStyle', e.target.value)}
          options={[{ value: 'slide-left', label: 'Slide Left' }, { value: 'slide-right', label: 'Slide Right' }, { value: 'fullscreen', label: 'Fullscreen' },
            { value: 'dropdown', label: 'Dropdown' }, { value: 'off-canvas', label: 'Off Canvas' }]} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <LabeledSelect label="Hamburger Style" value={getSettings('mobile.hamburgerStyle', 'default')} onChange={(e) => setSettings('mobile.hamburgerStyle', e.target.value)}
          options={[{ value: 'default', label: 'Default' }, { value: 'squeeze', label: 'Squeeze' }, { value: 'spin', label: 'Spin' },
            { value: 'elastic', label: 'Elastic' }, { value: 'collapse', label: 'Collapse' }]} />
        <LabeledColor label="Hamburger Color" value={getSettings('mobile.hamburgerColor', '#374151')} onChange={(e) => setSettings('mobile.hamburgerColor', e.target.value)} />
      </div>
      <LabeledInput label="Hamburger Size" value={getSettings('mobile.hamburgerSize', '24px')} onChange={(e) => setSettings('mobile.hamburgerSize', e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <LabeledColor label="Mobile BG" value={getSettings('mobile.backgroundColor', '#ffffff')} onChange={(e) => setSettings('mobile.backgroundColor', e.target.value)} />
        <LabeledColor label="Mobile Text" value={getSettings('mobile.textColor', '#374151')} onChange={(e) => setSettings('mobile.textColor', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <LabeledInput label="Font Size" value={getSettings('mobile.fontSize', '16px')} onChange={(e) => setSettings('mobile.fontSize', e.target.value)} />
        <LabeledInput label="Item Padding" value={getSettings('mobile.itemPadding', '12px 16px')} onChange={(e) => setSettings('mobile.itemPadding', e.target.value)} />
      </div>
      <LabeledSelect label="Submenu Animation" value={getSettings('mobile.submenuAnimation', 'accordion')} onChange={(e) => setSettings('mobile.submenuAnimation', e.target.value)}
        options={[{ value: 'accordion', label: 'Accordion' }, { value: 'slide', label: 'Slide' }, { value: 'fade', label: 'Fade' }]} />
      <div className="space-y-1.5">
        <LabeledCheck label="Show Search" checked={getSettings('mobile.showSearch', false)} onChange={(e) => setSettings('mobile.showSearch', e.target.checked)} />
        <LabeledCheck label="Show Social Icons" checked={getSettings('mobile.showSocial', false)} onChange={(e) => setSettings('mobile.showSocial', e.target.checked)} />
        <LabeledCheck label="Close on Link Click" checked={getSettings('mobile.closeOnLinkClick', true)} onChange={(e) => setSettings('mobile.closeOnLinkClick', e.target.checked)} />
      </div>
      <LabeledColor label="Overlay Color" value={getSettings('mobile.overlayColor', 'rgba(0,0,0,0.5)')} onChange={(e) => setSettings('mobile.overlayColor', e.target.value)} />
    </CollapsibleSection>

    {/* Tablet Settings */}
    <CollapsibleSection title="Tablet Settings" icon={Tablet}>
      <div className="grid grid-cols-2 gap-3">
        <LabeledInput label="Breakpoint" value={getSettings('tablet.breakpoint', '1024px')} onChange={(e) => setSettings('tablet.breakpoint', e.target.value)} />
        <LabeledSelect label="Layout" value={getSettings('tablet.layout', 'same')} onChange={(e) => setSettings('tablet.layout', e.target.value)}
          options={[{ value: 'same', label: 'Same as Desktop' }, { value: 'horizontal', label: 'Horizontal' }, { value: 'vertical', label: 'Vertical' }, { value: 'mobile', label: 'Use Mobile Menu' }]} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <LabeledInput label="Font Size" value={getSettings('tablet.fontSize', '')} onChange={(e) => setSettings('tablet.fontSize', e.target.value)} placeholder="inherit" />
        <LabeledInput label="Item Padding" value={getSettings('tablet.itemPadding', '')} onChange={(e) => setSettings('tablet.itemPadding', e.target.value)} placeholder="inherit" />
        <LabeledInput label="Item Gap" value={getSettings('tablet.itemGap', '')} onChange={(e) => setSettings('tablet.itemGap', e.target.value)} placeholder="inherit" />
      </div>
    </CollapsibleSection>
  </div>
);

// ── Footer Settings Panel ────────────────────────────────────────────
const FooterSettingsPanel = ({ getSettings, setSettings }) => (
  <div className="space-y-3">
    <CollapsibleSection title="Footer Layout" icon={Columns} defaultOpen>
      <div className="grid grid-cols-2 gap-3">
        <LabeledSelect label="Columns" value={getSettings('footer.columns', 4)} onChange={(e) => setSettings('footer.columns', parseInt(e.target.value))}
          options={[1,2,3,4,5,6].map(n => ({ value: n, label: `${n} Column${n>1?'s':''}` }))} />
        <LabeledInput label="Column Widths" value={getSettings('footer.columnWidths', '')} onChange={(e) => setSettings('footer.columnWidths', e.target.value)} placeholder="25%,25%,25%,25%" />
      </div>
      <LabeledInput label="Padding" value={getSettings('footer.padding', '48px 0')} onChange={(e) => setSettings('footer.padding', e.target.value)} />
    </CollapsibleSection>

    <CollapsibleSection title="Footer Colors" icon={Palette}>
      <div className="grid grid-cols-2 gap-3">
        <LabeledColor label="Background" value={getSettings('footer.backgroundColor', '#1a1a2e')} onChange={(e) => setSettings('footer.backgroundColor', e.target.value)} />
        <LabeledColor label="Text Color" value={getSettings('footer.textColor', '#a0aec0')} onChange={(e) => setSettings('footer.textColor', e.target.value)} />
        <LabeledColor label="Heading Color" value={getSettings('footer.headingColor', '#ffffff')} onChange={(e) => setSettings('footer.headingColor', e.target.value)} />
        <LabeledColor label="Link Hover" value={getSettings('footer.linkHoverColor', '#ffffff')} onChange={(e) => setSettings('footer.linkHoverColor', e.target.value)} />
      </div>
      <LabeledInput label="Heading Font Size" value={getSettings('footer.headingFontSize', '18px')} onChange={(e) => setSettings('footer.headingFontSize', e.target.value)} />
    </CollapsibleSection>

    <CollapsibleSection title="Newsletter" icon={Tag}>
      <LabeledCheck label="Show Newsletter" checked={getSettings('footer.showNewsletter', false)} onChange={(e) => setSettings('footer.showNewsletter', e.target.checked)} />
      {getSettings('footer.showNewsletter', false) && (
        <>
          <LabeledInput label="Title" value={getSettings('footer.newsletterTitle', 'Subscribe to our newsletter')} onChange={(e) => setSettings('footer.newsletterTitle', e.target.value)} />
          <LabeledInput label="Description" value={getSettings('footer.newsletterDescription', '')} onChange={(e) => setSettings('footer.newsletterDescription', e.target.value)} />
        </>
      )}
    </CollapsibleSection>

    <CollapsibleSection title="Social Icons" icon={Globe}>
      <LabeledCheck label="Show Social Icons" checked={getSettings('footer.showSocialIcons', false)} onChange={(e) => setSettings('footer.showSocialIcons', e.target.checked)} />
      {getSettings('footer.showSocialIcons', false) && (
        <div className="space-y-2">
          {['facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'pinterest', 'tiktok'].map(platform => (
            <LabeledInput key={platform} label={platform.charAt(0).toUpperCase() + platform.slice(1)}
              value={getSettings(`footer.socialLinks.${platform}`, '')} onChange={(e) => setSettings(`footer.socialLinks.${platform}`, e.target.value)}
              placeholder={`https://${platform}.com/...`} />
          ))}
        </div>
      )}
    </CollapsibleSection>

    <CollapsibleSection title="Bottom Bar" icon={Layout}>
      <LabeledInput label="Copyright Text" value={getSettings('footer.copyrightText', '')} onChange={(e) => setSettings('footer.copyrightText', e.target.value)}
        placeholder="&copy; 2025 Your Company. All rights reserved." />
      <LabeledCheck label="Show Payment Icons" checked={getSettings('footer.showPaymentIcons', false)} onChange={(e) => setSettings('footer.showPaymentIcons', e.target.checked)} />
      <div className="grid grid-cols-2 gap-3">
        <LabeledColor label="Bottom Bar BG" value={getSettings('footer.bottomBarBg', '')} onChange={(e) => setSettings('footer.bottomBarBg', e.target.value)} />
        <LabeledColor label="Bottom Bar Text" value={getSettings('footer.bottomBarTextColor', '')} onChange={(e) => setSettings('footer.bottomBarTextColor', e.target.value)} />
      </div>
    </CollapsibleSection>
  </div>
);

// ── Menu Item Context Menu ───────────────────────────────────────────
const MenuItemContextMenu = ({ x, y, item, onClose, onSelect, onDelete, onAddChild, onDuplicate, onOpenMegaMenu, onToggleExpand }) => {
  const menuRef = useRef(null);
  const [pos, setPos] = useState({ left: x, top: y });

  useLayoutEffect(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = x, top = y;
    if (left + rect.width > vw - 8) left = vw - rect.width - 8;
    if (top + rect.height > vh - 8) top = vh - rect.height - 8;
    if (left < 4) left = 4;
    if (top < 4) top = 4;
    setPos({ left, top });
  }, [x, y]);

  useEffect(() => {
    const handleClick = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) onClose(); };
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => { document.removeEventListener('mousedown', handleClick); document.removeEventListener('keydown', handleKey); };
  }, [onClose]);

  const fire = (fn) => () => { if (fn) fn(); onClose(); };

  const BtnItem = ({ icon: Icon, label, onClick, danger, disabled }) => (
    <button onClick={onClick} disabled={disabled}
      className={`w-full px-3 py-1.5 text-left text-[13px] flex items-center gap-2.5 transition-colors ${
        danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
      } disabled:opacity-40 disabled:cursor-not-allowed`}>
      <Icon size={14} className="shrink-0" />
      <span className="flex-1">{label}</span>
    </button>
  );

  return (
    <div ref={menuRef} className="fixed bg-white border border-gray-200 rounded-lg shadow-xl z-[9999] py-1 min-w-[190px]"
      style={{ left: `${pos.left}px`, top: `${pos.top}px` }}>
      <div className="px-3 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate max-w-[200px]">
        {item.label}
      </div>
      <div className="border-t border-gray-200 my-1" />
      <BtnItem icon={Edit} label="Edit Properties" onClick={fire(onSelect)} />
      <BtnItem icon={Copy} label="Duplicate" onClick={fire(onDuplicate)} />
      <BtnItem icon={Plus} label="Add Sub-item" onClick={fire(onAddChild)} />
      {onToggleExpand && <BtnItem icon={ChevronDown} label="Toggle Expand" onClick={fire(onToggleExpand)} />}
      <div className="border-t border-gray-200 my-1" />
      <BtnItem icon={LayoutGrid} label={item.megaMenu?.enabled ? 'Edit Mega Menu' : 'Enable Mega Menu'} onClick={fire(onOpenMegaMenu)} />
      <div className="border-t border-gray-200 my-1" />
      <BtnItem icon={Trash2} label="Delete" onClick={fire(onDelete)} danger />
    </div>
  );
};

// ── Menu Items Tree Component ────────────────────────────────────────
const MenuItemsTree = ({ items, selectedItem, onSelect, onDelete, onAddChild, onUpdate, onDuplicate, expandedItems, onToggleExpand, onOpenMegaMenu, level = 0 }) => (
  <div className="space-y-0.5">
    {items.map((item) => (
      <MenuItemRow key={item._id} item={item} selectedItem={selectedItem} onSelect={onSelect} onDelete={onDelete}
        onAddChild={onAddChild} onUpdate={onUpdate} onDuplicate={onDuplicate} expandedItems={expandedItems} onToggleExpand={onToggleExpand}
        onOpenMegaMenu={onOpenMegaMenu} level={level} />
    ))}
  </div>
);

// ── Menu Item Row Component ──────────────────────────────────────────
const MenuItemRow = ({ item, selectedItem, onSelect, onDelete, onAddChild, onUpdate, onDuplicate, expandedItems, onToggleExpand, onOpenMegaMenu, level = 0 }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item._id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const hasChildren = item.children && item.children.length > 0;
  const isExpanded = expandedItems.has(item._id);
  const isSelected = selectedItem?._id === item._id;
  const [ctxMenu, setCtxMenu] = useState(null);

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(item);
    setCtxMenu({ x: e.clientX, y: e.clientY });
  };

  return (
    <div>
      <div ref={setNodeRef} style={{ ...style, paddingLeft: `${level * 16 + 4}px` }}
        className={`flex items-center gap-1.5 py-1.5 px-2 rounded cursor-pointer transition-colors ${
          isSelected ? 'bg-blue-100 border border-blue-300' : 'hover:bg-gray-50'}`}
        onClick={() => onSelect(item)}
        onContextMenu={handleContextMenu}>
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing"><GripVertical size={14} className="text-gray-400" /></div>
        {hasChildren ? (
          <button onClick={(e) => { e.stopPropagation(); onToggleExpand(item._id); }} className="p-0.5 hover:bg-gray-200 rounded">
            {isExpanded ? <ChevronDown size={12} className="text-gray-500" /> : <ChevronRight size={12} className="text-gray-500" />}
          </button>
        ) : <div className="w-4" />}
        <span className="flex-1 text-sm text-gray-700 truncate">{item.label}</span>
        <div className="flex items-center gap-0.5 shrink-0">
          {item.badge && <span className="text-[10px] px-1 py-0.5 rounded bg-red-100 text-red-700">{item.badge}</span>}
          {item.megaMenu?.enabled && <span className="text-[10px] px-1 py-0.5 rounded bg-purple-100 text-purple-700">Mega</span>}
          {item.description && <span className="text-[10px] px-1 py-0.5 rounded bg-gray-100 text-gray-600" title="Has description">Desc</span>}
          <button onClick={(e) => { e.stopPropagation(); onAddChild(item._id); }} className="p-0.5 hover:bg-gray-200 rounded text-gray-500" title="Add child"><Plus size={12} /></button>
          <button onClick={(e) => { e.stopPropagation(); if (window.confirm('Delete this item?')) onDelete(item._id); }}
            className="p-0.5 hover:bg-red-100 rounded text-red-500" title="Delete"><Trash2 size={12} /></button>
        </div>
      </div>
      {hasChildren && isExpanded && (
        <MenuItemsTree items={item.children} selectedItem={selectedItem} onSelect={onSelect} onDelete={onDelete}
          onAddChild={onAddChild} onUpdate={onUpdate} onDuplicate={onDuplicate} expandedItems={expandedItems} onToggleExpand={onToggleExpand}
          onOpenMegaMenu={onOpenMegaMenu} level={level + 1} />
      )}

      {/* Right-click Context Menu */}
      {ctxMenu && ReactDOM.createPortal(
        <MenuItemContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          item={item}
          onClose={() => setCtxMenu(null)}
          onSelect={() => onSelect(item)}
          onDelete={() => { if (window.confirm(`Delete "${item.label}"?`)) onDelete(item._id); }}
          onAddChild={() => onAddChild(item._id)}
          onDuplicate={() => onDuplicate(item._id)}
          onOpenMegaMenu={() => onOpenMegaMenu(item)}
          onToggleExpand={hasChildren ? () => onToggleExpand(item._id) : undefined}
        />,
        document.body
      )}
    </div>
  );
};

// ── Menu Item Properties Component (Enhanced) ────────────────────────
const MenuItemProperties = ({ item, onUpdate, onOpenMegaMenu }) => {
  const [formData, setFormData] = useState(item);
  const [propsTab, setPropsTab] = useState('general'); // general | style | mega | visibility

  const { data: pagesResponse } = useQuery('pages', () => pageTemplatesAPI.getAll());
  const { data: categoriesResponse } = useQuery('categories', () => categoriesAPI.getAll());
  const pages = pagesResponse?.data?.data || [];
  const categories = categoriesResponse?.data?.data || [];

  const formDataRef = useRef(item);

  useEffect(() => { formDataRef.current = formData; }, [formData]);

  // Sync formData whenever a different item is selected (by _id)
  useEffect(() => {
    const newFormData = { ...item };
    setFormData(newFormData);
    formDataRef.current = newFormData;
  }, [item._id]);

  const handleChange = (field, value) => {
    const updated = { ...formDataRef.current, [field]: value };
    setFormData(updated);
    formDataRef.current = updated;
    onUpdate(updated);
  };

  const getItemStyle = (key, fallback = '') => (formData.itemStyle || {})[key] || fallback;
  const setItemStyle = (key, value) => handleChange('itemStyle', { ...(formData.itemStyle || {}), [key]: value });
  const getVisibility = (key, fallback = true) => (formData.visibility || {})[key] !== undefined ? (formData.visibility || {})[key] : fallback;
  const setVisibility = (key, value) => handleChange('visibility', { ...(formData.visibility || {}), [key]: value });
  const getMega = (key, fallback = '') => (formData.megaMenu || {})[key] !== undefined ? (formData.megaMenu || {})[key] : fallback;
  const setMega = (key, value) => handleChange('megaMenu', { ...(formData.megaMenu || {}), [key]: value });

  const PROPS_TABS = [
    { id: 'general', label: 'General' },
    { id: 'style', label: 'Style' },
    { id: 'mega', label: 'Mega Menu' },
    { id: 'visibility', label: 'Visibility' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1 border-b border-gray-200 pb-2">
        {PROPS_TABS.map(t => (
          <button key={t.id} onClick={() => setPropsTab(t.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-t transition-colors ${
              propsTab === t.id ? 'bg-blue-100 text-blue-700 border border-blue-200 border-b-0' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── General Tab ─────────────────────────────────────────── */}
      {propsTab === 'general' && (
        <div className="space-y-3">
          <LabeledInput label="Label" value={formData.label || ''} onChange={(e) => handleChange('label', e.target.value)} placeholder="Menu item label" />
          <LabeledInput label="Description / Subtitle" value={formData.description || ''} onChange={(e) => handleChange('description', e.target.value)} placeholder="Optional subtitle text" />

          <LabeledSelect label="Link Type" value={formData.linkType || 'manual'} onChange={(e) => {
            const newType = e.target.value;
            const updates = { linkType: newType };
            if (newType === 'manual') { updates.link = '#'; updates.linkId = ''; }
            if (newType === 'none') { updates.link = ''; updates.linkId = ''; }
            const updated = { ...formDataRef.current, ...updates };
            setFormData(updated);
            formDataRef.current = updated;
            onUpdate(updated);
          }} options={[
            { value: 'manual', label: 'Manual URL' }, { value: 'page', label: 'Page' },
            { value: 'category', label: 'Category' }, { value: 'product', label: 'Product' }, { value: 'none', label: 'Non-clickable' },
          ]} />

          {formData.linkType === 'manual' && (
            <LabeledInput label="Link URL" value={formData.link || ''} onChange={(e) => handleChange('link', e.target.value)} placeholder="/page or https://..." />
          )}

          {formData.linkType === 'page' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Select Page</label>
              <select value={formData.linkId ? String(formData.linkId) : ''} onChange={(e) => {
                const val = e.target.value;
                if (!val) { handleChange('linkId', ''); handleChange('link', '#'); return; }
                const p = pages.find(p => String(p._id) === val);
                if (p) {
                  const updated = { ...formDataRef.current, linkId: String(p._id), link: `/${p.slug}` };
                  setFormData(updated); formDataRef.current = updated; onUpdate(updated);
                }
              }} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm">
                <option value="">-- Select a page --</option>
                {pages.map(p => <option key={p._id} value={String(p._id)}>{p.name}</option>)}
              </select>
            </div>
          )}

          {formData.linkType === 'category' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Select Category</label>
              <select value={formData.linkId ? String(formData.linkId) : ''} onChange={(e) => {
                const c = categories.find(c => String(c._id) === e.target.value);
                if (c) { const updated = { ...formDataRef.current, linkId: String(c._id), link: `/category/${c.slug}` }; setFormData(updated); formDataRef.current = updated; onUpdate(updated); }
              }} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm">
                <option value="">-- Select --</option>
                {categories.map(c => <option key={c._id} value={String(c._id)}>{c.name}</option>)}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <LabeledInput label="Icon" value={formData.icon || ''} onChange={(e) => handleChange('icon', e.target.value)} placeholder="Icon name or URL" />
            <LabeledSelect label="Icon Position" value={formData.iconPosition || 'left'} onChange={(e) => handleChange('iconPosition', e.target.value)}
              options={[{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }, { value: 'top', label: 'Top' }]} />
          </div>

          <LabeledInput label="Image URL" value={formData.image || ''} onChange={(e) => handleChange('image', e.target.value)} placeholder="Image for visual menu items" />
          {formData.image && (
            <div className="grid grid-cols-2 gap-3">
              <LabeledInput label="Image Width" value={formData.imageWidth || ''} onChange={(e) => handleChange('imageWidth', e.target.value)} placeholder="auto" />
              <LabeledInput label="Image Height" value={formData.imageHeight || ''} onChange={(e) => handleChange('imageHeight', e.target.value)} placeholder="auto" />
            </div>
          )}

          {/* ── Badge Controls ─────────────────────────────── */}
          <div className="space-y-2">
            <LabeledInput label="Badge Text" value={formData.badge || ''} onChange={(e) => handleChange('badge', e.target.value)} placeholder="New, Sale..." />
            {!formData.badge && (
              <div className="flex flex-wrap gap-1">
                {['Sale', 'New', 'Hot', '-20%', 'Free Shipping', 'Limited'].map(p => (
                  <button key={p} type="button" onClick={() => handleChange('badge', p)}
                    className="px-2 py-0.5 text-[10px] rounded border border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100">{p}</button>
                ))}
              </div>
            )}
            {formData.badge && (
              <div className="space-y-2 p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                {/* Position */}
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 mb-1">Badge Position</label>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { value: 'left', label: '← Before' },
                      { value: 'right', label: 'After →' },
                      { value: 'above', label: '↑ Above' },
                      { value: 'below', label: '↓ Below' },
                    ].map(pos => (
                      <button key={pos.value} type="button" onClick={() => handleChange('badgePosition', pos.value)}
                        className={`px-1 py-1.5 text-[10px] font-medium rounded border transition-colors ${
                          (formData.badgePosition || 'right') === pos.value
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'border-gray-200 text-gray-600 hover:bg-white'
                        }`}>{pos.label}</button>
                    ))}
                  </div>
                </div>

                {/* Colors */}
                <div className="grid grid-cols-2 gap-2">
                  <LabeledColor label="Text Color" value={formData.badgeColor || '#ef4444'} onChange={(e) => handleChange('badgeColor', e.target.value)} />
                  <LabeledColor label="Background" value={formData.badgeBgColor || '#fef2f2'} onChange={(e) => handleChange('badgeBgColor', e.target.value)} />
                </div>
                {/* Color presets */}
                <div className="flex flex-wrap gap-1">
                  {[
                    { label: 'Red', c: '#ef4444', bg: '#fef2f2' },
                    { label: 'Green', c: '#16a34a', bg: '#f0fdf4' },
                    { label: 'Blue', c: '#2563eb', bg: '#eff6ff' },
                    { label: 'Orange', c: '#ea580c', bg: '#fff7ed' },
                    { label: 'Purple', c: '#7c3aed', bg: '#f5f3ff' },
                    { label: 'Solid Red', c: '#ffffff', bg: '#ef4444' },
                    { label: 'Solid Black', c: '#ffffff', bg: '#111827' },
                    { label: 'Solid Blue', c: '#ffffff', bg: '#3b82f6' },
                  ].map(preset => (
                    <button key={preset.label} type="button"
                      onClick={() => { handleChange('badgeColor', preset.c); handleChange('badgeBgColor', preset.bg); }}
                      className="px-1.5 py-0.5 text-[9px] rounded border border-gray-200 hover:opacity-80 transition-opacity"
                      style={{ color: preset.c, backgroundColor: preset.bg }}>{preset.label}</button>
                  ))}
                </div>

                {/* Typography */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 mb-0.5">Font Size</label>
                    <select value={formData.badgeFontSize || '10px'} onChange={(e) => handleChange('badgeFontSize', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-200 rounded text-xs">
                      <option value="8px">8px</option>
                      <option value="9px">9px</option>
                      <option value="10px">10px</option>
                      <option value="11px">11px</option>
                      <option value="12px">12px</option>
                      <option value="13px">13px</option>
                      <option value="14px">14px</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 mb-0.5">Weight</label>
                    <select value={formData.badgeFontWeight || '600'} onChange={(e) => handleChange('badgeFontWeight', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-200 rounded text-xs">
                      <option value="400">Normal</option>
                      <option value="500">Medium</option>
                      <option value="600">Semi Bold</option>
                      <option value="700">Bold</option>
                      <option value="800">Extra Bold</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 mb-0.5">Style</label>
                    <select value={formData.badgeFontStyle || 'normal'} onChange={(e) => handleChange('badgeFontStyle', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-200 rounded text-xs">
                      <option value="normal">Normal</option>
                      <option value="italic">Italic</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 mb-0.5">Transform</label>
                    <select value={formData.badgeTextTransform || 'none'} onChange={(e) => handleChange('badgeTextTransform', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-200 rounded text-xs">
                      <option value="none">None</option>
                      <option value="uppercase">UPPER</option>
                      <option value="lowercase">lower</option>
                      <option value="capitalize">Capital</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 mb-0.5">Spacing</label>
                    <input type="text" value={formData.badgeLetterSpacing || ''} onChange={(e) => handleChange('badgeLetterSpacing', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-200 rounded text-xs" placeholder="0.5px" />
                  </div>
                </div>

                {/* Padding (4-sided) */}
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 mb-1">Padding</label>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { key: 'badgePaddingTop', label: 'Top', def: '2px' },
                      { key: 'badgePaddingRight', label: 'Right', def: '8px' },
                      { key: 'badgePaddingBottom', label: 'Bottom', def: '2px' },
                      { key: 'badgePaddingLeft', label: 'Left', def: '8px' },
                    ].map(s => (
                      <div key={s.key}>
                        <label className="block text-[9px] text-gray-400 text-center mb-0.5">{s.label}</label>
                        <input type="text" value={formData[s.key] || ''} onChange={(e) => handleChange(s.key, e.target.value)}
                          className="w-full px-1 py-1 border border-gray-200 rounded text-[10px] text-center" placeholder={s.def} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Margin (4-sided) */}
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 mb-1">Margin</label>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { key: 'badgeMarginTop', label: 'Top', def: '0px' },
                      { key: 'badgeMarginRight', label: 'Right', def: '0px' },
                      { key: 'badgeMarginBottom', label: 'Bottom', def: '0px' },
                      { key: 'badgeMarginLeft', label: 'Left', def: '0px' },
                    ].map(s => (
                      <div key={s.key}>
                        <label className="block text-[9px] text-gray-400 text-center mb-0.5">{s.label}</label>
                        <input type="text" value={formData[s.key] || ''} onChange={(e) => handleChange(s.key, e.target.value)}
                          className="w-full px-1 py-1 border border-gray-200 rounded text-[10px] text-center" placeholder={s.def} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Border Radius */}
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 mb-0.5">Border Radius</label>
                  <div className="flex gap-1">
                    {['0px', '4px', '6px', '8px', '9999px'].map(v => (
                      <button key={v} type="button" onClick={() => handleChange('badgeBorderRadius', v)}
                        className={`flex-1 px-1 py-1 text-[10px] rounded border transition-colors ${
                          (formData.badgeBorderRadius || '9999px') === v
                            ? 'bg-blue-100 border-blue-400 text-blue-700'
                            : 'border-gray-200 text-gray-500 hover:bg-white'
                        }`}>{v === '9999px' ? 'Pill' : v}</button>
                    ))}
                  </div>
                </div>

                {/* Animation */}
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 mb-1">Animation</label>
                  <div className="grid grid-cols-5 gap-1">
                    {[
                      { value: 'none', label: 'None', emoji: '—' },
                      { value: 'pulse', label: 'Pulse', emoji: '💓' },
                      { value: 'flash', label: 'Flash', emoji: '⚡' },
                      { value: 'bounce', label: 'Bounce', emoji: '⬆' },
                      { value: 'glow', label: 'Glow', emoji: '✨' },
                      { value: 'shake', label: 'Shake', emoji: '📳' },
                      { value: 'swing', label: 'Swing', emoji: '🔔' },
                      { value: 'heartbeat', label: 'Beat', emoji: '❤️' },
                      { value: 'rubberBand', label: 'Rubber', emoji: '🪀' },
                      { value: 'tada', label: 'Tada', emoji: '🎉' },
                    ].map(anim => (
                      <button key={anim.value} type="button" onClick={() => handleChange('badgeAnimation', anim.value)}
                        className={`flex flex-col items-center gap-0.5 px-1 py-1.5 text-[9px] rounded border transition-colors ${
                          (formData.badgeAnimation || 'none') === anim.value
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'border-gray-200 text-gray-600 hover:bg-white'
                        }`}>
                        <span className="text-sm leading-none">{anim.emoji}</span>
                        <span>{anim.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Preview */}
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 mb-1">Preview</label>
                  <style>{`
                    @keyframes badge-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
                    @keyframes badge-flash { 0%, 50%, 100% { opacity: 1; } 25%, 75% { opacity: 0; } }
                    @keyframes badge-bounce { 0%, 100% { transform: translateY(0); } 30% { transform: translateY(-6px); } 50% { transform: translateY(0); } 70% { transform: translateY(-3px); } }
                    @keyframes badge-glow { 0%, 100% { box-shadow: 0 0 4px rgba(239,68,68,0.3); } 50% { box-shadow: 0 0 12px rgba(239,68,68,0.8), 0 0 20px rgba(239,68,68,0.4); } }
                    @keyframes badge-shake { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); } 20%, 40%, 60%, 80% { transform: translateX(2px); } }
                    @keyframes badge-swing { 0%, 100% { transform: rotate(0deg); } 20% { transform: rotate(12deg); } 40% { transform: rotate(-8deg); } 60% { transform: rotate(4deg); } 80% { transform: rotate(-4deg); } }
                    @keyframes badge-heartbeat { 0%, 100% { transform: scale(1); } 14% { transform: scale(1.2); } 28% { transform: scale(1); } 42% { transform: scale(1.15); } 70% { transform: scale(1); } }
                    @keyframes badge-rubberBand { 0%, 100% { transform: scaleX(1) scaleY(1); } 30% { transform: scaleX(1.2) scaleY(0.8); } 40% { transform: scaleX(0.85) scaleY(1.15); } 50% { transform: scaleX(1.1) scaleY(0.9); } 65% { transform: scaleX(0.95) scaleY(1.05); } 75% { transform: scaleX(1.03) scaleY(0.97); } }
                    @keyframes badge-tada { 0%, 100% { transform: scale(1) rotate(0deg); } 10%, 20% { transform: scale(0.9) rotate(-3deg); } 30%, 50%, 70%, 90% { transform: scale(1.1) rotate(3deg); } 40%, 60%, 80% { transform: scale(1.1) rotate(-3deg); } }
                    .badge-anim-pulse { animation: badge-pulse 2s ease-in-out infinite; }
                    .badge-anim-flash { animation: badge-flash 1.5s ease-in-out infinite; }
                    .badge-anim-bounce { animation: badge-bounce 1.5s ease infinite; }
                    .badge-anim-glow { animation: badge-glow 2s ease-in-out infinite; }
                    .badge-anim-shake { animation: badge-shake 0.8s ease-in-out infinite; animation-delay: 2s; animation-iteration-count: 3; }
                    .badge-anim-swing { animation: badge-swing 1.5s ease-in-out infinite; transform-origin: top center; }
                    .badge-anim-heartbeat { animation: badge-heartbeat 1.5s ease-in-out infinite; }
                    .badge-anim-rubberBand { animation: badge-rubberBand 1.2s ease infinite; }
                    .badge-anim-tada { animation: badge-tada 1.5s ease infinite; }
                  `}</style>
                  <div className="flex items-center gap-2 p-3 bg-white rounded border border-gray-200"
                    style={{
                      flexDirection: (formData.badgePosition || 'right') === 'above' || (formData.badgePosition || 'right') === 'below' ? 'column' : 'row',
                      alignItems: 'center',
                    }}>
                    {['left', 'above'].includes(formData.badgePosition || 'right') && (
                      <span className={formData.badgeAnimation && formData.badgeAnimation !== 'none' ? `badge-anim-${formData.badgeAnimation}` : ''} style={{
                        color: formData.badgeColor || '#ef4444', backgroundColor: formData.badgeBgColor || '#fef2f2',
                        fontSize: formData.badgeFontSize || '10px', fontWeight: formData.badgeFontWeight || '600',
                        fontStyle: formData.badgeFontStyle || 'normal', textTransform: formData.badgeTextTransform || 'none',
                        letterSpacing: formData.badgeLetterSpacing || undefined,
                        paddingTop: formData.badgePaddingTop || '2px', paddingRight: formData.badgePaddingRight || '8px',
                        paddingBottom: formData.badgePaddingBottom || '2px', paddingLeft: formData.badgePaddingLeft || '8px',
                        marginTop: formData.badgeMarginTop || '0px', marginRight: formData.badgeMarginRight || '0px',
                        marginBottom: formData.badgeMarginBottom || '0px', marginLeft: formData.badgeMarginLeft || '0px',
                        borderRadius: formData.badgeBorderRadius || '9999px', lineHeight: 1.4, whiteSpace: 'nowrap', display: 'inline-block',
                      }}>{formData.badge}</span>
                    )}
                    <span className="text-sm text-gray-700 font-medium">{formData.label || 'Menu Item'}</span>
                    {['right', 'below'].includes(formData.badgePosition || 'right') && (
                      <span className={formData.badgeAnimation && formData.badgeAnimation !== 'none' ? `badge-anim-${formData.badgeAnimation}` : ''} style={{
                        color: formData.badgeColor || '#ef4444', backgroundColor: formData.badgeBgColor || '#fef2f2',
                        fontSize: formData.badgeFontSize || '10px', fontWeight: formData.badgeFontWeight || '600',
                        fontStyle: formData.badgeFontStyle || 'normal', textTransform: formData.badgeTextTransform || 'none',
                        letterSpacing: formData.badgeLetterSpacing || undefined,
                        paddingTop: formData.badgePaddingTop || '2px', paddingRight: formData.badgePaddingRight || '8px',
                        paddingBottom: formData.badgePaddingBottom || '2px', paddingLeft: formData.badgePaddingLeft || '8px',
                        marginTop: formData.badgeMarginTop || '0px', marginRight: formData.badgeMarginRight || '0px',
                        marginBottom: formData.badgeMarginBottom || '0px', marginLeft: formData.badgeMarginLeft || '0px',
                        borderRadius: formData.badgeBorderRadius || '9999px', lineHeight: 1.4, whiteSpace: 'nowrap', display: 'inline-block',
                      }}>{formData.badge}</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <LabeledCheck label="Open in new tab" checked={formData.openInNewTab} onChange={(e) => handleChange('openInNewTab', e.target.checked)} />
            <LabeledCheck label="No Follow (SEO)" checked={formData.noFollow} onChange={(e) => handleChange('noFollow', e.target.checked)} description="Adds rel=nofollow to the link" />
          </div>
        </div>
      )}

      {/* ── Style Tab ───────────────────────────────────────────── */}
      {propsTab === 'style' && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">Per-item styling overrides. Leave blank to inherit from menu settings.</p>
          <div className="grid grid-cols-2 gap-3">
            <LabeledColor label="Text Color" value={getItemStyle('textColor')} onChange={(e) => setItemStyle('textColor', e.target.value)} />
            <LabeledColor label="Hover Text" value={getItemStyle('hoverTextColor')} onChange={(e) => setItemStyle('hoverTextColor', e.target.value)} />
            <LabeledColor label="Background" value={getItemStyle('backgroundColor')} onChange={(e) => setItemStyle('backgroundColor', e.target.value)} />
            <LabeledColor label="Hover BG" value={getItemStyle('hoverBackgroundColor')} onChange={(e) => setItemStyle('hoverBackgroundColor', e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <LabeledInput label="Font Size" value={getItemStyle('fontSize')} onChange={(e) => setItemStyle('fontSize', e.target.value)} placeholder="inherit" />
            <LabeledInput label="Font Weight" value={getItemStyle('fontWeight')} onChange={(e) => setItemStyle('fontWeight', e.target.value)} placeholder="inherit" />
            <LabeledInput label="Font Family" value={getItemStyle('fontFamily')} onChange={(e) => setItemStyle('fontFamily', e.target.value)} placeholder="inherit" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <LabeledInput label="Letter Spacing" value={getItemStyle('letterSpacing')} onChange={(e) => setItemStyle('letterSpacing', e.target.value)} placeholder="inherit" />
            <LabeledSelect label="Text Transform" value={getItemStyle('textTransform') || ''} onChange={(e) => setItemStyle('textTransform', e.target.value)}
              options={[{ value: '', label: 'Inherit' }, { value: 'none', label: 'None' }, { value: 'uppercase', label: 'Uppercase' }, { value: 'lowercase', label: 'Lowercase' }, { value: 'capitalize', label: 'Capitalize' }]} />
            <LabeledInput label="Padding" value={getItemStyle('padding')} onChange={(e) => setItemStyle('padding', e.target.value)} placeholder="inherit" />
          </div>
          <LabeledInput label="Border Radius" value={getItemStyle('borderRadius')} onChange={(e) => setItemStyle('borderRadius', e.target.value)} placeholder="0" />
          <LabeledInput label="Custom CSS Class" value={getItemStyle('customClass')} onChange={(e) => setItemStyle('customClass', e.target.value)} placeholder="my-item-class" />
        </div>
      )}

      {/* ── Mega Menu Tab ───────────────────────────────────────── */}
      {propsTab === 'mega' && (
        <div className="space-y-3">
          <LabeledCheck label="Enable Mega Menu" checked={getMega('enabled', false)} onChange={(e) => setMega('enabled', e.target.checked)}
            description="Replace dropdown with a full mega menu panel" />

          {getMega('enabled', false) && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <LabeledSelect label="Width" value={getMega('width', 'container')} onChange={(e) => setMega('width', e.target.value)}
                  options={[{ value: 'full-width', label: 'Full Width' }, { value: 'container', label: 'Container' }, { value: 'custom', label: 'Custom' }]} />
                {getMega('width') === 'custom' && (
                  <LabeledInput label="Custom Width" value={getMega('customWidth', '800px')} onChange={(e) => setMega('customWidth', e.target.value)} />
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <LabeledSelect label="Position" value={getMega('position', 'below-menu')} onChange={(e) => setMega('position', e.target.value)}
                  options={[{ value: 'below-item', label: 'Below Item' }, { value: 'below-menu', label: 'Below Menu Bar' }, { value: 'center', label: 'Centered' }]} />
                <LabeledSelect label="Columns" value={getMega('columns', 4)} onChange={(e) => setMega('columns', parseInt(e.target.value))}
                  options={[1,2,3,4,5,6].map(n => ({ value: n, label: `${n} Column${n>1?'s':''}` }))} />
              </div>
              <LabeledInput label="Column Widths" value={getMega('columnWidths', '')} onChange={(e) => setMega('columnWidths', e.target.value)} placeholder="25%,25%,25%,25%" />

              <CollapsibleSection title="Mega Menu Appearance" icon={Palette}>
                <div className="grid grid-cols-2 gap-3">
                  <LabeledColor label="Background" value={getMega('backgroundColor', '#ffffff')} onChange={(e) => setMega('backgroundColor', e.target.value)} />
                  <LabeledInput label="Padding" value={getMega('padding', '24px')} onChange={(e) => setMega('padding', e.target.value)} />
                </div>
                <LabeledInput label="Background Image" value={getMega('backgroundImage', '')} onChange={(e) => setMega('backgroundImage', e.target.value)} placeholder="https://..." />
                {getMega('backgroundImage') && (
                  <div className="grid grid-cols-2 gap-3">
                    <LabeledSelect label="BG Size" value={getMega('backgroundSize', 'cover')} onChange={(e) => setMega('backgroundSize', e.target.value)}
                      options={[{ value: 'cover', label: 'Cover' }, { value: 'contain', label: 'Contain' }, { value: 'auto', label: 'Auto' }]} />
                    <LabeledInput label="BG Position" value={getMega('backgroundPosition', 'center')} onChange={(e) => setMega('backgroundPosition', e.target.value)} />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <LabeledInput label="Border Radius" value={getMega('borderRadius', '8px')} onChange={(e) => setMega('borderRadius', e.target.value)} />
                  <LabeledInput label="Box Shadow" value={getMega('boxShadow', '0 10px 40px rgba(0,0,0,0.12)')} onChange={(e) => setMega('boxShadow', e.target.value)} />
                </div>
              </CollapsibleSection>

              <CollapsibleSection title="Mega Menu Animation" icon={ArrowRight}>
                <div className="grid grid-cols-2 gap-3">
                  <LabeledSelect label="Animation" value={getMega('animation', 'fade')} onChange={(e) => setMega('animation', e.target.value)}
                    options={[{ value: 'none', label: 'None' }, { value: 'fade', label: 'Fade' }, { value: 'slide-down', label: 'Slide Down' },
                      { value: 'slide-up', label: 'Slide Up' }, { value: 'grow', label: 'Grow' }, { value: 'zoom', label: 'Zoom' }]} />
                  <LabeledInput label="Duration" value={getMega('animationDuration', '200ms')} onChange={(e) => setMega('animationDuration', e.target.value)} />
                </div>
              </CollapsibleSection>

              <Button onClick={() => onOpenMegaMenu()} variant="outline" className="w-full">
                <LayoutGrid size={16} className="mr-2" /> Design Mega Menu Content
              </Button>
            </>
          )}
        </div>
      )}

      {/* ── Visibility Tab ──────────────────────────────────────── */}
      {propsTab === 'visibility' && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">Control when this menu item is visible.</p>
          <CollapsibleSection title="Device Visibility" icon={Monitor} defaultOpen>
            <LabeledCheck label="Show on Desktop" checked={getVisibility('showOnDesktop')} onChange={(e) => setVisibility('showOnDesktop', e.target.checked)} />
            <LabeledCheck label="Show on Tablet" checked={getVisibility('showOnTablet')} onChange={(e) => setVisibility('showOnTablet', e.target.checked)} />
            <LabeledCheck label="Show on Mobile" checked={getVisibility('showOnMobile')} onChange={(e) => setVisibility('showOnMobile', e.target.checked)} />
          </CollapsibleSection>
          <CollapsibleSection title="User Visibility" icon={Eye} defaultOpen>
            <LabeledCheck label="Show to Logged-in Users" checked={getVisibility('showLoggedIn')} onChange={(e) => setVisibility('showLoggedIn', e.target.checked)} />
            <LabeledCheck label="Show to Logged-out Users" checked={getVisibility('showLoggedOut')} onChange={(e) => setVisibility('showLoggedOut', e.target.checked)} />
          </CollapsibleSection>
        </div>
      )}
    </div>
  );
};

export default MenuBuilder;
