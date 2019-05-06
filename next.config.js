module.exports = () => {
  const rehypePrism = require('@mapbox/rehype-prism')
  const bundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: !!process.env.BUNDLE_ANALYZE
  })
  const remarkCapitalize = require('remark-capitalize')
  const withMdx = require('@next/mdx')({
    options: {
      mdPlugins: [remarkCapitalize],
      hastPlugins: [rehypePrism]
    }
  })

  return bundleAnalyzer(
    withMdx({
      target: 'serverless',
      experimental: {
        flyingShuttle: true
        // ampBindInitData: true,
      },
      webpack(cfg, { dev, isServer }) {
        const originalEntry = cfg.entry
        cfg.entry = async () => {
          const entries = { ...(await originalEntry()) }
          // This is how we add polyfills (for IE 11)
          if (!isServer) {
            entries['main.js'] = [
              './client/bootstrap.js',
              ...entries['main.js']
            ]
          }

          // This script imports components from the Next app, so it's transpiled to `.next/server/scripts/build-rss.js`
          if (isServer && !dev) {
            entries['./scripts/build-rss.js'] = './scripts/build-rss.js'
          }
          return entries
        }

        // Exclude SSR packages
        if (!isServer) {
          cfg.externals = [
            ...(cfg.externals || []),
            {
              cookie: 'cookie',
              http: 'http',
              https: 'https',
              'node-fetch': 'node-fetch',
              'feature-policy': 'feature-policy',
              helmet: 'helmet'
            }
          ]
        }

        cfg.output.publicPath = '/_next/'

        return cfg
      },

      // For the CDN support, check the server/index.js
      // We are using a PRIVATE Next.js API for that.
      assetPrefix: ''
    })
  )
}
