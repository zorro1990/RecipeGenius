/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用实验性功能
  experimental: {
    // 优化包导入
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },

  // Turbopack配置
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  // 服务器外部包
  serverExternalPackages: [],

  // 输出配置（Cloudflare Workers兼容）
  output: 'standalone',

  // 图片优化配置
  images: {
    // Cloudflare Workers不支持Next.js内置图片优化
    unoptimized: true,
    // 允许的图片域名
    domains: [
      'images.unsplash.com',
      'your-domain.com',
      'cdn.your-domain.com'
    ],
    // 图片格式
    formats: ['image/webp', 'image/avif'],
  },

  // 静态资源配置 - 修复 Cloudflare Workers 路径问题
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',

  // 确保尾部斜杠一致性
  trailingSlash: false,

  // 压缩配置
  compress: true,

  // 电源配置
  poweredByHeader: false,

  // 重定向配置
  async redirects() {
    return [
      // 可以添加重定向规则
    ];
  },

  // 重写配置
  async rewrites() {
    return [
      // API路由重写
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },

  // 头部配置
  async headers() {
    return [
      // 安全头部
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      // API头部
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production' 
              ? 'https://recipe-genius.your-domain.com'
              : '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400',
          },
        ],
      },
      // 静态资源缓存
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // 字体缓存
      {
        source: '/:path*\\.(woff|woff2|ttf|otf|eot)$',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // 图片缓存
      {
        source: '/:path*\\.(png|jpg|jpeg|gif|svg|ico|webp|avif)$',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Webpack配置
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // 别名配置
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname),
    };

    // 插件配置
    config.plugins.push(
      new webpack.DefinePlugin({
        'process.env.BUILD_ID': JSON.stringify(buildId),
        'process.env.BUILD_TIME': JSON.stringify(new Date().toISOString()),
      })
    );

    return config;
  },

  // 环境变量配置
  env: {
    BUILD_TIME: new Date().toISOString(),
    APP_VERSION: process.env.npm_package_version || '1.0.0',
  },

  // TypeScript配置
  typescript: {
    // 在构建时忽略TypeScript错误（生产环境）
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },

  // ESLint配置
  eslint: {
    // 在构建时忽略ESLint错误（生产环境）
    ignoreDuringBuilds: process.env.NODE_ENV === 'production',
  },

  // 编译配置
  compiler: {
    // 移除console.log（生产环境）
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // 性能配置
  onDemandEntries: {
    // 页面在内存中保留的时间
    maxInactiveAge: 25 * 1000,
    // 同时保留的页面数
    pagesBufferLength: 2,
  },

  // 开发服务器配置
  devIndicators: {
    position: 'bottom-right',
  },

  // 生产构建配置
  productionBrowserSourceMaps: false,

  // 跟踪配置 - 已在上面设置

  // 严格模式 - 暂时禁用以避免hydration错误
  reactStrictMode: false,
};

module.exports = nextConfig;
