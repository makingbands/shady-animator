declare global {
  interface Window {
    __uiLastOutput?: any;
    __lastRegion?: { x: number; y: number; width: number; height: number };
  }
}

export {};
