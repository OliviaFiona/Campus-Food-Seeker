// ============================================
// 首页JavaScript逻辑
// ============================================

// 全局变量
let map = null;
let markers = [];
let currentMerchant = null;
let merchantsData = [];

// 状态映射
const statusMap = {
  0: { text: '未知', class: 'closed', color: '#9CA3AF' },
  1: { text: '空闲', class: 'idle', color: '#22C55E' },
  2: { text: '忙碌', class: 'busy', color: '#F59E0B' },
  3: { text: '满客', class: 'full', color: '#EF4444' },
  4: { text: '排队中', class: 'queue', color: '#8B5CF6' },
  5: { text: '休息中', class: 'closed', color: '#9CA3AF' }
};

// 商家类型图标
const typeEmojiMap = {
  1: '🍔', // 餐饮
  2: '☕', // 饮品
  3: '🍰', // 甜品
  4: '🍜', // 小吃
  5: '🍽️'  // 其他
};

// 商家图标映射
const merchantEmojiMap = {
  '麦当劳': '🍔',
  '肯德基': '🍗',
  '吉野家': '🍱',
  '赛百味': '🥪',
  '真功夫': '🍚',
  '火锅': '🍲',
  '川妹子': '🌶️',
  '重庆小面': '🍜',
  '麻辣诱惑': '🥘',
  '炸酱面': '🍝',
  '东北': '🥟',
  '粤菜': '🍤',
  '湘鄂': '🌶️',
  '星巴克': '☕',
  '瑞幸': '☕',
  '喜茶': '🧋',
  '奈雪': '🧋',
  'CoCo': '🧋',
  '蜜雪': '🍦',
  '小吃': '🥟',
  '包子': '🥟',
  '煎饼': '🌯',
  '烤串': '🍢',
  '拉面': '🍜',
  '默认': '🍽️'
};

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  // 检查登录状态
  checkAuth();
  
  // 初始化地图
  initMap();
  
  // 加载商家数据
  await loadMerchants();
  
  // 绑定事件
  bindEvents();
  
  // 隐藏加载
  document.getElementById('loadingOverlay').style.display = 'none';
});

// 检查登录状态
function checkAuth() {
  const token = localStorage.getItem('token');
  const guestMode = localStorage.getItem('guestMode');
  
  if (!token && !guestMode) {
    // 未登录且非游客模式，跳转登录页
    // window.location.href = '/';
    return;
  }
  
  // 显示用户信息
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (user.nickname) {
    document.getElementById('userAvatar').textContent = user.nickname.charAt(0);
  }
}

// 初始化地图
function initMap() {
  // 检查高德地图API是否加载成功
  if (typeof AMap === 'undefined') {
    console.warn('高德地图API未加载，使用备用方案');
    // 创建一个模拟地图容器
    const mapContainer = document.getElementById('amap-container');
    mapContainer.innerHTML = `
      <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #e0f2fe 0%, #fef3c7 50%, #fce7f3 100%); flex-direction: column;">
        <div style="font-size: 80px; margin-bottom: 20px;">🗺️</div>
        <div style="font-size: 18px; color: #666; margin-bottom: 10px;">地图加载中...</div>
        <div style="font-size: 14px; color: #999;">请配置高德地图API Key</div>
        <div style="margin-top: 20px; padding: 10px 20px; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="font-size: 13px; color: #666; margin-bottom: 8px;">👇 商家分布预览</div>
          <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;">
            <span style="padding: 4px 12px; background: #22C55E; color: white; border-radius: 20px; font-size: 12px;">空闲 8家</span>
            <span style="padding: 4px 12px; background: #F59E0B; color: white; border-radius: 20px; font-size: 12px;">忙碌 10家</span>
            <span style="padding: 4px 12px; background: #EF4444; color: white; border-radius: 20px; font-size: 12px;">满客 4家</span>
            <span style="padding: 4px 12px; background: #8B5CF6; color: white; border-radius: 20px; font-size: 12px;">排队 3家</span>
          </div>
        </div>
      </div>
    `;
    return;
  }

  // 初始化高德地图
  map = new AMap.Map('amap-container', {
    zoom: 15,
    center: [116.337, 39.992], // 五道口附近
    viewMode: '2D'
  });

  // 添加地图控件
  AMap.plugin(['AMap.ToolBar', 'AMap.Scale'], function() {
    map.addControl(new AMap.ToolBar());
    map.addControl(new AMap.Scale());
  });
}

