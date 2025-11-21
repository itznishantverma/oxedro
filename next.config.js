/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    serverActions: true,
  },

  // Transpile problematic packages that ship JSX/ESM for SSR builds
  // Adjust this list depending on which packages you import in your dashboard.
  // Common culprits: icon libs (lucide-react, react-feather), some css-in-js libs, or
  // packages that publish ESM with JSX.
  transpilePackages: [
    'lucide-react',
    '@supabase/realtime-js',
    '@supabase/supabase-js'
    // add more package names here if you find others in the failing stack
  ],

  // If you suspect SWC minifier issues, disabling it can help diagnose
  swcMinify: false,

  async headers() {
    return [
      {
        source: '/dashboard/:path*',
        headers: [
          {
            key: 'x-middleware-cache',
            value: 'no-cache',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
