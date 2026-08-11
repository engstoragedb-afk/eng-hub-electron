export default {
  BACKEND_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL === '/api' 
    ? 'http://127.0.0.1:3012/api' 
    : (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3012/api')
};