// Curated Ionicons catalog — shared by admin (picker) and frontend (renderer).
// Keep entries tree-shakeable: each icon is statically imported so the bundle
// only grows by what's listed here.

import {
  // Commerce
  IoCart, IoBag, IoBagHandle, IoCard, IoCash, IoWallet, IoPricetag, IoPricetags,
  IoReceipt, IoStorefront, IoGift, IoTicket,
  // Wishlist / favorites
  IoHeart, IoStar, IoBookmark, IoRibbon,
  // Discovery / nav
  IoHome, IoSearch, IoCompass, IoGrid, IoList, IoMenu, IoAlbums,
  // Trust / quality
  IoShieldCheckmark, IoCheckmarkCircle, IoMedal, IoTrophy, IoSparkles,
  IoFlash, IoFlame, IoTrendingUp, IoStarSharp,
  // Logistics
  IoCube, IoCar, IoAirplane, IoBoat, IoBicycle, IoRocket, IoTimer, IoTime,
  // Communication
  IoMail, IoCall, IoChatbubble, IoChatbubbles, IoNotifications, IoMegaphone,
  IoShareSocial, IoSend, IoLogoWhatsapp,
  // Identity
  IoPerson, IoPeople, IoPersonCircle, IoLogIn, IoLogOut,
  // Location
  IoLocation, IoMap, IoNavigate, IoPin, IoEarth,
  // Security
  IoLockClosed, IoShield, IoKey,
  // Actions
  IoAdd, IoRemove, IoTrash, IoPencil, IoCopy, IoSave, IoDownload, IoCloudUpload,
  IoEye, IoEyeOff, IoCheckmark, IoClose, IoRefresh, IoSync, IoSettings,
  IoFunnel, IoOptions, IoSwapHorizontal, IoArrowForward, IoArrowBack,
  IoExpand, IoContract, IoFilter,
  // Content / media
  IoCamera, IoImage, IoImages, IoVideocam, IoMusicalNote, IoPlay, IoDocument,
  IoDocumentText, IoNewspaper, IoBook, IoLibrary, IoCalendar, IoBulb,
  // Feedback
  IoHappy, IoSad, IoThumbsUp, IoThumbsDown, IoHandLeft, IoHandRight,
  // Misc shop
  IoLeaf, IoNutrition, IoRestaurant, IoCafe, IoFastFood, IoColorPalette,
  IoConstruct, IoHardwareChip, IoGameController, IoFitness, IoFootball,
  IoShirt,
  // Help / info
  IoInformationCircle, IoHelpCircle, IoWarning, IoAlertCircle,
} from 'react-icons/io5';

/**
 * Each entry: { name, label, group, Component }.
 * `name` is the canonical id stored in the database (e.g. "cart").
 * `Component` is the React component. `label` is for the picker UI.
 * `group` lets the admin picker show categories.
 */
