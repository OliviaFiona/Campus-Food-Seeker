# 大学城美食地图 - AI执行Prompt

> 本Prompt用于指导AI Coding工具（Cursor/Copilot/Claude等）搭建前端页面

---

## 一、项目概述

开发一个面向大学生的本地化美食地图Web应用，覆盖大学城周边3-5公里范围的餐饮商户。核心功能是帮助大学生快速发现周边美食、查看实时客流、做出就餐决策。

**核心定位**: "校友吃什么，你看就知道"

---

## 二、技术栈（严格遵循）

```
前端框架: Next.js 14 (App Router)
开发语言: TypeScript
样式方案: Tailwind CSS
UI组件库: shadcn/ui (Radix UI基础)
状态管理: Zustand
数据请求: TanStack Query (React Query)
动画效果: Framer Motion
地图服务: 高德地图 JS API 2.0
图标库: Phosphor Icons / Lucide React
```

---

## 三、主页布局规范（必须严格遵循）

### 3.1 整体布局结构

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  [Logo] [北京▼]        🔍 搜索大学城美食...        🔔  👤          │   │  ← 顶部导航栏 (64px)
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│        ┌─────────────┐                                                       │
│        │ 📍 附近美食 │                                                       │
│        ├─────────────┤                                                       │
│        │ 🔥 热门推荐 │  ← 内含子标签：[今日热榜] [本周排行]                  │
│        ├─────────────┤                                                       │
│        │ ❤️ 我的收藏 │                                                       │
│        ├─────────────┤                                                       │
│        │ 🏷️ 场景标签 │                                                       │
│        │ [课间快吃]  │                                                       │
│        │ [宿舍聚餐]  │                                                       │
│        └─────────────┘                                                       │
│              ↑                                                               │
│        左侧导航栏 (200px, 固定)                                              │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    🗺️  全屏交互地图                                  │    │
│  │         📍 [拥挤度红环]                                             │    │
│  │           ┌─────┐                                                   │    │
│  │           │ 商户│  ← 点击后触发右侧滑出详情页                        │    │
│  │           └─────┘                                                   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│       ▲ ┌─────────────────────────────────────────────────────────────┐     │
│       │ │  [¥] [距离] [类型]           拖拽展开 ▲                    │     │
│       │ │  ───────────────────────────────────────────────────────────│     │
│       │ │  ← 横向滑动商户卡片流 →                                    │     │
│       │ │  ┌─────┐ ┌─────┐ ┌─────┐                                   │     │
│       │ │  │店A  │ │店B  │ │店C  │                                   │     │
│       │ │  └─────┘ └─────┘ └─────┘                                   │     │
│       │ │  📊 排行榜  |  🕐 最近浏览  ← 底部Sheet内Tab切换            │     │
│       │ └─────────────────────────────────────────────────────────────┘     │
│            © 2026 大学城美食地图 | 关于我们 | 隐私政策                        │
└───────────┴──────────────────────────────────────────────────────────────────┘
            ↑
    右侧滑出详情页（覆盖50%屏幕宽度）：
    ┌───────────────────────────────┐
    │ [大图] 麦当劳·清华东门店      │
    │ ⭐ 4.8  🚶 3分钟  💰 人均25  │
    │ [实时：拥挤]  [路线规划]      │
    │ 今日客流趋势图...             │
    └───────────────────────────────┘
```

### 3.2 布局参数规范

| 区域 | 位置 | 尺寸 | 行为 |
|-----|------|------|------|
| 顶部导航栏 | 顶部固定 | 64px高，100%宽 | 始终可见 |
| 左侧导航栏 | 左侧固定 | 200px宽 | 可折叠（移动端变抽屉） |
| 主地图区 | 中央 | 剩余空间 | 全屏交互，支持缩放拖拽 |
| 底部Sheet | 底部 | 默认收起100px，展开400px | 可拖拽展开/收起 |
| 右侧详情页 | 右侧滑出 | 50%屏幕宽度 | 点击标记后滑入 |
| Footer | 底部 | 小字 | 始终在最底部 |

---

## 四、设计风格规范

### 4.1 风格定位
- **粘土轻拟物风格**：柔和阴影、圆润边角、轻微立体感
- **青年活力感**：明快配色、流畅动效、有趣微交互
- **清透感**：充足留白、清晰层次、不拥挤

### 4.2 配色系统

```css
/* 主色 - 活力橙 */
--primary-50: #FFF7ED;
--primary-100: #FFEDD5;
--primary-200: #FED7AA;
--primary-300: #FDBA74;
--primary-400: #FB923C;
--primary-500: #F97316;  /* 主色 ★ */
--primary-600: #EA580C;
--primary-700: #C2410C;

