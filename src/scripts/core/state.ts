/**
 * BOVI State Management Utilities
 * Simple reactive state management
 */

/**
 * State management interface
 */
interface StateManager<T = any> {
  get(): T;
  get<K extends keyof T>(key: K): T[K];
  set<K extends keyof T>(key: K, value: T[K]): void;
  update(updates: Partial<T>): void;
  subscribe(fn: <K extends keyof T>(key: K, value: T[K], oldValue: T[K]) => void): () => void;
}

/**
 * State management utilities
 */
export const state = {
  create: <T extends Record<string, any>>(initialState: T = {} as T): StateManager<T> => {
    const _state = { ...initialState };
    const listeners = new Set<(key: keyof T, value: any, oldValue: any) => void>();
    
    const manager: StateManager<T> = {
      get: <K extends keyof T>(key?: K): any => {
        return key ? _state[key] : { ..._state };
      },
      set: <K extends keyof T>(key: K, value: T[K]): void => {
        const oldValue = _state[key];
        _state[key] = value;
        listeners.forEach(fn => fn(key, value, oldValue));
      },
      update: (updates: Partial<T>): void => {
        Object.entries(updates).forEach(([key, value]) => {
          const oldValue = _state[key as keyof T];
          _state[key as keyof T] = value;
          listeners.forEach(fn => fn(key as keyof T, value, oldValue));
        });
      },
      subscribe: (fn: <K extends keyof T>(key: K, value: T[K], oldValue: T[K]) => void): (() => void) => {
        listeners.add(fn);
        return () => listeners.delete(fn);
      }
    };
    
    return manager;
  }
};