// 加载商家数据
async function loadMerchants() {
  try {
    const response = await fetch('/api/merchants/nearby?lat=39.992&lng=116.337&distance=5000');
    const data = await response.json();
    
    if (data.code === 200) {
      merchantsData = data.data;
      renderMarkers();
      renderMerchantCarousel(merchantsData);
    }
  } catch (error) {
    console.error('加载商家失败:', error);
    // 使用模拟数据
    merchantsData = getMockMerchants();
    renderMerchantCarousel(merchantsData);
  }
}

// 模拟商家数据（备用）
function getMockMerchants() {
  return [
    { id: 1, name: '麦当劳·清华东门店', short_name: '麦当劳', business_type: 1, review_avg_score: 4.5, price_per_person: 35, realtime_status: 1, queue_count: 0, latitude: 39.9921, longitude: 116.3372, distance: 0.2, scene_tags: ['课间快吃'], cuisine_types: ['快餐'] },
    { id: 2, name: '肯德基·五道口店', short_name: '肯德基', business_type: 1, review_avg_score: 4.4, price_per_person: 38, realtime_status: 2, queue_count: 5, latitude: 39.9931, longitude: 116.3382, distance: 0.3, scene_tags: ['课间快吃'], cuisine_types: ['快餐'] },
    { id: 6, name: '老成都火锅·五道口店', short_name: '老成都火锅', business_type: 1, review_avg_score: 4.8, price_per_person: 68, realtime_status: 4, queue_count: 12, latitude: 39.9923, longitude: 116.3374, distance: 0.4, scene_tags: ['宿舍聚餐'], cuisine_types: ['火锅'] },
    { id: 15, name: '星巴克·清华科技园店', short_name: '星巴克', business_type: 2, review_avg_score: 4.7, price_per_person: 38, realtime_status: 2, queue_count: 7, latitude: 39.9983, longitude: 116.3304, distance: 0.8, scene_tags: ['约会'], cuisine_types: ['咖啡'] },
    { id: 17, name: '喜茶·五道口店', short_name: '喜茶', business_type: 2, review_avg_score: 4.6, price_per_person: 28, realtime_status: 4, queue_count: 15, latitude: 39.9934, longitude: 116.3385, distance: 0.5, scene_tags: ['约会'], cuisine_types: ['奶茶'] },
    { id: 11, name: '老北京炸酱面馆', short_name: '炸酱面馆', business_type: 1, review_avg_score: 4.6, price_per_person: 35, realtime_status: 1, queue_count: 0, latitude: 39.9982, longitude: 116.3303, distance: 1.0, scene_tags: ['宿舍聚餐'], cuisine_types: ['北京菜'] }
  ];
}

// 渲染地图标记
function renderMarkers() {
  if (!map || typeof AMap === 'undefined') return;
  
  // 清除现有标记
  markers.forEach(marker => marker.setMap(null));
  markers = [];
  
  merchantsData.forEach(merchant => {
    const status = statusMap[merchant.realtime_status] || statusMap[0];
    
    // 创建自定义标记
    const markerContent = `
      <div style="
        width: 44px;
        height: 44px;
        background: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        border: 3px solid ${status.color};
        cursor: pointer;
      ">${getMerchantEmoji(merchant.name)}</div>
    `;
    
    const marker = new AMap.Marker({
      position: [merchant.longitude, merchant.latitude],
      content: markerContent,
      offset: new AMap.Pixel(-22, -22)
    });
    
    marker.on('click', () => openDetailPanel(merchant));
    marker.setMap(map);
    markers.push(marker);
  });
}

