import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ui-avatars.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "5001",
      },
    ],
  },
  async rewrites() {
    // Determine the backend URL to proxy to. 
    // In production, NEXT_PUBLIC_API_URL should be set to '/api' on Vercel so the frontend calls itself,
    // and BACKEND_API_URL should be the actual Heroku app URL.
    const backendUrl = process.env.BACKEND_API_URL 
      ? process.env.BACKEND_API_URL.replace(/\/api$/, '') 
      : "https://employme-e4d1ca106e85.herokuapp.com";

    // Only enable proxying if NEXT_PUBLIC_API_URL is set to a relative path
    const isProxyEnabled = process.env.NEXT_PUBLIC_API_URL?.startsWith('/');
    
    if (isProxyEnabled) {
      return [
        {
          source: "/api/:path*",
          destination: `${backendUrl}/api/:path*`,
        },
        {
          source: "/socket.io/:path*",
          destination: `${backendUrl}/socket.io/:path*`,
        },
      ];
    }
    
    return [];
  },
};

export default nextConfig;
