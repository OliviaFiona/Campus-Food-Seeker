// 后端 API 根地址，留空表示同源（与前端同一域名）
// 部署到 GitHub Pages 时由 CI 注入，如：https://your-backend.fly.dev
window.API_BASE_URL = window.API_BASE_URL || '';
window.apiUrl = function(path) {
  return (window.API_BASE_URL || '') + path;
};

// 静态部署时（如 GitHub Pages）设为绝对路径如 '/Campus-Food-Seeker/pages/'，同源 Express 时留空
// 必须用绝对路径，否则在 .../pages/login.html 下会解析成 .../pages/pages/home.html
window.APP_BASE_PATH = window.APP_BASE_PATH || '';
window.toPage = function(path) {
  var m = path.match(/^\/merchant\/(\d+)$/);
  if (m) return window.APP_BASE_PATH ? window.APP_BASE_PATH + 'merchant-detail.html?id=' + m[1] : path;
  var p = path.replace(/^\//, '') || 'login';
  if (p === 'login') p = 'login.html';
  else if (p.indexOf('.html') === -1) p = p + '.html';
  if (window.APP_BASE_PATH) return window.APP_BASE_PATH + p;
  return path === '/' || !path ? '/' : '/' + path.replace(/^\//, '');
};