/* 辅助色 - 清新绿 */
--secondary-500: #22C55E;  /* 成功/可用 */

/* 状态色 */
--status-idle: #22C55E;    /* 空闲 - 绿 */
--status-busy: #F59E0B;    /* 忙碌 - 黄 */
--status-full: #EF4444;    /* 满客 - 红 */
--status-queue: #8B5CF6;   /* 排队 - 紫 */

/* 中性色 */
--text-primary: #1F2937;
--text-secondary: #4B5563;
--bg-primary: #FFFFFF;
--border: #E5E7EB;
```

### 4.3 阴影规范（Clay效果）

```css
/* 卡片阴影 */
--shadow-card: 0 4px 20px rgba(0, 0, 0, 0.08);
--shadow-card-hover: 0 8px 30px rgba(0, 0, 0, 0.12);

/* 按钮阴影 */
--shadow-button: 0 4px 12px rgba(249, 115, 22, 0.3);

/* Clay内阴影 */
--clay-inset: inset 0 1px 0 rgba(255, 255, 255, 0.3);
```

### 4.4 圆角规范

```css
--radius-sm: 8px;    /* 小按钮、标签 */
--radius-md: 12px;   /* 输入框、小卡片 */
--radius-lg: 16px;   /* 卡片 */
--radius-xl: 20px;   /* 大卡片、模态框 */
--radius-full: 9999px; /* Pill形状 */
```

---

## 五、组件规范

### 5.1 商家卡片（底部Sheet内）

```tsx
// 卡片结构
<Card className="w-[280px] rounded-2xl shadow-card hover:shadow-card-hover 
                 hover:-translate-y-1 transition-all duration-200">
  {/* 封面图区域 */}
  <div className="relative h-[160px] rounded-t-2xl overflow-hidden">
    <Image src={cover} alt={name} fill className="object-cover" />
    {/* 状态标签 */}
    <Badge className="absolute top-3 left-3 bg-white/90 text-status-full">
      拥挤
    </Badge>
  </div>
  
  {/* 内容区域 */}
  <div className="p-4">
    <h3 className="text-lg font-semibold text-text-primary">{name}</h3>
    <div className="flex items-center gap-2 text-sm text-text-secondary mt-1">
      <span>⭐ {rating}</span>
      <span>·</span>
      <span>{cuisine}</span>
      <span>·</span>
      <span>¥{price}/人</span>
    </div>
    <div className="flex items-center gap-2 text-sm text-text-secondary mt-1">
      <span>📍 {distance}m</span>
      <span>·</span>
      <span className="text-status-full">🔥 {queueCount}人排队</span>
    </div>
    {/* 场景标签 */}
    <div className="flex gap-2 mt-3">
      {tags.map(tag => (
        <span key={tag} className="px-2 py-1 text-xs bg-primary-50 text-primary-700 
                                   rounded-full">
          {tag}
        </span>
      ))}
    </div>
  </div>
</Card>
```

### 5.2 地图标记

```tsx
// 地图标记组件
<Marker 
  position={[lng, lat]}
  status="busy"  // idle | busy | full | queue
>
  {/* 外环 - 拥挤度指示 */}
  <div className={cn(
    "w-12 h-12 rounded-full flex items-center justify-center",
    "border-4 bg-white shadow-lg",
    status === 'idle' && "border-status-idle",
    status === 'busy' && "border-status-busy",
    status === 'full' && "border-status-full",
    status === 'queue' && "border-status-queue",
  )}>
    {/* 图标 */}
    <Icon className="w-6 h-6 text-gray-700" />
  </div>
</Marker>
```

### 5.3 底部Sheet

```tsx
// 底部可拖拽Sheet
<Sheet 
  defaultOpen={false}
  snapPoints={[100, 400]}  // 收起高度, 展开高度
