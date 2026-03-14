const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// 确保data目录存在
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'campus_food.db');
const db = new Database(dbPath);

console.log('已连接到SQLite数据库');

// 启用外键约束
db.pragma('foreign_keys = ON');

// 创建表的SQL语句
const createTables = `
-- 大学表
CREATE TABLE IF NOT EXISTS universities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    english_name TEXT,
    province TEXT,
    city TEXT,
    district TEXT,
    address TEXT,
    latitude REAL,
    longitude REAL,
    school_type INTEGER,
    student_count INTEGER,
    merchant_count INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 校区表
CREATE TABLE IF NOT EXISTS campuses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    university_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    student_count INTEGER,
    is_main INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (university_id) REFERENCES universities(id)
);

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT UNIQUE DEFAULT (lower(hex(randomblob(16)))),
    nickname TEXT,
    avatar_url TEXT,
    phone TEXT UNIQUE,
    email TEXT,
    gender INTEGER DEFAULT 0,
    university_id INTEGER,
    campus_id INTEGER,
    enrollment_year INTEGER,
    password TEXT,
    user_type INTEGER DEFAULT 1,
    status INTEGER DEFAULT 1,
    review_count INTEGER DEFAULT 0,
    favorite_count INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (university_id) REFERENCES universities(id),
    FOREIGN KEY (campus_id) REFERENCES campuses(id)
);

-- 商家表
CREATE TABLE IF NOT EXISTS merchants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    merchant_no TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    short_name TEXT,
    logo_url TEXT,
    cover_images TEXT,
    business_license_no TEXT,
    province TEXT,
    city TEXT,
    district TEXT,
    address TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    region_id INTEGER,
    university_id INTEGER NOT NULL,
    business_type INTEGER NOT NULL,
    cuisine_types TEXT,
    scene_tags TEXT,
    feature_tags TEXT,
    price_per_person INTEGER DEFAULT 0,
    price_level INTEGER DEFAULT 1,
    serve_speed INTEGER DEFAULT 2,
    phone TEXT,
    business_hours TEXT,
    is_24h INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1,
    realtime_status INTEGER DEFAULT 0,
    queue_count INTEGER DEFAULT 0,
    wait_time_estimate INTEGER DEFAULT 0,
    status_updated_at DATETIME,
    view_count INTEGER DEFAULT 0,
    favorite_count INTEGER DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    review_avg_score REAL DEFAULT 5.0,
    score_taste REAL DEFAULT 5.0,
    score_environment REAL DEFAULT 5.0,
    score_service REAL DEFAULT 5.0,
    score_price REAL DEFAULT 5.0,
    owner_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (university_id) REFERENCES universities(id),
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- 商品分类表
CREATE TABLE IF NOT EXISTS product_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_id INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    path TEXT,
    name TEXT NOT NULL,
    icon TEXT,
    category_type INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 商品表
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_no TEXT UNIQUE NOT NULL,
    merchant_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    sub_title TEXT,
    description TEXT,
    main_image TEXT,
    images TEXT,
    category_id INTEGER NOT NULL,
    original_price REAL DEFAULT 0,
    sale_price REAL DEFAULT 0,
    is_recommended INTEGER DEFAULT 0,
    is_signature INTEGER DEFAULT 0,
    is_new INTEGER DEFAULT 0,
    is_available INTEGER DEFAULT 1,
    order_count_total INTEGER DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    review_avg_score REAL DEFAULT 5.0,
    status INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (merchant_id) REFERENCES merchants(id),
    FOREIGN KEY (category_id) REFERENCES product_categories(id)
);

-- 评价表
CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    target_type TEXT DEFAULT 'merchant',
    target_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    overall_score REAL NOT NULL,
    taste_score REAL,
    environment_score REAL,
    service_score REAL,
    price_score REAL,
    content TEXT,
    images TEXT,
    consume_amount REAL,
    dish_ordered TEXT,
    is_anonymous INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 用户收藏表
CREATE TABLE IF NOT EXISTS user_favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    target_type TEXT NOT NULL,
    target_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, target_type, target_id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 区域表（商圈）
CREATE TABLE IF NOT EXISTS regions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    region_no TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    short_name TEXT,
    region_type INTEGER NOT NULL,
    province TEXT,
    city TEXT,
    district TEXT,
    address TEXT,
    latitude REAL,
    longitude REAL,
    university_id INTEGER NOT NULL,
    distance_to_uni INTEGER,
    merchant_count INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (university_id) REFERENCES universities(id)
);

-- 商家状态日志表
CREATE TABLE IF NOT EXISTS merchant_status_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    merchant_id INTEGER NOT NULL,
    old_status INTEGER,
    new_status INTEGER NOT NULL,
    queue_count INTEGER DEFAULT 0,
    wait_time INTEGER DEFAULT 0,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (merchant_id) REFERENCES merchants(id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_merchants_university ON merchants(university_id, status);
CREATE INDEX IF NOT EXISTS idx_merchants_location ON merchants(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_merchants_type ON merchants(business_type, status);
CREATE INDEX IF NOT EXISTS idx_reviews_target ON reviews(target_type, target_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON user_favorites(user_id, created_at DESC);
`;

