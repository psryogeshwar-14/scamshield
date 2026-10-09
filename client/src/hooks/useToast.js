import { useContext } from 'react';
import { ToastContext } from '../context/ToastContext';

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      addToast: (msg) => {
        if (typeof console !== 'undefined') {
          console.log('[Toast]', msg);
        }
      },
      removeToast: () => {},
    };
  }
  return context;
}

export default useToast;
