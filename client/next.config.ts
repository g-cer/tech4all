import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Il client comunica con l'API solo via HTTP: nessun modulo del back-end
  // viene importato, quindi non serve alcuna configurazione di webpack.
};

export default nextConfig;
