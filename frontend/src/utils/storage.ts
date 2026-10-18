// ============================================
// ລະບົບ PARKO — Safe LocalStorage Utility (ເຄື່ອງມືຈັດການ LocalStorage ແບບປອດໄພ)
// ຫໍ່ຫຸ້ມການເຮັດວຽກຂອງ LocalStorage ພ້ອມການຈັດການ JSON parsing ແລະ ຂໍ້ຜິດພາດ (Error Handling)
// ============================================

export const storage = {
  get<T>(key: string, defaultValue: T | null = null): T | null {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;
      return JSON.parse(item) as T;
    } catch {
      return (localStorage.getItem(key) as unknown as T) || defaultValue;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      if (typeof value === 'string') {
        localStorage.setItem(key, value);
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (e) {
      console.error(`Error saving to localStorage key "${key}":`, e);
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`Error removing from localStorage key "${key}":`, e);
    }
  },

  clear(): void {
    try {
      localStorage.clear();
    } catch (e) {
      console.error('Error clearing localStorage:', e);
    }
  },
};
