const express = require('express');
const { query, get, run } = require('../utils/db');

const router = express.Router();

// 提交评价
router.post('/', async (req, res) => {
  try {
    const userId = req.body.user_id || 1;
    const { merchant_id, overall_score, taste_score, environment_score, service_score, price_score, content, consume_amount } = req.body;
    
    // 插入评价
    const result = await run(`
      INSERT INTO reviews (target_type, target_id, user_id, overall_score, taste_score, environment_score, service_score, price_score, content, consume_amount)
      VALUES ('merchant', ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [merchant_id, userId, overall_score, taste_score, environment_score, service_score, price_score, content, consume_amount]);
    
    // 更新商家评分
    const scores = await get(`
      SELECT AVG(overall_score) as avg_score,
        AVG(taste_score) as avg_taste,
        AVG(environment_score) as avg_environment,
        AVG(service_score) as avg_service,
        AVG(price_score) as avg_price,
        COUNT(*) as review_count
      FROM reviews
      WHERE target_type = 'merchant' AND target_id = ? AND status = 1
    `, [merchant_id]);
    
    await run(`
      UPDATE merchants 
      SET review_avg_score = ?, score_taste = ?, score_environment = ?, score_service = ?, score_price = ?, review_count = ?
      WHERE id = ?
    `, [
      parseFloat(scores.avg_score).toFixed(1),
      parseFloat(scores.avg_taste).toFixed(1),
      parseFloat(scores.avg_environment).toFixed(1),
      parseFloat(scores.avg_service).toFixed(1),
      parseFloat(scores.avg_price).toFixed(1),
      scores.review_count,
      merchant_id
    ]);
    
    res.json({ code: 200, message: '评价提交成功', data: { review_id: result.id } });
    
  } catch (error) {
    console.error('提交评价错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 获取评价列表
router.get('/', async (req, res) => {
  try {
    const { merchant_id, user_id, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let sql = `
      SELECT r.*, u.nickname, u.avatar_url, m.name as merchant_name
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN merchants m ON r.target_id = m.id
      WHERE r.status = 1
    `;
    const params = [];
    
    if (merchant_id) {
      sql += ' AND r.target_type = \'merchant\' AND r.target_id = ?';
      params.push(merchant_id);
    }
    
    if (user_id) {
      sql += ' AND r.user_id = ?';
      params.push(user_id);
    }
    
    sql += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const reviews = await query(sql, params);
    
    res.json({ code: 200, data: reviews });
    
  } catch (error) {
    console.error('获取评价列表错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;
