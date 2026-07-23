/// <reference types="vite/client" />

declare module 'virtual:pwa-register/react' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function useRegisterSW(options?: any): {
    needRefresh: [boolean, () => void]
    offlineReady: [boolean, () => void]
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>
  }
}
