declare global {
  interface Window {
    ml?: (...args: any[]) => void;
  }
}

export {};