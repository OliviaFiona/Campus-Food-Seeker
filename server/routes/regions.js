const express = require('express');
const { query, get } = require('../utils/db');

const router = express.Router();

// 获取区域列表
router.get('/', async (req, res) => {
  try {
    const { university_id } = req.query;
    
    let sql = `
      SELECT r.*, u.short_name as university_name
      FROM regions r
      LEFT JOIN universities u ON r.university_id = u.id
      WHERE r.is_active = 1
    `;
    const params = [];
    
    if (university_id) {
      sql += ' AND r.university_id = ?';
      params.push(university_id);
    }
    
    sql += ' ORDER BY r.distance_to_uni ASC';
    
    const regions = await query(sql, params);
    res.json({ code: 200, data: regions });
    
  } catch (error) {
    console.error('获取区域列表错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 获取区域详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const region = await get(`
      SELECT r.*, u.short_name as university_name
      FROM regions r
      LEFT JOIN universities u ON r.university_id = u.id
      WHERE r.id = ?
    `, [id]);
    
    if (!region) {
      return res.status(404).json({ code: 404, message: '区域不存在' });
    }
    
    // 获取区域内的商家
    const merchants = await query(`
      SELECT m.*
      FROM merchants m
      WHERE m.region_id = ? AND m.status = 1
      ORDER BY m.review_avg_score DESC
    `, [id]);
    
    merchants.forEach(m => {
      m.cuisine_types = JSON.parse(m.cuisine_types || '[]');
      m.scene_tags = JSON.parse(m.scene_tags || '[]');
    });
    
    res.json({
      code: 200,
      data: { ...region, merchants }
    });
    
  } catch (error) {
    console.error('获取区域详情错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// 获取热力数据
router.get('/heatmap/data', async (req, res) => {
  try {
    const { region_id, date } = req.query;
    
    // 模拟热力数据
    const heatData = [];
    const merchants = await query(`
      SELECT id, latitude, longitude, realtime_status, queue_count
      FROM merchants
      WHERE status = 1
    `);
    
    merchants.forEach(m => {
      let heat = 0;
      if (m.realtime_status === 1) heat = 10; // 空闲
      else if (m.realtime_status === 2) heat = 30; // 忙碌
      else if (m.realtime_status === 3) heat = 50; // 满客
      else if (m.realtime_status === 4) heat = 80; // 排队
      
      heat += m.queue_count * 2;
      
      heatData.push({
        lat: m.latitude,
        lng: m.longitude,
        count: heat
      });
    });
    
    res.json({ code: 200, data: heatData });
    
  } catch (error) {
    console.error('获取热力数据错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;
