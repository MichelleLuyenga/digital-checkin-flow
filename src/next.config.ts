import withPWA from '@ducanh2912/next-pwa';

const nextConfig = {
  // Moved from experimental.serverComponentsExternalPackages
  serverExternalPackages: ['@supabase/supabase-js'],

  // Tell Next.js 16 to use webpack instead of Turbopack (required for PWA plugin)
  webpack: (config: any) => config,

  // PWA configuration
  ...withPWA({
    dest: 'public',
    disable: process.env.NODE_ENV === 'development',
    register: true,
    skipWaiting: true,
  }),
};

export default nextConfig;