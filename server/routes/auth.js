const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { get } = require('../utils/db');

const router = express.Router();
const JWT_SECRET = 'campus-food-secret-key-2026'; // 实际生产环境应该使用环境变量

// 登录
router.post('/login', async (req, res) => {
  try {
    const { phone, password, userType } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ code: 400, message: '手机号和密码不能为空' });
    }

    // 查询用户
    const user = await get('SELECT * FROM users WHERE phone = ?', [phone]);

    if (!user) {
      return res.status(401).json({ code: 401, message: '用户不存在' });
    }

    // 验证用户类型
    if (userType && user.user_type !== parseInt(userType)) {
      return res.status(401).json({ code: 401, message: '用户类型不匹配' });
    }

    // 验证密码
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ code: 401, message: '密码错误' });
    }

    // 生成token
    const token = jwt.sign(
      { userId: user.id, userType: user.user_type },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 返回用户信息
    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          nickname: user.nickname,
          avatar_url: user.avatar_url,
          phone: user.phone,
          user_type: user.user_type,
          university_id: user.university_id,
          points: user.points
        }
      }
    });

  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 注册
router.post('/register', async (req, res) => {
  try {
    const { phone, password, nickname, userType = 1, universityId } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ code: 400, message: '手机号和密码不能为空' });
    }

    // 检查用户是否已存在
    const existingUser = await get('SELECT id FROM users WHERE phone = ?', [phone]);
    if (existingUser) {
      return res.status(400).json({ code: 400, message: '该手机号已注册' });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const { run } = require('../utils/db');
    const result = await run(
      'INSERT INTO users (phone, password, nickname, user_type, university_id) VALUES (?, ?, ?, ?, ?)',
      [phone, hashedPassword, nickname || `用户${phone.slice(-4)}`, userType, universityId || 1]
    );

    res.json({
      code: 200,
      message: '注册成功',
      data: { userId: result.id }
    });

  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 验证token
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ code: 401, message: '未提供token' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await get('SELECT id, nickname, avatar_url, phone, user_type, university_id, points FROM users WHERE id = ?', [decoded.userId]);

    if (!user) {
      return res.status(401).json({ code: 401, message: '用户不存在' });
    }

    res.json({ code: 200, data: { user } });

  } catch (error) {
    res.status(401).json({ code: 401, message: 'token无效' });
  }
});

module.exports = router;
