const nextConfig = {
  serverExternalPackages: ['esbuild', 'isolated-vm'],
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
