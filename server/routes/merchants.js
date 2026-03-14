const express = require('express');
const { query, get, run } = require('../utils/db');

const router = express.Router();

// 获取附近商家
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, distance = 5000, type, price_min, price_max, scene } = req.query;
    
    // 使用子查询来支持距离计算和筛选
    let sql = `
      SELECT * FROM (
        SELECT m.*, u.short_name as university_name, r.name as region_name,
          (6371 * acos(cos(radians(?)) * cos(radians(m.latitude)) * cos(radians(m.longitude) - radians(?)) + sin(radians(?)) * sin(radians(m.latitude)))) AS distance
        FROM merchants m
        LEFT JOIN universities u ON m.university_id = u.id
        LEFT JOIN regions r ON m.region_id = r.id
        WHERE m.status = 1
    `;
    
    const params = [lat || 39.99, lng || 116.33, lat || 39.99];
    
    if (type) {
      sql += ' AND m.business_type = ?';
      params.push(type);
    }
    
    if (price_min) {
      sql += ' AND m.price_per_person >= ?';
      params.push(price_min);
    }
    
    if (price_max) {
      sql += ' AND m.price_per_person <= ?';
      params.push(price_max);
    }
    
    if (scene) {
      sql += ' AND m.scene_tags LIKE ?';
      params.push(`%${scene}%`);
    }
    
    sql += ') WHERE distance <= ? ORDER BY distance LIMIT 50';
    params.push(distance / 1000); // 转换为公里
    
    const merchants = await query(sql, params);
    
    // 解析JSON字段
    merchants.forEach(m => {
      try {
        m.cuisine_types = JSON.parse(m.cuisine_types || '[]');
        m.scene_tags = JSON.parse(m.scene_tags || '[]');
        m.feature_tags = JSON.parse(m.feature_tags || '[]');
        m.cover_images = JSON.parse(m.cover_images || '[]');
      } catch (e) {
        m.cuisine_types = [];
        m.scene_tags = [];
        m.feature_tags = [];
        m.cover_images = [];
      }
    });
    
    res.json({ code: 200, data: merchants });
    
  } catch (error) {
    console.error('获取附近商家错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 获取商家详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const merchant = await get(`
      SELECT m.*, u.short_name as university_name, r.name as region_name
      FROM merchants m
      LEFT JOIN universities u ON m.university_id = u.id
      LEFT JOIN regions r ON m.region_id = r.id
      WHERE m.id = ?
    `, [id]);
    
    if (!merchant) {
      return res.status(404).json({ code: 404, message: '商家不存在' });
    }
    
    // 解析JSON字段
    try {
      merchant.cuisine_types = JSON.parse(merchant.cuisine_types || '[]');
      merchant.scene_tags = JSON.parse(merchant.scene_tags || '[]');
      merchant.feature_tags = JSON.parse(merchant.feature_tags || '[]');
      merchant.cover_images = JSON.parse(merchant.cover_images || '[]');
      merchant.business_hours = JSON.parse(merchant.business_hours || '{}');
    } catch (e) {
      merchant.cuisine_types = [];
      merchant.scene_tags = [];
      merchant.feature_tags = [];
      merchant.cover_images = [];
      merchant.business_hours = {};
    }
    
    // 获取商家商品
    const products = await query(`
      SELECT * FROM products 
      WHERE merchant_id = ? AND status = 1 
      ORDER BY is_signature DESC, order_count_total DESC 
      LIMIT 20
    `, [id]);
    
    // 获取商家评价
    const reviews = await query(`
      SELECT r.*, u.nickname, u.avatar_url
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.target_type = 'merchant' AND r.target_id = ? AND r.status = 1
      ORDER BY r.created_at DESC
      LIMIT 10
    `, [id]);
    
    res.json({
      code: 200,
      data: { ...merchant, products, reviews }
    });
    
  } catch (error) {
    console.error('获取商家详情错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 获取商家商品
router.get('/:id/products', async (req, res) => {
  try {
    const { id } = req.params;
    const { category_id } = req.query;
    
    let sql = 'SELECT * FROM products WHERE merchant_id = ? AND status = 1';
    const params = [id];
    
    if (category_id) {
      sql += ' AND category_id = ?';
      params.push(category_id);
    }
    
    sql += ' ORDER BY is_signature DESC, order_count_total DESC';
    
    const products = await query(sql, params);
    res.json({ code: 200, data: products });
    
  } catch (error) {
    console.error('获取商家商品错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 获取商家评价
router.get('/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, type } = req.query;
    const offset = (page - 1) * limit;
    
    let sql = `
      SELECT r.*, u.nickname, u.avatar_url
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.target_type = 'merchant' AND r.target_id = ? AND r.status = 1
    `;
    const params = [id];
    
    if (type === 'good') {
      sql += ' AND r.overall_score >= 4';
    } else if (type === 'mid') {
      sql += ' AND r.overall_score >= 2 AND r.overall_score < 4';
    } else if (type === 'bad') {
      sql += ' AND r.overall_score < 2';
    }
    
    sql += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const reviews = await query(sql, params);
    
    // 获取评价总数
    const countResult = await get(`
      SELECT COUNT(*) as total FROM reviews 
      WHERE target_type = 'merchant' AND target_id = ? AND status = 1
    `, [id]);
    
    res.json({
      code: 200,
      data: {
        list: reviews,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.total
        }
      }
    });
    
  } catch (error) {
    console.error('获取商家评价错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 更新商家实时状态（商家端）
router.post('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { realtime_status, queue_count, wait_time_estimate } = req.body;
    
    await run(`
      UPDATE merchants 
      SET realtime_status = ?, queue_count = ?, wait_time_estimate = ?, status_updated_at = datetime('now')
      WHERE id = ?
    `, [realtime_status, queue_count, wait_time_estimate, id]);
    
    // 记录状态日志
    await run(`
      INSERT INTO merchant_status_logs (merchant_id, new_status, queue_count, wait_time)
      VALUES (?, ?, ?, ?)
    `, [id, realtime_status, queue_count, wait_time_estimate]);
    
    res.json({ code: 200, message: '状态更新成功' });
    
  } catch (error) {
    console.error('更新商家状态错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 搜索商家
router.get('/search/all', async (req, res) => {
  try {
    const { keyword, university_id } = req.query;
    
    if (!keyword) {
      return res.json({ code: 200, data: [] });
    }
    
    let sql = `
      SELECT m.*, u.short_name as university_name
      FROM merchants m
      LEFT JOIN universities u ON m.university_id = u.id
      WHERE m.status = 1 AND (m.name LIKE ? OR m.cuisine_types LIKE ? OR m.scene_tags LIKE ?)
    `;
    const params = [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`];
    
    if (university_id) {
      sql += ' AND m.university_id = ?';
      params.push(university_id);
    }
    
    sql += ' ORDER BY m.review_avg_score DESC LIMIT 20';
    
    const merchants = await query(sql, params);
    
    merchants.forEach(m => {
      try {
        m.cuisine_types = JSON.parse(m.cuisine_types || '[]');
        m.scene_tags = JSON.parse(m.scene_tags || '[]');
      } catch (e) {
        m.cuisine_types = [];
        m.scene_tags = [];
      }
    });
    
    res.json({ code: 200, data: merchants });
    
  } catch (error) {
    console.error('搜索商家错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 获取热门商家
router.get('/ranking/hot', async (req, res) => {
  try {
    const { type = 'today', university_id } = req.query;
    
    let orderBy = 'm.view_count DESC';
    if (type === 'week') {
      orderBy = 'm.favorite_count DESC';
    } else if (type === 'score') {
      orderBy = 'm.review_avg_score DESC';
    }
    
    let sql = `
      SELECT m.*, u.short_name as university_name
      FROM merchants m
      LEFT JOIN universities u ON m.university_id = u.id
      WHERE m.status = 1
    `;
    const params = [];
    
    if (university_id) {
      sql += ' AND m.university_id = ?';
      params.push(university_id);
    }
    
    sql += ` ORDER BY ${orderBy} LIMIT 20`;
    
    const merchants = await query(sql, params);
    
    merchants.forEach(m => {
      try {
        m.cuisine_types = JSON.parse(m.cuisine_types || '[]');
        m.scene_tags = JSON.parse(m.scene_tags || '[]');
      } catch (e) {
        m.cuisine_types = [];
        m.scene_tags = [];
      }
    });
    
    res.json({ code: 200, data: merchants });
    
  } catch (error) {
    console.error('获取热门商家错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;
