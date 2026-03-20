import axios from 'axios';
import { supabase } from './supabaseClient';

// In public mode (VITE_API_URL='proxy'), API calls use relative URLs
// which get forwarded by Vite's proxy to the local backend.
// In local mode, they go directly to localhost:8000.
const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL;
  if (url === 'proxy') {
    return ''; // use relative path so Vite proxies it
  }
  return url || 'http://localhost:8000';
};

export const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 60000, // 60s for LLM generation
});

// Add a request interceptor to inject the user ID if logged in
api.interceptors.request.use(
  async (config) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        config.headers['x-user-id'] = session.user.id;
      }
    } catch (e) {
      console.warn("Failed to get session for API interceptor:", e);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