console.log('✓ 开始创建数据表...');
db.exec(createTables);
console.log('✓ 数据表创建完成');

// 初始化数据
const universities = [
  { name: '清华大学', short_name: '清华', english_name: 'Tsinghua University', province: '北京市', city: '北京市', district: '海淀区', address: '双清路30号', latitude: 40.000, longitude: 116.326, school_type: 2, student_count: 50000 },
  { name: '北京大学', short_name: '北大', english_name: 'Peking University', province: '北京市', city: '北京市', district: '海淀区', address: '颐和园路5号', latitude: 39.987, longitude: 116.305, school_type: 1, student_count: 46000 },
  { name: '北京航空航天大学', short_name: '北航', english_name: 'Beihang University', province: '北京市', city: '北京市', district: '海淀区', address: '学院路37号', latitude: 39.982, longitude: 116.346, school_type: 2, student_count: 30000 },
  { name: '北京邮电大学', short_name: '北邮', english_name: 'Beijing University of Posts and Telecommunications', province: '北京市', city: '北京市', district: '海淀区', address: '西土城路10号', latitude: 39.960, longitude: 116.357, school_type: 2, student_count: 23000 },
  { name: '中国农业大学', short_name: '中农', english_name: 'China Agricultural University', province: '北京市', city: '北京市', district: '海淀区', address: '清华东路17号', latitude: 40.002, longitude: 116.349, school_type: 1, student_count: 20000 }
];

const regions = [
  { region_no: 'R001', name: '五道口购物中心', short_name: '五道口', region_type: 2, province: '北京市', city: '北京市', district: '海淀区', address: '成府路35号', latitude: 39.992, longitude: 116.337, university_id: 1, distance_to_uni: 500 },
  { region_no: 'R002', name: '华联商厦（五道口店）', short_name: '华联五道口', region_type: 2, province: '北京市', city: '北京市', district: '海淀区', address: '成府路33号', latitude: 39.993, longitude: 116.338, university_id: 1, distance_to_uni: 400 },
  { region_no: 'R003', name: '食尚坊美食街', short_name: '食尚坊', region_type: 3, province: '北京市', city: '北京市', district: '海淀区', address: '学院路街道', latitude: 39.985, longitude: 116.342, university_id: 3, distance_to_uni: 300 },
  { region_no: 'R004', name: '清华科技园底商', short_name: '清华科技园', region_type: 1, province: '北京市', city: '北京市', district: '海淀区', address: '中关村东路1号', latitude: 39.998, longitude: 116.330, university_id: 1, distance_to_uni: 200 },
  { region_no: 'R005', name: '北大南门商业街', short_name: '南门商街', region_type: 3, province: '北京市', city: '北京市', district: '海淀区', address: '颐和园路', latitude: 39.985, longitude: 116.307, university_id: 2, distance_to_uni: 150 }
];

