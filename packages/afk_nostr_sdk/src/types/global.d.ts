declare global {
  interface Window {
    localStorage: Storage;
    sessionStorage: Storage;
  }
}

export {}; 