const express = require('express');
const { query, get, run } = require('../utils/db');

const router = express.Router();

// 获取用户信息
router.get('/profile', async (req, res) => {
  try {
    const userId = req.query.user_id || 1; // 临时使用，实际应该从token获取
    
    const user = await get(`
      SELECT u.*, uni.short_name as university_name, c.name as campus_name
      FROM users u
      LEFT JOIN universities uni ON u.university_id = uni.id
      LEFT JOIN campuses c ON u.campus_id = c.id
      WHERE u.id = ?
    `, [userId]);
    
    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在' });
    }
    
    // 移除敏感信息
    delete user.password;
    
    res.json({ code: 200, data: user });
    
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 获取用户收藏
router.get('/favorites', async (req, res) => {
  try {
    const userId = req.query.user_id || 1;
    
    const favorites = await query(`
      SELECT f.*, m.name as merchant_name, m.short_name, m.logo_url, 
        m.review_avg_score, m.price_per_person, m.realtime_status, m.queue_count,
        m.latitude, m.longitude, m.address
      FROM user_favorites f
      LEFT JOIN merchants m ON f.target_id = m.id
      WHERE f.user_id = ? AND f.target_type = 'merchant'
      ORDER BY f.created_at DESC
    `, [userId]);
    
    res.json({ code: 200, data: favorites });
    
  } catch (error) {
    console.error('获取用户收藏错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 添加/取消收藏
router.post('/favorites', async (req, res) => {
  try {
    const userId = req.body.user_id || 1;
    const { merchant_id, action } = req.body;
    
    if (action === 'remove') {
      await run(`
        DELETE FROM user_favorites 
        WHERE user_id = ? AND target_type = 'merchant' AND target_id = ?
      `, [userId, merchant_id]);
      
      // 更新商家收藏数
      await run(`
        UPDATE merchants SET favorite_count = favorite_count - 1 WHERE id = ?
      `, [merchant_id]);
      
      res.json({ code: 200, message: '取消收藏成功' });
    } else {
      // 检查是否已收藏
      const existing = await get(`
        SELECT id FROM user_favorites 
        WHERE user_id = ? AND target_type = 'merchant' AND target_id = ?
      `, [userId, merchant_id]);
      
      if (existing) {
        return res.json({ code: 200, message: '已经收藏过了' });
      }
      
      await run(`
        INSERT INTO user_favorites (user_id, target_type, target_id)
        VALUES (?, 'merchant', ?)
      `, [userId, merchant_id]);
      
      // 更新商家收藏数
      await run(`
        UPDATE merchants SET favorite_count = favorite_count + 1 WHERE id = ?
      `, [merchant_id]);
      
      res.json({ code: 200, message: '收藏成功' });
    }
    
  } catch (error) {
    console.error('操作收藏错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 获取浏览历史
router.get('/history', async (req, res) => {
  try {
    const userId = req.query.user_id || 1;
    
    // 这里简化处理，实际应该查询用户行为日志表
    const history = await query(`
      SELECT DISTINCT m.*
      FROM merchants m
      ORDER BY m.updated_at DESC
      LIMIT 20
    `);
    
    res.json({ code: 200, data: history });
    
  } catch (error) {
    console.error('获取浏览历史错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 更新用户信息
router.put('/profile', async (req, res) => {
  try {
    const userId = req.body.user_id || 1;
    const { nickname, avatar_url, university_id, campus_id } = req.body;
    
    await run(`
      UPDATE users 
      SET nickname = ?, avatar_url = ?, university_id = ?, campus_id = ?, updated_at = datetime('now')
      WHERE id = ?
    `, [nickname, avatar_url, university_id, campus_id, userId]);
    
    res.json({ code: 200, message: '更新成功' });
    
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;
