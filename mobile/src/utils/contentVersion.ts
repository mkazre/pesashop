import AsyncStorage from "@react-native-async-storage/async-storage";
import { settingsAPI } from "@/services/api";

const STORAGE_KEY = "mobileContentVersion";

type Listener = () => void;
const listeners: Listener[] = [];

// Modules that keep admin-managed content in memory for the life of the JS
// session (e.g. AppDrawer's drawer-menu cache) register a callback here to
// clear it when the admin bumps mobileContentVersion via the "Refresh
// Mobile App Content" button in Settings. Without this, backgrounding the
// app (not force-quitting it) keeps the JS engine — and any in-memory
// cache — alive indefinitely, so a content change made while the app is
// merely backgrounded would never show up on resume.
export function onContentRefresh(listener: Listener) {
  listeners.push(listener);
  return () => {
    const i = listeners.indexOf(listener);
    if (i !== -1) listeners.splice(i, 1);
  };
}

// Call on app launch and on every background→active resume. Cheap — rides
// along on the public settings payload rather than a dedicated endpoint.
export async function syncContentVersion() {
  try {
    const res = await settingsAPI.getPublic();
    const serverVersion = res.data?.data?.mobileContentVersion;
    if (serverVersion == null) return;

    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored !== null && Number(stored) !== serverVersion) {
      listeners.forEach((l) => {
        try {
          l();
        } catch {}
      });
    }
    await AsyncStorage.setItem(STORAGE_KEY, String(serverVersion));
  } catch {
    // Offline or request failed — keep whatever's cached rather than blocking startup.
  }
}