// 获取商家emoji
function getMerchantEmoji(name) {
  for (const [key, emoji] of Object.entries(merchantEmojiMap)) {
    if (name.includes(key)) return emoji;
  }
  return merchantEmojiMap['默认'];
}

// 渲染商家卡片流
function renderMerchantCarousel(merchants) {
  const container = document.getElementById('merchantCarousel');
  
  container.innerHTML = merchants.map(merchant => {
    const status = statusMap[merchant.realtime_status] || statusMap[0];
    const emoji = getMerchantEmoji(merchant.name);
    
    return `
      <div class="merchant-card" data-id="${merchant.id}">
        <div class="merchant-card-image">
          <span style="opacity: 0.8;">${emoji}</span>
          <div class="merchant-status-badge ${status.class}">${status.text}</div>
        </div>
        <div class="merchant-card-content">
          <div class="merchant-card-name">${merchant.short_name || merchant.name}</div>
          <div class="merchant-card-meta">
            <span class="merchant-card-score">★ ${merchant.review_avg_score}</span>
            <span>·</span>
            <span>${merchant.cuisine_types?.[0] || '美食'}</span>
            <span>·</span>
            <span>¥${merchant.price_per_person}/人</span>
          </div>
          <div class="merchant-card-info">
            <span>📍 ${merchant.distance ? merchant.distance.toFixed(1) : (Math.random() * 2).toFixed(1)}km</span>
            ${merchant.queue_count > 0 ? `<span class="merchant-card-queue">🔥 ${merchant.queue_count}人排队</span>` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  // 绑定卡片点击事件
  container.querySelectorAll('.merchant-card').forEach(card => {
    card.addEventListener('click', () => {
      const merchantId = parseInt(card.dataset.id);
      const merchant = merchantsData.find(m => m.id === merchantId);
      if (merchant) openDetailPanel(merchant);
    });
  });
}

// 打开详情面板
async function openDetailPanel(merchant) {
  currentMerchant = merchant;
  const panel = document.getElementById('detailPanel');
  const content = document.getElementById('detailContent');
  const status = statusMap[merchant.realtime_status] || statusMap[0];
  
  // 更新头部
  document.getElementById('detailEmoji').textContent = getMerchantEmoji(merchant.name);
  
  // 尝试获取完整详情
  let detail = merchant;
  try {
    const response = await fetch(`/api/merchants/${merchant.id}`);
    const data = await response.json();
    if (data.code === 200) {
      detail = data.data;
    }
  } catch (error) {
    console.log('使用基础数据');
  }
  
  // 渲染详情内容
  content.innerHTML = `
    <h2 class="detail-name">${detail.name}</h2>
    
    <div class="detail-meta">
      <div class="detail-meta-item">
        <span style="color: var(--warning); font-weight: 600;">★ ${detail.review_avg_score}</span>
      </div>
      <div class="detail-meta-item">
        <span>🚶</span>
        <span>${detail.distance ? (detail.distance * 10).toFixed(0) : Math.floor(Math.random() * 15 + 3)}分钟</span>
      </div>
      <div class="detail-meta-item">
        <span>💰</span>
        <span>人均¥${detail.price_per_person}</span>
      </div>
    </div>
    
    <div class="detail-status ${status.class}">
      <span style="font-size: 16px;">${status.text}</span>
      ${detail.queue_count > 0 ? `<span>|</span><span>🔥 ${detail.queue_count}人正在排队</span>` : ''}
    </div>
    
    <div class="detail-actions">
      <button class="detail-action-btn primary" onclick="startNavigation()">
        <span>🧭</span>
        <span>导航前往</span>
      </button>
      <button class="detail-action-btn secondary" onclick="toggleFavorite()">
        <span id="favIcon">🤍</span>
        <span>收藏</span>
      </button>
    </div>
    
    <div class="detail-section">
      <h3 class="detail-section-title">特色标签</h3>
      <div class="detail-tags">
        ${(detail.scene_tags || []).map(tag => `<span class="detail-tag">${tag}</span>`).join('')}
        ${(detail.cuisine_types || []).map(type => `<span class="detail-tag" style="background: var(--primary-50); color: var(--primary-700);">${type}</span>`).join('')}
        ${(detail.feature_tags || []).map(tag => `<span class="detail-tag" style="background: var(--secondary-50); color: var(--secondary-700);">${tag}</span>`).join('')}
      </div>
    </div>
    
    <div class="detail-section">
      <h3 class="detail-section-title">地址</h3>
      <div class="detail-address">
        <span>📍</span>
        <span>${detail.address || '北京市海淀区学院路附近'}</span>
      </div>
    </div>
    
    ${detail.products ? `
    <div class="detail-section">
      <h3 class="detail-section-title">招牌菜品</h3>
      <div style="display: flex; gap: 12px; overflow-x: auto; padding-bottom: 8px;">
        ${detail.products.slice(0, 4).map(p => `
          <div style="flex-shrink: 0; width: 120px; background: var(--bg-canvas); border-radius: 12px; padding: 12px;">
            <div style="font-size: 32px; text-align: center; margin-bottom: 8px;">🍽️</div>
            <div style="font-size: 13px; font-weight: 500; margin-bottom: 4px;" class="truncate">${p.name}</div>
            <div style="font-size: 12px; color: var(--primary-600); font-weight: 600;">¥${p.sale_price}</div>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}
    
    ${detail.reviews ? `
    <div class="detail-section">
      <h3 class="detail-section-title">校友评价</h3>
      <div style="display: flex; flex-direction: column; gap: 12px;">
        ${detail.reviews.slice(0, 2).map(r => `
          <div style="background: var(--bg-canvas); border-radius: 12px; padding: 16px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <div style="width: 32px; height: 32px; background: linear-gradient(135deg, var(--primary-400), var(--primary-500)); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 14px;">${r.nickname ? r.nickname.charAt(0) : '👤'}</div>
              <div>
                <div style="font-size: 13px; font-weight: 500;">${r.nickname || '匿名用户'}</div>
                <div style="font-size: 12px; color: var(--warning);">${'★'.repeat(Math.floor(r.overall_score))}</div>
              </div>
            </div>
            <div style="font-size: 13px; color: var(--text-secondary); line-height: 1.5;">${r.content || '味道不错，推荐！'}</div>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}
  `;
  
  // 打开面板
  panel.classList.add('open');
}

// 关闭详情面板
function closeDetailPanel() {
  document.getElementById('detailPanel').classList.remove('open');
  currentMerchant = null;
}

// 开始导航
function startNavigation() {
  if (!currentMerchant) return;
  
  const { latitude, longitude, name } = currentMerchant;
  
  if (typeof AMap !== 'undefined') {
    // 使用高德地图导航
    const url = `https://uri.amap.com/navigation?to=${longitude},${latitude},${encodeURIComponent(name)}&mode=walk&coordinate=gaode`;
    window.open(url, '_blank');
  } else {
    alert(`导航至：${name}\n地址：${latitude}, ${longitude}\n\n(请配置高德地图API Key以启用导航功能)`);
  }
}

// 切换收藏
async function toggleFavorite() {
  if (!currentMerchant) return;
  
  const favIcon = document.getElementById('favIcon');
  const isFavorited = favIcon.textContent === '❤️';
  
  try {
    const response = await fetch('/api/users/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchant_id: currentMerchant.id,
        action: isFavorited ? 'remove' : 'add'
      })
    });
    
    const data = await response.json();
    
    if (data.code === 200) {
      favIcon.textContent = isFavorited ? '🤍' : '❤️';
      // 动画效果
      favIcon.style.transform = 'scale(1.3)';
      setTimeout(() => favIcon.style.transform = 'scale(1)', 200);
    }
  } catch (error) {
    console.error('收藏操作失败:', error);
    // 本地模拟
    favIcon.textContent = isFavorited ? '🤍' : '❤️';
  }
}

