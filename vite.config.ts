import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

function imageProxyPlugin(): Plugin {
  return {
    name: 'image-proxy-plugin',
    configureServer(server) {
      server.middlewares.use('/api/proxy-image', async (req, res) => {
        try {
          const urlObj = new URL(req.url || '', 'http://localhost:3000');
          const targetUrl = urlObj.searchParams.get('url');
          if (!targetUrl) {
            res.statusCode = 400;
            res.end('Missing target url');
            return;
          }

          let referer = '';
          const lower = targetUrl.toLowerCase();
          if (lower.includes('zhihu.com') || lower.includes('zhimg.com')) {
            referer = 'https://www.zhihu.com/';
          } else if (lower.includes('sinaimg.cn') || lower.includes('weibo.com')) {
            referer = 'https://weibo.com/';
          } else if (lower.includes('qpic.cn') || lower.includes('weixin.qq.com')) {
            referer = 'https://mp.weixin.qq.com/';
          } else if (lower.includes('baidu.com') || lower.includes('bdstatic.com')) {
            referer = 'https://www.baidu.com/';
          } else if (lower.includes('doubanio.com') || lower.includes('douban.com')) {
            referer = 'https://www.douban.com/';
          } else if (lower.includes('csdnimg.cn') || lower.includes('csdn.net')) {
            referer = 'https://blog.csdn.net/';
          } else if (lower.includes('bilibili.com') || lower.includes('hdslb.com')) {
            referer = 'https://www.bilibili.com/';
          }

          const headers: Record<string, string> = {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          };
          if (referer) {
            headers['Referer'] = referer;
          }

          const response = await fetch(targetUrl, { headers });
          if (!response.ok) {
            res.statusCode = response.status;
            res.end(`Proxy failed with ${response.status}`);
            return;
          }

          res.setHeader('Content-Type', response.headers.get('content-type') || 'image/jpeg');
          res.setHeader('Cache-Control', 'public, max-age=86400');
          res.setHeader('Access-Control-Allow-Origin', '*');

          const arrayBuffer = await response.arrayBuffer();
          res.end(Buffer.from(arrayBuffer));
        } catch (err: any) {
          res.statusCode = 500;
          res.end(err.message || 'Internal proxy error');
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), imageProxyPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
