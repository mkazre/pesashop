export interface ToastPayload {
  id: string;
  title: string;
  body: string;
  image?: string;
  icon?: string;
  type?: string;
  actionUrl?: string;
  actionLabel?: string;
}

type Listener = (payload: ToastPayload) => void;

const listeners = new Set<Listener>();

export const notificationBus = {
  emit(payload: ToastPayload) {
    listeners.forEach((fn) => {
      try {
        fn(payload);
      } catch {}
    });
  },
  subscribe(fn: Listener) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
};
