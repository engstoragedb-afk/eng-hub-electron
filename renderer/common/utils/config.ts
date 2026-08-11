export default {
  BACKEND_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL === '/api' 
    ? 'https://d0f2-2404-c0-d001-b4b9-1b2-b826-9f6b-889f.ngrok-free.app/api' 
    : (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://d0f2-2404-c0-d001-b4b9-1b2-b826-9f6b-889f.ngrok-free.app/api')
};