const categories = [
  { parent_id: 0, level: 1, name: '菜品', category_type: 1, sort_order: 1 },
  { parent_id: 0, level: 1, name: '饮品', category_type: 2, sort_order: 2 },
  { parent_id: 0, level: 1, name: '主食', category_type: 4, sort_order: 3 },
  { parent_id: 0, level: 1, name: '小吃', category_type: 5, sort_order: 4 },
  { parent_id: 1, level: 2, path: '1', name: '川菜', category_type: 1, sort_order: 1 },
  { parent_id: 1, level: 2, path: '1', name: '粤菜', category_type: 1, sort_order: 2 },
  { parent_id: 1, level: 2, path: '1', name: '湘菜', category_type: 1, sort_order: 3 },
  { parent_id: 1, level: 2, path: '1', name: '火锅', category_type: 1, sort_order: 4 },
  { parent_id: 1, level: 2, path: '1', name: '烧烤', category_type: 1, sort_order: 5 },
  { parent_id: 1, level: 2, path: '1', name: '东北菜', category_type: 1, sort_order: 6 },
  { parent_id: 1, level: 2, path: '1', name: '北京菜', category_type: 1, sort_order: 7 },
  { parent_id: 2, level: 2, path: '2', name: '咖啡', category_type: 2, sort_order: 1 },
  { parent_id: 2, level: 2, path: '2', name: '奶茶', category_type: 2, sort_order: 2 },
  { parent_id: 2, level: 2, path: '2', name: '果汁', category_type: 2, sort_order: 3 },
  { parent_id: 2, level: 2, path: '2', name: '茶饮', category_type: 2, sort_order: 4 },
  { parent_id: 4, level: 2, path: '4', name: '面食', category_type: 5, sort_order: 1 },
  { parent_id: 4, level: 2, path: '4', name: '炸物', category_type: 5, sort_order: 2 },
  { parent_id: 4, level: 2, path: '4', name: '烤串', category_type: 5, sort_order: 3 }
];

