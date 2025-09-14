// Global type declarations for Tauri and other window properties

interface TauriObject {
  invoke: (command: string, args?: unknown) => Promise<unknown>;
  event: {
    listen: (event: string, handler: (event: unknown) => void) => Promise<void>;
    emit: (event: string, payload?: unknown) => Promise<void>;
  };
}

declare global {
  interface Window {
    __TAURI__?: TauriObject;
  }
}

export {};
