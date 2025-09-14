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

export const isTauri = () => {
  return typeof window !== "undefined" && window.__TAURI__ !== undefined;
};

export const getEnvironment = (): "tauri" | "web" => {
  return isTauri() ? "tauri" : "web";
};