const merchants = [
  { merchant_no: 'M001', name: '麦当劳·清华东门店', short_name: '麦当劳', business_type: 1, cuisine_types: '["快餐"]', scene_tags: '["课间快吃", "快餐首选"]', feature_tags: '["学生优惠"]', price_per_person: 35, price_level: 2, serve_speed: 1, region_id: 1, university_id: 1, address: '成府路35号五道口购物中心1层', latitude: 39.9921, longitude: 116.3372, phone: '010-12345678', realtime_status: 1, queue_count: 0, review_avg_score: 4.5 },
  { merchant_no: 'M002', name: '肯德基·五道口店', short_name: '肯德基', business_type: 1, cuisine_types: '["快餐"]', scene_tags: '["课间快吃", "快餐首选"]', feature_tags: '["学生优惠"]', price_per_person: 38, price_level: 2, serve_speed: 1, region_id: 2, university_id: 1, address: '成府路33号华联商厦1层', latitude: 39.9931, longitude: 116.3382, phone: '010-12345679', realtime_status: 2, queue_count: 5, review_avg_score: 4.4 },
  { merchant_no: 'M003', name: '吉野家·学院路店', short_name: '吉野家', business_type: 1, cuisine_types: '["日料", "快餐"]', scene_tags: '["课间快吃"]', feature_tags: '["出餐快"]', price_per_person: 32, price_level: 2, serve_speed: 1, region_id: 3, university_id: 3, address: '学院路街道食尚坊2层', latitude: 39.9851, longitude: 116.3422, phone: '010-12345680', realtime_status: 1, queue_count: 0, review_avg_score: 4.3 },
  { merchant_no: 'M004', name: 'Subway赛百味·清华店', short_name: '赛百味', business_type: 1, cuisine_types: '["快餐", "轻食"]', scene_tags: '["课间快吃", "减脂餐"]', feature_tags: '["健康轻食"]', price_per_person: 28, price_level: 2, serve_speed: 1, region_id: 4, university_id: 1, address: '清华科技园底商A座', latitude: 39.9981, longitude: 116.3302, phone: '010-12345681', realtime_status: 1, queue_count: 0, review_avg_score: 4.2 },
  { merchant_no: 'M005', name: '真功夫·五道口店', short_name: '真功夫', business_type: 1, cuisine_types: '["中餐", "快餐"]', scene_tags: '["课间快吃"]', feature_tags: '["蒸品健康"]', price_per_person: 30, price_level: 2, serve_speed: 1, region_id: 1, university_id: 1, address: '成府路35号五道口购物中心B1层', latitude: 39.9922, longitude: 116.3373, phone: '010-12345682', realtime_status: 2, queue_count: 3, review_avg_score: 4.1 },
  { merchant_no: 'M006', name: '老成都火锅·五道口店', short_name: '老成都火锅', business_type: 1, cuisine_types: '["川菜", "火锅"]', scene_tags: '["宿舍聚餐", "约会"]', feature_tags: '["正宗川味", "学生折扣"]', price_per_person: 68, price_level: 2, serve_speed: 3, region_id: 1, university_id: 1, address: '成府路35号五道口购物中心3层', latitude: 39.9923, longitude: 116.3374, phone: '010-12345683', realtime_status: 4, queue_count: 12, review_avg_score: 4.8 },
  { merchant_no: 'M007', name: '蜀大侠火锅', short_name: '蜀大侠', business_type: 1, cuisine_types: '["川菜", "火锅"]', scene_tags: '["宿舍聚餐", "约会"]', feature_tags: '["网红店", "拍照好看"]', price_per_person: 88, price_level: 3, serve_speed: 3, region_id: 3, university_id: 3, address: '学院路街道食尚坊3层', latitude: 39.9852, longitude: 116.3423, phone: '010-12345684', realtime_status: 3, queue_count: 8, review_avg_score: 4.6 },
  { merchant_no: 'M008', name: '川妹子小炒', short_name: '川妹子', business_type: 1, cuisine_types: '["川菜"]', scene_tags: '["宿舍聚餐"]', feature_tags: '["平价好吃"]', price_per_person: 45, price_level: 2, serve_speed: 2, region_id: 3, university_id: 3, address: '学院路街道食尚坊1层', latitude: 39.9853, longitude: 116.3424, phone: '010-12345685', realtime_status: 2, queue_count: 4, review_avg_score: 4.4 },
  { merchant_no: 'M009', name: '重庆小面·清华店', short_name: '重庆小面', business_type: 1, cuisine_types: '["川菜", "面食"]', scene_tags: '["课间快吃"]', feature_tags: '["正宗味道"]', price_per_person: 22, price_level: 1, serve_speed: 1, region_id: 5, university_id: 2, address: '颐和园路北大南门东侧', latitude: 39.9854, longitude: 116.3072, phone: '010-12345686', realtime_status: 1, queue_count: 0, review_avg_score: 4.3 },
  { merchant_no: 'M010', name: '麻辣诱惑', short_name: '麻辣诱惑', business_type: 1, cuisine_types: '["川菜"]', scene_tags: '["宿舍聚餐"]', feature_tags: '["麻辣鲜香"]', price_per_person: 55, price_level: 2, serve_speed: 2, region_id: 2, university_id: 1, address: '成府路33号华联商厦2层', latitude: 39.9932, longitude: 116.3383, phone: '010-12345687', realtime_status: 2, queue_count: 6, review_avg_score: 4.5 },
  { merchant_no: 'M011', name: '老北京炸酱面馆', short_name: '炸酱面馆', business_type: 1, cuisine_types: '["北京菜", "面食"]', scene_tags: '["宿舍聚餐"]', feature_tags: '["老字号", "地道北京味"]', price_per_person: 35, price_level: 2, serve_speed: 2, region_id: 4, university_id: 1, address: '清华科技园底商B座', latitude: 39.9982, longitude: 116.3303, phone: '010-12345688', realtime_status: 1, queue_count: 0, review_avg_score: 4.6 },
  { merchant_no: 'M012', name: '东北人家', short_name: '东北人家', business_type: 1, cuisine_types: '["东北菜"]', scene_tags: '["宿舍聚餐", "大份量"]', feature_tags: '["量大实惠"]', price_per_person: 48, price_level: 2, serve_speed: 2, region_id: 3, university_id: 3, address: '学院路街道食尚坊2层', latitude: 39.9855, longitude: 116.3425, phone: '010-12345689', realtime_status: 2, queue_count: 3, review_avg_score: 4.4 },
  { merchant_no: 'M013', name: '粤菜皇茶餐厅', short_name: '粤菜皇', business_type: 1, cuisine_types: '["粤菜"]', scene_tags: '["约会", "宿舍聚餐"]', feature_tags: '["精致美味"]', price_per_person: 58, price_level: 2, serve_speed: 2, region_id: 1, university_id: 1, address: '成府路35号五道口购物中心2层', latitude: 39.9924, longitude: 116.3375, phone: '010-12345690', realtime_status: 1, queue_count: 0, review_avg_score: 4.5 },
  { merchant_no: 'M014', name: '湘鄂情小厨', short_name: '湘鄂情', business_type: 1, cuisine_types: '["湘菜", "湖北菜"]', scene_tags: '["宿舍聚餐"]', feature_tags: '["辣得过瘾"]', price_per_person: 52, price_level: 2, serve_speed: 2, region_id: 2, university_id: 1, address: '成府路33号华联商厦3层', latitude: 39.9933, longitude: 116.3384, phone: '010-12345691', realtime_status: 1, queue_count: 1, review_avg_score: 4.3 },
  { merchant_no: 'M015', name: '星巴克·清华科技园店', short_name: '星巴克', business_type: 2, cuisine_types: '["咖啡"]', scene_tags: '["约会", "自习"]', feature_tags: '["环境好", "适合学习"]', price_per_person: 38, price_level: 3, serve_speed: 1, region_id: 4, university_id: 1, address: '清华科技园底商A座1层', latitude: 39.9983, longitude: 116.3304, phone: '010-12345692', realtime_status: 2, queue_count: 7, review_avg_score: 4.7 },
  { merchant_no: 'M016', name: '瑞幸咖啡·五道口店', short_name: '瑞幸咖啡', business_type: 2, cuisine_types: '["咖啡"]', scene_tags: '["课间快吃", "自习"]', feature_tags: '["性价比高"]', price_per_person: 20, price_level: 1, serve_speed: 1, region_id: 1, university_id: 1, address: '成府路35号五道口购物中心1层', latitude: 39.9925, longitude: 116.3376, phone: '010-12345693', realtime_status: 1, queue_count: 2, review_avg_score: 4.5 },
  { merchant_no: 'M017', name: '喜茶·五道口店', short_name: '喜茶', business_type: 2, cuisine_types: '["奶茶", "茶饮"]', scene_tags: '["约会"]', feature_tags: '["网红店", "拍照好看"]', price_per_person: 28, price_level: 2, serve_speed: 2, region_id: 2, university_id: 1, address: '成府路33号华联商厦1层', latitude: 39.9934, longitude: 116.3385, phone: '010-12345694', realtime_status: 4, queue_count: 15, review_avg_score: 4.6 },
  { merchant_no: 'M018', name: '奈雪的茶', short_name: '奈雪', business_type: 2, cuisine_types: '["奶茶", "茶饮"]', scene_tags: '["约会"]', feature_tags: '["欧包+茶"]', price_per_person: 32, price_level: 2, serve_speed: 2, region_id: 1, university_id: 1, address: '成府路35号五道口购物中心1层', latitude: 39.9926, longitude: 116.3377, phone: '010-12345695', realtime_status: 3, queue_count: 10, review_avg_score: 4.5 },
  { merchant_no: 'M019', name: 'CoCo都可·学院路店', short_name: 'CoCo', business_type: 2, cuisine_types: '["奶茶"]', scene_tags: '["课间快吃"]', feature_tags: '["平价好喝"]', price_per_person: 15, price_level: 1, serve_speed: 1, region_id: 3, university_id: 3, address: '学院路街道食尚坊1层', latitude: 39.9856, longitude: 116.3426, phone: '010-12345696', realtime_status: 1, queue_count: 0, review_avg_score: 4.2 },
  { merchant_no: 'M020', name: '蜜雪冰城', short_name: '蜜雪冰城', business_type: 2, cuisine_types: '["奶茶", "冰淇淋"]', scene_tags: '["课间快吃"]', feature_tags: '["超低价"]', price_per_person: 10, price_level: 1, serve_speed: 1, region_id: 5, university_id: 2, address: '颐和园路北大南门西侧', latitude: 39.9857, longitude: 116.3073, phone: '010-12345697', realtime_status: 1, queue_count: 1, review_avg_score: 4.0 },
  { merchant_no: 'M021', name: '护国寺小吃', short_name: '护国寺', business_type: 4, cuisine_types: '["北京菜", "小吃"]', scene_tags: '["课间快吃"]', feature_tags: '["老字号", "地道北京味"]', price_per_person: 25, price_level: 1, serve_speed: 1, region_id: 2, university_id: 1, address: '成府路33号华联商厦B1层', latitude: 39.9935, longitude: 116.3386, phone: '010-12345698', realtime_status: 1, queue_count: 0, review_avg_score: 4.4 },
  { merchant_no: 'M022', name: '庆丰包子铺', short_name: '庆丰包子', business_type: 4, cuisine_types: '["北京菜", "主食"]', scene_tags: '["课间快吃"]', feature_tags: '["老字号"]', price_per_person: 20, price_level: 1, serve_speed: 1, region_id: 4, university_id: 1, address: '清华科技园底商C座', latitude: 39.9984, longitude: 116.3305, phone: '010-12345699', realtime_status: 2, queue_count: 4, review_avg_score: 4.3 },
  { merchant_no: 'M023', name: '煎饼果子摊', short_name: '煎饼果子', business_type: 4, cuisine_types: '["小吃"]', scene_tags: '["课间快吃", "早餐"]', feature_tags: '["路边摊美味"]', price_per_person: 12, price_level: 1, serve_speed: 1, region_id: 3, university_id: 3, address: '学院路街道食尚坊门口', latitude: 39.9858, longitude: 116.3427, phone: '13800138000', realtime_status: 1, queue_count: 2, review_avg_score: 4.5 },
  { merchant_no: 'M024', name: '烤串一条街', short_name: '烤串街', business_type: 4, cuisine_types: '["烧烤", "小吃"]', scene_tags: '["深夜食堂", "宿舍聚餐"]', feature_tags: '["夜宵首选"]', price_per_person: 40, price_level: 2, serve_speed: 2, region_id: 3, university_id: 3, address: '学院路街道食尚坊后街', latitude: 39.9859, longitude: 116.3428, phone: '010-12345700', realtime_status: 1, queue_count: 0, review_avg_score: 4.4 },
  { merchant_no: 'M025', name: '兰州拉面', short_name: '兰州拉面', business_type: 4, cuisine_types: '["面食"]', scene_tags: '["课间快吃"]', feature_tags: '["正宗牛肉拉面"]', price_per_person: 18, price_level: 1, serve_speed: 1, region_id: 5, university_id: 2, address: '颐和园路北大南门东侧', latitude: 39.98510, longitude: 116.3074, phone: '010-12345701', realtime_status: 1, queue_count: 0, review_avg_score: 4.2 }
];

