const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use('/assets', express.static(path.join(__dirname, '../client/assets')));
app.use('/styles', express.static(path.join(__dirname, '../client/styles')));
app.use('/js', express.static(path.join(__dirname, '../client/js')));

// 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/merchants', require('./routes/merchants'));
app.use('/api/users', require('./routes/users'));
app.use('/api/regions', require('./routes/regions'));
app.use('/api/reviews', require('./routes/reviews'));

// 页面路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/login.html'));
});

app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/home.html'));
});

app.get('/merchant/:id', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/merchant-detail.html'));
});

app.get('/search', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/search.html'));
});

app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/profile.html'));
});

app.get('/merchant-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/pages/merchant-dashboard.html'));
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
});