>
  {/* 拖拽把手 */}
  <div className="w-full h-6 flex items-center justify-center cursor-grab">
    <div className="w-12 h-1 bg-gray-300 rounded-full" />
  </div>
  
  {/* 快捷筛选栏 */}
  <div className="flex gap-2 px-4 py-2">
    <FilterButton icon="¥" label="价格" />
    <FilterButton icon="📍" label="距离" />
    <FilterButton icon="🍜" label="类型" />
  </div>
  
  {/* 商户卡片流 - 横向滑动 */}
  <div className="flex gap-4 overflow-x-auto px-4 py-2 scrollbar-hide">
    {merchants.map(merchant => (
      <MerchantCard key={merchant.id} {...merchant} />
    ))}
  </div>
  
  {/* Tab切换区 */}
  <Tabs defaultValue="ranking">
    <TabsList className="w-full">
      <TabsTrigger value="ranking">📊 排行榜</TabsTrigger>
      <TabsTrigger value="history">🕐 最近浏览</TabsTrigger>
    </TabsList>
    <TabsContent value="ranking">
      <RankingList />
    </TabsContent>
    <TabsContent value="history">
      <HistoryList />
    </TabsContent>
  </Tabs>
</Sheet>
```

### 5.4 右侧滑出详情页

```tsx
// 右侧滑出详情面板
<SlidePanel 
  open={selectedMerchant !== null}
  onClose={() => setSelectedMerchant(null)}
  width="50%"
  position="right"
>
  {/* 大图封面 */}
  <div className="relative h-[200px]">
    <Image src={cover} alt={name} fill className="object-cover" />
    <Button 
      variant="ghost" 
      size="icon"
      className="absolute top-4 right-4 bg-white/80"
      onClick={onClose}
    >
      <X className="w-5 h-5" />
    </Button>
  </div>
  
  {/* 商家信息 */}
  <div className="p-6">
    <h2 className="text-2xl font-bold">{name}</h2>
    <div className="flex items-center gap-4 mt-2 text-sm">
      <span className="flex items-center gap-1">
        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
        {rating}
      </span>
      <span>🚶 {walkTime}分钟</span>
      <span>💰 人均{price}</span>
    </div>
    
    {/* 实时状态 */}
    <div className="flex items-center gap-4 mt-4">
      <Badge className="bg-status-full text-white">实时：拥挤</Badge>
      <Button variant="outline" size="sm">
        <Navigation className="w-4 h-4 mr-1" />
        路线规划
      </Button>
    </div>
    
    {/* 客流趋势图 */}
    <div className="mt-6">
      <h3 className="text-sm font-medium text-text-secondary mb-2">今日客流趋势</h3>
      <TrafficChart data={trafficData} />
    </div>
  </div>
</SlidePanel>
```

---

## 六、动效规范

### 6.1 微交互清单

| 交互场景 | 动效 | 时长 | 缓动函数 |
|---------|------|------|---------|
| 卡片悬停 | translateY(-4px) + shadow增强 | 200ms | cubic-bezier(0.4, 0, 0.2, 1) |
| 卡片点击 | scale(0.98) | 100ms | ease-in-out |
| 收藏点击 | 心形scale弹跳(1→1.3→1) + 粒子效果 | 400ms | spring |
| 底部Sheet展开 | translateY动画 | 300ms | ease-out |
| 右侧详情滑入 | translateX(100%→0) | 300ms | ease-out |
| 地图标记点击 | 标记弹跳 + 其他标记淡化 | 300ms | ease-out |
| 列表加载 | fadeIn + translateY, stagger 50ms | 300ms | ease-out |

### 6.2 Framer Motion示例

```tsx
// 卡片悬停动效
<motion.div
  whileHover={{ y: -4 }}
  whileTap={{ scale: 0.98 }}
  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
>
  <MerchantCard />
</motion.div>

// 列表stagger加载
<motion.div
  initial="hidden"
  animate="visible"
  variants={{
    visible: { transition: { staggerChildren: 0.05 } }
  }}
>
  {merchants.map(merchant => (
    <motion.div
      key={merchant.id}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
    >
      <MerchantCard {...merchant} />
    </motion.div>
  ))}
</motion.div>