const products = [
  { product_no: 'P001', merchant_id: 1, name: '巨无霸套餐', sub_title: '经典牛肉汉堡+薯条+可乐', category_id: 1, original_price: 42, sale_price: 35, is_signature: 1, order_count_total: 1500 },
  { product_no: 'P002', merchant_id: 1, name: '麦辣鸡腿堡', sub_title: '香辣酥脆', category_id: 1, original_price: 22, sale_price: 18, is_signature: 1, order_count_total: 2300 },
  { product_no: 'P003', merchant_id: 1, name: '麦乐鸡', sub_title: '10块装', category_id: 1, original_price: 25, sale_price: 20, order_count_total: 1800 },
  { product_no: 'P004', merchant_id: 6, name: '鸳鸯锅底', sub_title: '麻辣+清汤', category_id: 8, original_price: 68, sale_price: 58, is_signature: 1, order_count_total: 890 },
  { product_no: 'P005', merchant_id: 6, name: '毛肚', sub_title: '七上八下', category_id: 8, original_price: 48, sale_price: 42, is_signature: 1, order_count_total: 1200 },
  { product_no: 'P006', merchant_id: 6, name: '鸭肠', sub_title: '新鲜脆嫩', category_id: 8, original_price: 38, sale_price: 32, order_count_total: 950 },
  { product_no: 'P007', merchant_id: 15, name: '拿铁', sub_title: '经典咖啡', category_id: 12, original_price: 35, sale_price: 32, is_signature: 1, order_count_total: 3200 },
  { product_no: 'P008', merchant_id: 15, name: '焦糖玛奇朵', sub_title: '甜蜜咖啡', category_id: 12, original_price: 38, sale_price: 35, order_count_total: 2100 },
  { product_no: 'P009', merchant_id: 17, name: '多肉葡萄', sub_title: '人气爆款', category_id: 14, original_price: 32, sale_price: 29, is_signature: 1, order_count_total: 5600 },
  { product_no: 'P010', merchant_id: 17, name: '芝芝莓莓', sub_title: '芝士奶盖', category_id: 14, original_price: 30, sale_price: 28, is_signature: 1, order_count_total: 4800 }
];

