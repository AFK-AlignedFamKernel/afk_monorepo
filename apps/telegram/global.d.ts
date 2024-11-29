// global.d.ts
export {};

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    Telegram?: {
      WebApp: {
        initData?: string;
        initDataUnsafe?: Record<string, unknown>;
        close(): void;
        ready(): void;
        expand(): void;
        onEvent(eventType: string, callback: () => void): void;
        offEvent(eventType: string, callback: () => void): void;
        sendData(data: string): void;
        MainButton: {
          setText(text: string): void;
          show(): void;
          hide(): void;
          enable(): void;
          disable(): void;
        };
        [key: string]: any; // Allow other potential properties
      };
    };
  }
}
