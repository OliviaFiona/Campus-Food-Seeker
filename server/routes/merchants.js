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

// 获取筛选选项（价格、距离、类型，基于数据库）
router.get('/filter-options', async (req, res) => {
  try {
    const priceRows = await query(`
      SELECT MIN(price_per_person) as min_price, MAX(price_per_person) as max_price
      FROM merchants WHERE status = 1 AND price_per_person > 0
    `);
    const priceBounds = (priceRows && priceRows[0]) ? priceRows[0] : { min_price: 0, max_price: 100 };
    const minP = Number(priceBounds?.min_price) || 0;
    const maxP = Math.max(Number(priceBounds?.max_price) || 100, 60);
    const priceRanges = [
      { label: '不限', price_min: null, price_max: null },
      { label: '20元以下', price_min: null, price_max: 20 },
      { label: '20-40元', price_min: 20, price_max: 40 },
      { label: '40-60元', price_min: 40, price_max: 60 },
      { label: '60-100元', price_min: 60, price_max: 100 },
      { label: `${maxP}元以上`, price_min: maxP, price_max: null }
    ];

    const types = await query(`
      SELECT DISTINCT business_type FROM merchants WHERE status = 1 ORDER BY business_type
    `);
    const typeLabels = { 1: '餐饮', 2: '饮品', 3: '甜品', 4: '小吃', 5: '其他' };
    const typeOptions = [
      { value: '', label: '不限' },
      ...(types || []).map(t => ({ value: String(t.business_type), label: typeLabels[t.business_type] || '其他' }))
    ];

    const distanceOptions = [
      { value: '', label: '不限' },
      { value: 500, label: '500m内' },
      { value: 1000, label: '1km内' },
      { value: 2000, label: '2km内' },
      { value: 3000, label: '3km内' },
      { value: 5000, label: '5km内' }
    ];

    res.json({
      code: 200,
      data: { priceRanges, typeOptions, distanceOptions }
    });
  } catch (error) {
    console.error('获取筛选选项错误:', error);
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