// 右侧详情滑入
<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed right-0 top-0 h-full w-1/2 bg-white shadow-2xl"
    >
      <MerchantDetail />
    </motion.div>
  )}
</AnimatePresence>
```

---

## 七、页面路由结构

```
app/
├── page.tsx                    # 首页（地图+底部Sheet）
├── layout.tsx                  # 根布局
├── globals.css                 # 全局样式
│
├── search/
│   └── page.tsx               # 搜索页
│
├── merchant/
│   └── [id]/
│       └── page.tsx           # 商家详情页
│
├── ranking/
│   └── page.tsx               # 排行榜页
│
├── profile/
│   └── page.tsx               # 个人中心
│
├── favorites/
│   └── page.tsx               # 我的收藏
│
├── history/
│   └── page.tsx               # 浏览历史
│
├── reviews/
│   └── page.tsx               # 我的评价
│
└── settings/
    └── page.tsx               # 设置页
```

---

## 八、数据结构定义

```typescript
// 商家类型
interface Merchant {
  id: string;
  name: string;
  coverImage: string;
  rating: number;
  pricePerPerson: number;
  distance: number;
  location: {
    lat: number;
    lng: number;
  };
  realtimeStatus: 'idle' | 'busy' | 'full' | 'queue';
  queueCount: number;
  waitTime: number;
  cuisine: string;
  sceneTags: string[];
  isOpen: boolean;
}

// 用户类型
interface User {
  id: string;
  nickname: string;
  avatar: string;
  university: string;
  favorites: string[];
}

// 评价类型
interface Review {
  id: string;
  userId: string;
  merchantId: string;
  rating: number;
  content: string;
  images: string[];
  createdAt: string;
}
```

---

## 九、开发顺序（优先级）

### Phase 1: 核心骨架
1. ✅ 项目初始化 (Next.js + shadcn/ui)
2. ✅ 全局样式配置 (Tailwind + 配色系统)
3. ✅ 布局框架 (顶部导航 + 左侧导航 + 主内容区)
4. ✅ 高德地图接入 (基础地图显示)

### Phase 2: 核心功能
5. ✅ 地图标记组件 (带拥挤度红环)
6. ✅ 底部Sheet组件 (可拖拽展开)
7. ✅ 商家卡片组件
8. ✅ 右侧滑出详情页
9. ✅ 地图与卡片联动 (点击标记→显示详情)

### Phase 3: 交互完善
10. ✅ 搜索功能
11. ✅ 筛选排序
12. ✅ 收藏功能
13. ✅ 排行榜/最近浏览Tab

### Phase 4: 数据对接
14. ✅ API接口对接
15. ✅ 数据状态管理
16. ✅ 加载/空状态处理

---

## 十、代码规范

### 10.1 文件命名
- 组件: PascalCase (MerchantCard.tsx)
- 页面: page.tsx (Next.js约定)
- 工具函数: camelCase (formatDistance.ts)
- 类型定义: PascalCase + 后缀 (types/merchant.ts)

### 10.2 组件结构
```tsx
// 导入顺序: 库 → 组件 → 工具 → 类型
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Merchant } from '@/types/merchant';

// Props类型定义
interface MerchantCardProps {
  merchant: Merchant;
  onClick?: (id: string) => void;
}

// 组件实现
export function MerchantCard({ merchant, onClick }: MerchantCardProps) {
  // 状态定义
  const [isHovered, setIsHovered] = useState(false);
  
  // 事件处理
  const handleClick = () => {
    onClick?.(merchant.id);
  };
  
  // 渲染
  return (
    <Card onClick={handleClick}>
      {/* ... */}
    </Card>
  );
}
```

---

## 十一、注意事项

1. **地图性能**: 标记过多时使用聚合(MarkerCluster)，视口外标记不渲染
2. **移动端适配**: 左侧导航变抽屉，底部Sheet全宽，右侧详情全屏
3. **图片优化**: 使用next/image，配置合适的sizes和priority
4. **无障碍**: 按钮有aria-label，图片有alt，颜色对比度符合WCAG标准
5. **错误处理**: API请求有loading和error状态，用户友好提示

---

*Prompt版本: v1.0*  
*创建日期: 2026-03-14*  
*适用范围: 前端页面搭建*
