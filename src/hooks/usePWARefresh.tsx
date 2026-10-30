import { useState, useEffect } from 'react';

export function usePWARefresh() {
  const [promptVisible, setPromptVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    // Listen for controllerchange - new SW took control
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (navigator.serviceWorker.controller) {
        setPromptVisible(true);
      }
    });

    // Listen for messages from the SW
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
        setPromptVisible(true);
      }
    };
    navigator.serviceWorker.addEventListener('message', handleMessage);

    // Poll for updates periodically
    const interval = setInterval(() => {
      navigator.serviceWorker.ready.then(reg => {
        if (reg.waiting || reg.installing) {
          setPromptVisible(true);
        }
      }).catch(() => {});
    }, 30000);

    return () => {
      clearInterval(interval);
      navigator.serviceWorker.removeEventListener('controllerchange', () => {});
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);

  const doRefresh = () => {
    navigator.serviceWorker.ready.then(reg => {
      if (reg.waiting) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      window.location.reload(true);
    });
    setPromptVisible(false);
  };

  const dismiss = () => setPromptVisible(false);

  return { promptVisible, doRefresh, dismiss };
}