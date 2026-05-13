import withPWA from '@ducanh2912/next-pwa';

const pwaConfig = withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
} as any);   // <-- cast away the incomplete type

const nextConfig = {
  serverExternalPackages: ['@supabase/supabase-js'],
  webpack: (config: any) => config,
  ...pwaConfig,
};

export default nextConfig;