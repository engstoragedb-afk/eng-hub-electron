import { useState, useEffect } from 'react';

export function useSessionStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const item = window.sessionStorage.getItem(key);
      if (item) {
        try {
            setStoredValue(JSON.parse(item));
        } catch {
            setStoredValue(item as unknown as T);
        }
      }
    } catch (error) {
      console.warn(`Error reading sessionStorage key "${key}":`, error);
    }
  }, [key]);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        const item = typeof valueToStore === 'string' ? valueToStore : JSON.stringify(valueToStore);
        window.sessionStorage.setItem(key, item);
      }
    } catch (error) {
      console.warn(`Error setting sessionStorage key "${key}":`, error);
    }
  };

  if (!isMounted) {
    return [initialValue, setStoredValue] as const; 
  }

  return [storedValue, setValue] as const;
}
