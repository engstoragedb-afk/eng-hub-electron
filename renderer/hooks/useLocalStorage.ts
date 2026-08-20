import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  
  // Track if we've mounted to avoid hydration mismatch
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        // Only parse if it's not a primitive string that isn't JSON stringified
        // In previous code, some were just stored as raw strings e.g. "Semua"
        try {
            setStoredValue(JSON.parse(item));
        } catch {
            // If JSON.parse fails, assume it's a raw string
            setStoredValue(item as unknown as T);
        }
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    }
  }, [key]);

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        const item = typeof valueToStore === 'string' ? valueToStore : JSON.stringify(valueToStore);
        window.localStorage.setItem(key, item);
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  // If we haven't mounted yet, return initial value to avoid hydration mismatch
  if (!isMounted) {
    return [initialValue, setStoredValue] as const; 
  }

  return [storedValue, setValue] as const;
}
