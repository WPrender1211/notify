// Dynamic API URL resolver for local development or Hostinger -> Render split hosting
export const getApiBaseUrl = () => {
  // 1. Built-in Production Backend URL (Render Live Backend)
  const PRODUCTION_BACKEND_URL = 'https://notify-uvff.onrender.com';

  // If running on localhost / development, check window or env, else default to live backend
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      if (window.__API_URL__) return window.__API_URL__.replace(/\/$/, '');
      if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL.replace(/\/$/, '');
      return '';
    }
  }

  return PRODUCTION_BACKEND_URL;
};

export const setApiBaseUrl = (url) => {
  if (typeof window !== 'undefined' && url) {
    localStorage.setItem('call_notify_api_url', url.trim().replace(/\/$/, ''));
  }
};