const reviews = [
  { target_type: 'merchant', target_id: 1, user_id: 1, overall_score: 4.5, taste_score: 4.5, environment_score: 4.0, service_score: 4.5, price_score: 4.0, content: '出餐很快，适合课间来吃，薯条很脆！', consume_amount: 35 },
  { target_type: 'merchant', target_id: 6, user_id: 1, overall_score: 5.0, taste_score: 5.0, environment_score: 4.5, service_score: 4.5, price_score: 4.5, content: '超级正宗的四川火锅，辣得够味！宿舍聚餐首选！', consume_amount: 280 },
  { target_type: 'merchant', target_id: 15, user_id: 1, overall_score: 4.8, taste_score: 4.5, environment_score: 5.0, service_score: 4.5, price_score: 4.0, content: '环境很好，适合自习，咖啡也很香。', consume_amount: 42 },
  { target_type: 'merchant', target_id: 17, user_id: 1, overall_score: 4.6, taste_score: 4.5, environment_score: 4.5, service_score: 4.0, price_score: 4.5, content: '多肉葡萄真的好好喝！就是排队有点久。', consume_amount: 58 },
  { target_type: 'merchant', target_id: 11, user_id: 1, overall_score: 4.7, taste_score: 4.5, environment_score: 4.0, service_score: 4.5, price_score: 5.0, content: '老北京味道，炸酱面很地道！', consume_amount: 38 }
];

