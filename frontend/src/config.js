// Dynamic API URL resolver for local development or Hostinger -> Render split hosting
export const getApiBaseUrl = () => {
  // 1. Check window global config (can be set in index.html on Hostinger)
  if (typeof window !== 'undefined' && window.__API_URL__) {
    return window.__API_URL__.replace(/\/$/, '');
  }

  // 2. Check localStorage override
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('call_notify_api_url');
    if (saved) return saved.replace(/\/$/, '');
  }

  // 3. Check Vite Environment variable
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  }

  // 4. Default to same origin (local or all-in-one deploy)
  return '';
};

export const setApiBaseUrl = (url) => {
  if (typeof window !== 'undefined') {
    if (url) {
      localStorage.setItem('call_notify_api_url', url.trim().replace(/\/$/, ''));
    } else {
      localStorage.removeItem('call_notify_api_url');
    }
  }
};