export const ICON_CATALOG = [
  // Commerce
  { name: 'cart', label: 'Cart', group: 'Commerce', Component: IoCart },
  { name: 'bag', label: 'Bag', group: 'Commerce', Component: IoBag },
  { name: 'bag-handle', label: 'Shopping Bag', group: 'Commerce', Component: IoBagHandle },
  { name: 'card', label: 'Credit Card', group: 'Commerce', Component: IoCard },
  { name: 'cash', label: 'Cash', group: 'Commerce', Component: IoCash },
  { name: 'wallet', label: 'Wallet', group: 'Commerce', Component: IoWallet },
  { name: 'pricetag', label: 'Price Tag', group: 'Commerce', Component: IoPricetag },
  { name: 'pricetags', label: 'Price Tags', group: 'Commerce', Component: IoPricetags },
  { name: 'receipt', label: 'Receipt', group: 'Commerce', Component: IoReceipt },
  { name: 'storefront', label: 'Storefront', group: 'Commerce', Component: IoStorefront },
  { name: 'gift', label: 'Gift', group: 'Commerce', Component: IoGift },
  { name: 'ticket', label: 'Ticket', group: 'Commerce', Component: IoTicket },

  // Favorites / quality
  { name: 'heart', label: 'Heart', group: 'Favorites', Component: IoHeart },
  { name: 'star', label: 'Star', group: 'Favorites', Component: IoStar },
  { name: 'star-sharp', label: 'Star (sharp)', group: 'Favorites', Component: IoStarSharp },
  { name: 'bookmark', label: 'Bookmark', group: 'Favorites', Component: IoBookmark },
  { name: 'ribbon', label: 'Ribbon', group: 'Favorites', Component: IoRibbon },

  // Navigation
  { name: 'home', label: 'Home', group: 'Navigation', Component: IoHome },
  { name: 'search', label: 'Search', group: 'Navigation', Component: IoSearch },
  { name: 'compass', label: 'Compass', group: 'Navigation', Component: IoCompass },
  { name: 'grid', label: 'Grid', group: 'Navigation', Component: IoGrid },
  { name: 'list', label: 'List', group: 'Navigation', Component: IoList },
  { name: 'menu', label: 'Menu', group: 'Navigation', Component: IoMenu },
  { name: 'albums', label: 'Albums', group: 'Navigation', Component: IoAlbums },

  // Trust / quality
  { name: 'shield-check', label: 'Verified Shield', group: 'Trust', Component: IoShieldCheckmark },
  { name: 'checkmark-circle', label: 'Checkmark Circle', group: 'Trust', Component: IoCheckmarkCircle },
  { name: 'medal', label: 'Medal', group: 'Trust', Component: IoMedal },
  { name: 'trophy', label: 'Trophy', group: 'Trust', Component: IoTrophy },
  { name: 'sparkles', label: 'Sparkles', group: 'Trust', Component: IoSparkles },
  { name: 'flash', label: 'Flash', group: 'Trust', Component: IoFlash },
  { name: 'flame', label: 'Flame', group: 'Trust', Component: IoFlame },
  { name: 'trending-up', label: 'Trending', group: 'Trust', Component: IoTrendingUp },

  // Logistics
  { name: 'cube', label: 'Box', group: 'Logistics', Component: IoCube },
  { name: 'car', label: 'Car', group: 'Logistics', Component: IoCar },
  { name: 'airplane', label: 'Airplane', group: 'Logistics', Component: IoAirplane },
  { name: 'boat', label: 'Boat', group: 'Logistics', Component: IoBoat },
  { name: 'bicycle', label: 'Bicycle', group: 'Logistics', Component: IoBicycle },
  { name: 'rocket', label: 'Rocket', group: 'Logistics', Component: IoRocket },
  { name: 'timer', label: 'Timer', group: 'Logistics', Component: IoTimer },
  { name: 'time', label: 'Clock', group: 'Logistics', Component: IoTime },

  // Communication
  { name: 'mail', label: 'Mail', group: 'Communication', Component: IoMail },
  { name: 'call', label: 'Phone', group: 'Communication', Component: IoCall },
  { name: 'chat', label: 'Chat', group: 'Communication', Component: IoChatbubble },
  { name: 'chats', label: 'Conversations', group: 'Communication', Component: IoChatbubbles },
  { name: 'notifications', label: 'Bell', group: 'Communication', Component: IoNotifications },
  { name: 'megaphone', label: 'Megaphone', group: 'Communication', Component: IoMegaphone },
  { name: 'share-social', label: 'Share', group: 'Communication', Component: IoShareSocial },
  { name: 'send', label: 'Send', group: 'Communication', Component: IoSend },
  { name: 'whatsapp', label: 'WhatsApp', group: 'Communication', Component: IoLogoWhatsapp },

  // People
  { name: 'person', label: 'Person', group: 'People', Component: IoPerson },
  { name: 'people', label: 'People', group: 'People', Component: IoPeople },
  { name: 'person-circle', label: 'Profile', group: 'People', Component: IoPersonCircle },
  { name: 'log-in', label: 'Log In', group: 'People', Component: IoLogIn },
  { name: 'log-out', label: 'Log Out', group: 'People', Component: IoLogOut },

  // Location
  { name: 'location', label: 'Location Pin', group: 'Location', Component: IoLocation },
  { name: 'map', label: 'Map', group: 'Location', Component: IoMap },
  { name: 'navigate', label: 'Navigate', group: 'Location', Component: IoNavigate },
  { name: 'pin', label: 'Pin', group: 'Location', Component: IoPin },
  { name: 'earth', label: 'Earth', group: 'Location', Component: IoEarth },

  // Security
  { name: 'lock', label: 'Lock', group: 'Security', Component: IoLockClosed },
  { name: 'shield', label: 'Shield', group: 'Security', Component: IoShield },
  { name: 'key', label: 'Key', group: 'Security', Component: IoKey },

  // Actions
  { name: 'add', label: 'Add', group: 'Actions', Component: IoAdd },
  { name: 'remove', label: 'Remove', group: 'Actions', Component: IoRemove },
  { name: 'trash', label: 'Trash', group: 'Actions', Component: IoTrash },
  { name: 'pencil', label: 'Pencil', group: 'Actions', Component: IoPencil },
  { name: 'copy', label: 'Copy', group: 'Actions', Component: IoCopy },
  { name: 'save', label: 'Save', group: 'Actions', Component: IoSave },
  { name: 'download', label: 'Download', group: 'Actions', Component: IoDownload },
  { name: 'upload', label: 'Upload', group: 'Actions', Component: IoCloudUpload },
  { name: 'eye', label: 'Eye', group: 'Actions', Component: IoEye },
  { name: 'eye-off', label: 'Eye Off', group: 'Actions', Component: IoEyeOff },
  { name: 'check', label: 'Check', group: 'Actions', Component: IoCheckmark },
  { name: 'close', label: 'Close', group: 'Actions', Component: IoClose },
  { name: 'refresh', label: 'Refresh', group: 'Actions', Component: IoRefresh },
  { name: 'sync', label: 'Sync', group: 'Actions', Component: IoSync },
  { name: 'settings', label: 'Settings', group: 'Actions', Component: IoSettings },
  { name: 'funnel', label: 'Filter', group: 'Actions', Component: IoFunnel },
  { name: 'options', label: 'Options', group: 'Actions', Component: IoOptions },
  { name: 'swap', label: 'Swap', group: 'Actions', Component: IoSwapHorizontal },
  { name: 'arrow-forward', label: 'Arrow →', group: 'Actions', Component: IoArrowForward },
  { name: 'arrow-back', label: '← Arrow', group: 'Actions', Component: IoArrowBack },
  { name: 'expand', label: 'Expand', group: 'Actions', Component: IoExpand },
  { name: 'contract', label: 'Contract', group: 'Actions', Component: IoContract },
  { name: 'filter', label: 'Filter (alt)', group: 'Actions', Component: IoFilter },

  // Media / content
  { name: 'camera', label: 'Camera', group: 'Media', Component: IoCamera },
  { name: 'image', label: 'Image', group: 'Media', Component: IoImage },
  { name: 'images', label: 'Images', group: 'Media', Component: IoImages },
  { name: 'video', label: 'Video', group: 'Media', Component: IoVideocam },
  { name: 'music', label: 'Music', group: 'Media', Component: IoMusicalNote },
  { name: 'play', label: 'Play', group: 'Media', Component: IoPlay },
  { name: 'document', label: 'Document', group: 'Media', Component: IoDocument },
  { name: 'document-text', label: 'Document Text', group: 'Media', Component: IoDocumentText },
  { name: 'newspaper', label: 'Newspaper', group: 'Media', Component: IoNewspaper },
  { name: 'book', label: 'Book', group: 'Media', Component: IoBook },
  { name: 'library', label: 'Library', group: 'Media', Component: IoLibrary },
  { name: 'calendar', label: 'Calendar', group: 'Media', Component: IoCalendar },
  { name: 'bulb', label: 'Idea', group: 'Media', Component: IoBulb },

  // Feedback / reactions
  { name: 'happy', label: 'Happy', group: 'Reactions', Component: IoHappy },
  { name: 'sad', label: 'Sad', group: 'Reactions', Component: IoSad },
  { name: 'thumbs-up', label: 'Thumbs Up', group: 'Reactions', Component: IoThumbsUp },
  { name: 'thumbs-down', label: 'Thumbs Down', group: 'Reactions', Component: IoThumbsDown },
  { name: 'hand-left', label: 'Hand ←', group: 'Reactions', Component: IoHandLeft },
  { name: 'hand-right', label: 'Hand →', group: 'Reactions', Component: IoHandRight },

  // Categories / lifestyle
  { name: 'leaf', label: 'Leaf', group: 'Lifestyle', Component: IoLeaf },
  { name: 'nutrition', label: 'Nutrition', group: 'Lifestyle', Component: IoNutrition },
  { name: 'restaurant', label: 'Restaurant', group: 'Lifestyle', Component: IoRestaurant },
  { name: 'cafe', label: 'Cafe', group: 'Lifestyle', Component: IoCafe },
  { name: 'fast-food', label: 'Fast Food', group: 'Lifestyle', Component: IoFastFood },
  { name: 'palette', label: 'Color Palette', group: 'Lifestyle', Component: IoColorPalette },
  { name: 'construct', label: 'Tools', group: 'Lifestyle', Component: IoConstruct },
  { name: 'hardware', label: 'Hardware', group: 'Lifestyle', Component: IoHardwareChip },
  { name: 'game', label: 'Game', group: 'Lifestyle', Component: IoGameController },
  { name: 'fitness', label: 'Fitness', group: 'Lifestyle', Component: IoFitness },
  { name: 'football', label: 'Football', group: 'Lifestyle', Component: IoFootball },
  { name: 'shirt', label: 'Shirt', group: 'Lifestyle', Component: IoShirt },

  // Help / info
  { name: 'info', label: 'Info', group: 'Help', Component: IoInformationCircle },
  { name: 'help', label: 'Help', group: 'Help', Component: IoHelpCircle },
  { name: 'warning', label: 'Warning', group: 'Help', Component: IoWarning },
  { name: 'alert', label: 'Alert', group: 'Help', Component: IoAlertCircle },
];

export const ICON_BY_NAME = Object.fromEntries(ICON_CATALOG.map((it) => [it.name, it]));

/**
 * Resolve an icon descriptor to its React component, or null if unknown.
 */
export function getIconComponent(name) {
  return ICON_BY_NAME[name]?.Component || null;
}

/**
 * Group icons for the picker UI ([{ group, items: [...] }, ...]).
 */
export function getCatalogByGroup() {
  const groups = new Map();
  for (const it of ICON_CATALOG) {
    if (!groups.has(it.group)) groups.set(it.group, []);
    groups.get(it.group).push(it);
  }
  return [...groups.entries()].map(([group, items]) => ({ group, items }));
}
