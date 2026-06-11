import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "leanout.app" }],
        destination: "https://www.leanout.app/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