// 绑定事件
function bindEvents() {
  // 关闭详情面板
  document.getElementById('detailClose').addEventListener('click', closeDetailPanel);
  
  // 收藏按钮
  document.getElementById('detailFavorite').addEventListener('click', toggleFavorite);
  
  // 左侧导航
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const filter = item.dataset.filter;
      const page = item.dataset.page;
      
      if (page) {
        window.location.href = `/${page}`;
        return;
      }
      
      // 更新激活状态
      document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      
      // 处理热门推荐的子菜单
      if (filter === 'hot') {
        const subItems = document.getElementById('hotSubItems');
        subItems.style.display = subItems.style.display === 'none' ? 'block' : 'none';
      }
      
      // 应用筛选
      if (filter) {
        applyFilter(filter);
      }
    });
  });
  
  // 子菜单项
  document.querySelectorAll('.nav-sub-item').forEach(item => {
    item.addEventListener('click', () => {
      applyFilter(item.dataset.filter);
    });
  });
  
  // 类型筛选芯片
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      
      const type = chip.dataset.type;
      if (type && type !== 'all') {
        filterByType(parseInt(type));
      } else {
        renderMerchantCarousel(merchantsData);
      }
    });
  });
  
  // Sheet tabs
  document.querySelectorAll('.sheet-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.sheet-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      const tabType = tab.dataset.tab;
      if (tabType === 'ranking') {
        loadHotMerchants();
      } else {
        loadRecentMerchants();
      }
    });
  });
  
  // 搜索框
  document.getElementById('searchBox').addEventListener('click', () => {
    window.location.href = '/search';
  });
  
  // 用户头像
  document.getElementById('userAvatar').addEventListener('click', () => {
    window.location.href = '/profile';
  });
}