// 插入数据函数
function insertData() {
  console.log('✓ 开始初始化数据...');

  // 插入大学
  const insertUni = db.prepare(`
    INSERT OR IGNORE INTO universities (name, short_name, english_name, province, city, district, address, latitude, longitude, school_type, student_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  universities.forEach(u => insertUni.run(u.name, u.short_name, u.english_name, u.province, u.city, u.district, u.address, u.latitude, u.longitude, u.school_type, u.student_count));
  console.log('✓ 大学数据初始化完成');

  // 插入商圈
  const insertRegion = db.prepare(`
    INSERT OR IGNORE INTO regions (region_no, name, short_name, region_type, province, city, district, address, latitude, longitude, university_id, distance_to_uni)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  regions.forEach(r => insertRegion.run(r.region_no, r.name, r.short_name, r.region_type, r.province, r.city, r.district, r.address, r.latitude, r.longitude, r.university_id, r.distance_to_uni));
  console.log('✓ 商圈数据初始化完成');

  // 插入分类
  const insertCat = db.prepare(`
    INSERT OR IGNORE INTO product_categories (parent_id, level, path, name, category_type, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  categories.forEach(c => insertCat.run(c.parent_id, c.level, c.path, c.name, c.category_type, c.sort_order));
  console.log('✓ 分类数据初始化完成');

  // 插入测试用户
  const bcrypt = require('bcryptjs');
  const hashedPassword = bcrypt.hashSync('123456', 10);
  
  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (id, nickname, avatar_url, university_id, user_type, password, phone)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertUser.run(1, '测试同学', '/assets/images/avatar_default.png', 1, 1, hashedPassword, '13800138001');
  insertUser.run(2, '商家老板', '/assets/images/avatar_default.png', 1, 2, hashedPassword, '13800138002');
  console.log('✓ 测试用户初始化完成');

  // 插入商家
  const insertMerchant = db.prepare(`
    INSERT OR IGNORE INTO merchants (merchant_no, name, short_name, business_type, cuisine_types, scene_tags, feature_tags, price_per_person, price_level, serve_speed, region_id, university_id, address, latitude, longitude, phone, realtime_status, queue_count, review_avg_score, owner_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  merchants.forEach((m, index) => {
    const ownerId = (m.name.includes('麦当劳') || m.name.includes('火锅')) ? 2 : null;
    insertMerchant.run(m.merchant_no, m.name, m.short_name, m.business_type, m.cuisine_types, m.scene_tags, m.feature_tags, m.price_per_person, m.price_level, m.serve_speed, m.region_id, m.university_id, m.address, m.latitude, m.longitude, m.phone, m.realtime_status, m.queue_count, m.review_avg_score, ownerId);
  });
  console.log('✓ 商家数据初始化完成');

  // 插入商品
  const insertProduct = db.prepare(`
    INSERT OR IGNORE INTO products (product_no, merchant_id, name, sub_title, category_id, original_price, sale_price, is_signature, order_count_total)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  products.forEach(p => insertProduct.run(p.product_no, p.merchant_id, p.name, p.sub_title, p.category_id, p.original_price, p.sale_price, p.is_signature, p.order_count_total));
  console.log('✓ 商品数据初始化完成');

  // 插入评价
  const insertReview = db.prepare(`
    INSERT OR IGNORE INTO reviews (target_type, target_id, user_id, overall_score, taste_score, environment_score, service_score, price_score, content, consume_amount)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  reviews.forEach(r => insertReview.run(r.target_type, r.target_id, r.user_id, r.overall_score, r.taste_score, r.environment_score, r.service_score, r.price_score, r.content, r.consume_amount));
  console.log('✓ 评价数据初始化完成');

  console.log('\n🎉 数据库初始化完成！');
  console.log('测试用户账号：');
  console.log('  普通用户：13800138001 / 123456');
  console.log('  商家用户：13800138002 / 123456');
}

// 执行
insertData();
db.close();
