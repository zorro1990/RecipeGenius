// OpenNext配置文件 - 优化 Cloudflare Workers 静态资源处理
const config = {
  default: {
    override: {
      wrapper: "cloudflare-node",
      converter: "edge",
      proxyExternalRequest: "fetch",
      incrementalCache: "dummy",
      tagCache: "dummy",
      queue: "dummy",
    },
  },
  edgeExternals: ["node:crypto"],
  middleware: {
    external: true,
    override: {
      wrapper: "cloudflare-edge",
      converter: "edge",
      proxyExternalRequest: "fetch",
      incrementalCache: "dummy",
      tagCache: "dummy",
      queue: "dummy",
    },
  },
  // 静态资源处理配置
  buildCommand: "npm run build",
  // 确保静态文件正确处理
  experimental: {
    disableIncrementalCache: true,
  },
};

export default config;
