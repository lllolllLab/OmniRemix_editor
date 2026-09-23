import { EditorFile } from '../types';

export const SAMPLE_HTML_GALLERY = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OmniRemix 智能画廊</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", sans-serif;
      background: #0f172a;
      color: #f8fafc;
      padding: 1.5rem 1rem;
      min-height: 100vh;
    }
    .hero {
      text-align: center;
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9));
      border-radius: 1rem;
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.35rem 0.85rem;
      background: rgba(14, 165, 233, 0.15);
      color: #38bdf8;
      border: 1px solid rgba(14, 165, 233, 0.3);
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 500;
      margin-bottom: 0.75rem;
    }
    .hero h1 {
      font-size: 1.75rem;
      font-weight: 700;
      letter-spacing: -0.025em;
      margin-bottom: 0.5rem;
      background: linear-gradient(to right, #ffffff, #94a3b8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero p {
      color: #94a3b8;
      font-size: 0.9rem;
      line-height: 1.5;
      max-width: 500px;
      margin: 0 auto;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1.25rem;
    }
    .card {
      background: #1e293b;
      border-radius: 0.85rem;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.06);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .card:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 20px -8px rgba(0, 0, 0, 0.4);
      border-color: rgba(56, 189, 248, 0.4);
    }
    .card-img-wrapper {
      position: relative;
      height: 150px;
      background: #0f172a;
      overflow: hidden;
    }
    .card-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.3s ease;
    }
    .card:hover .card-img {
      transform: scale(1.05);
    }
    .card-body {
      padding: 1rem;
    }
    .card-title {
      font-size: 1rem;
      font-weight: 600;
      color: #f1f5f9;
      margin-bottom: 0.35rem;
    }
    .card-desc {
      font-size: 0.8rem;
      color: #94a3b8;
      line-height: 1.4;
      margin-bottom: 0.85rem;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.45rem 0.9rem;
      background: #0284c7;
      color: white;
      border-radius: 0.5rem;
      font-size: 0.8rem;
      font-weight: 500;
      border: none;
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .btn:hover { background: #0369a1; }

    /* CSS 背景图示例 */
    .bg-custom {
      background-image: url('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&auto=format&fit=crop&q=80');
      background-size: cover;
      background-position: center;
    }

    .svg-banner {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      background: radial-gradient(circle at center, #1e1b4b 0%, #0f172a 100%);
    }
  </style>
</head>
<body>
  <div class="hero">
    <div class="badge">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      </svg>
      一体化 HTML 实时工作区
    </div>
    <h1>纯粹・快速・无缝预览</h1>
    <p>在一个窗口中编排结构、样式与脚本。侧边栏智能识别所有原生 SVG 矢量与图片资源，点击可双向跳转定位。</p>
  </div>

  <div class="grid">
    <!-- SVG 矢量图标卡片 -->
    <div class="card">
      <div class="card-img-wrapper svg-banner">
        <svg class="feature-icon" width="68" height="68" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
          <title>原生矢量几何罗盘</title>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      </div>
      <div class="card-body">
        <h3 class="card-title">原生 SVG 矢量提取</h3>
        <p class="card-desc">自动检测 HTML 内联 &lt;svg&gt;，在右侧图片栏直接可视化并高亮定位。</p>
        <button class="btn" onclick="sayHello('SVG 矢量')">查看矢量</button>
      </div>
    </div>

    <!-- 网络图片卡片 -->
    <div class="card">
      <div class="card-img-wrapper">
        <img class="card-img" src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80" alt="极光流彩" />
      </div>
      <div class="card-body">
        <h3 class="card-title">赛博流体色彩</h3>
        <p class="card-desc">高动态范围抽象艺术渲染，点击右侧图片栏可一键定位此行代码。</p>
        <button class="btn" onclick="sayHello('赛博流体')">查看交互</button>
      </div>
    </div>

    <!-- 优胜美地风景卡片 -->
    <div class="card">
      <div class="card-img-wrapper">
        <img class="card-img" src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80" alt="优胜美地自然风光" />
      </div>
      <div class="card-body">
        <h3 class="card-title">自然光影峡谷</h3>
        <p class="card-desc">高清自然实景抓拍，测试实时预览与响应式排版表现。</p>
        <button class="btn" onclick="sayHello('峡谷风景')">查看交互</button>
      </div>
    </div>

    <!-- CSS 背景图卡片 -->
    <div class="card">
      <div class="card-img-wrapper bg-custom">
      </div>
      <div class="card-body">
        <h3 class="card-title">CSS 背景图样例</h3>
        <p class="card-desc">此卡片背景图来自 CSS url() 属性，同样可被智能识别与定位。</p>
        <button class="btn" onclick="sayHello('CSS 样式图')">查看交互</button>
      </div>
    </div>

    <!-- 懒加载图片卡片 -->
    <div class="card">
      <div class="card-img-wrapper">
        <img class="card-img" data-src="https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80" src="https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80" alt="科技芯片" />
      </div>
      <div class="card-body">
        <h3 class="card-title">智能懒加载识别 (data-src)</h3>
        <p class="card-desc">支持智能识别各种懒加载属性、视频封面与脚本变量中的图片。</p>
        <button class="btn" onclick="sayHello('懒加载芯片')">查看交互</button>
      </div>
    </div>
  </div>

  <script>
    function sayHello(name) {
      console.log('OmniRemix 已触发：' + name);
    }
  </script>
</body>
</html>
`;

export const SAMPLE_HTML_CLEAN = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>新建网页</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      padding: 2rem;
      background: #fafafa;
      color: #222;
    }
  </style>
</head>
<body>
  <h1>Hello World</h1>
  <p>开始编写你的 HTML 文档...</p>
</body>
</html>
`;

export const INITIAL_FILES: EditorFile[] = [
  {
    id: 'sample-gallery',
    name: 'gallery.html',
    content: SAMPLE_HTML_GALLERY,
    isDirty: false,
    handle: null,
    createdAt: Date.now(),
  },
];
