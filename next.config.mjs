const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['esbuild', 'isolated-vm'],
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