// 应用筛选
function applyFilter(filter) {
  let filtered = [...merchantsData];
  
  switch (filter) {
    case 'favorites':
      // 这里应该从API获取收藏列表
      alert('请登录后查看收藏');
      return;
    case 'scene-fast':
      filtered = filtered.filter(m => m.scene_tags?.includes('课间快吃'));
      break;
    case 'scene-gather':
      filtered = filtered.filter(m => m.scene_tags?.includes('宿舍聚餐'));
      break;
    case 'scene-date':
      filtered = filtered.filter(m => m.scene_tags?.includes('约会'));
      break;
    case 'scene-night':
      filtered = filtered.filter(m => m.scene_tags?.includes('深夜食堂'));
      break;
    case 'hot-today':
    case 'hot-week':
      loadHotMerchants();
      return;
  }
  
  renderMerchantCarousel(filtered);
}

// 按类型筛选
function filterByType(type) {
  const filtered = merchantsData.filter(m => m.business_type === type);
  renderMerchantCarousel(filtered);
}

// 加载热门商家
async function loadHotMerchants() {
  try {
    const response = await fetch('/api/merchants/ranking/hot?type=today');
    const data = await response.json();
    
    if (data.code === 200) {
      renderMerchantCarousel(data.data);
    }
  } catch (error) {
    console.error('加载热门商家失败:', error);
    // 按评分排序
    const sorted = [...merchantsData].sort((a, b) => b.review_avg_score - a.review_avg_score);
    renderMerchantCarousel(sorted);
  }
}

// 加载最近浏览
function loadRecentMerchants() {
  // 模拟最近浏览
  const shuffled = [...merchantsData].sort(() => Math.random() - 0.5);
  renderMerchantCarousel(shuffled.slice(0, 6));
}
