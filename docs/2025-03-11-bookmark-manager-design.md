# 个人导航页（Bookmark Manager）设计文档

## 1. 项目概述

- **项目名称**：个人导航页 / Bookmark Manager
- **项目类型**：Web 应用（Next.js）
- **核心功能**：用户可以注册登录，创建自己的网站分类，添加常用网站链接，自动抓取预览图，以卡片形式展示
- **目标用户**：个人用户，用于整理日常使用的网站链接

## 2. 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | Next.js 16 (App Router) |
| 语言 | TypeScript |
| 样式 | Tailwind CSS |
| 数据库 | PostgreSQL (Neon) |
| ORM | Prisma |
| 认证 | NextAuth.js (邮箱/密码) |
| 部署 | Vercel |
| 预览图抓取 | screenshot API / LinkPreview API |

## 3. 功能需求

### 3.1 用户系统

- **注册**：邮箱 + 密码
- **登录**：邮箱 + 密码
- **会话管理**：使用 NextAuth.js
- **数据隔离**：每个用户只能看到自己的分类和网站

### 3.2 分类管理

- 创建分类（名称 + 颜色/图标）
- 编辑分类
- 删除分类（级联删除下属网站）
- 分类排序（手动拖拽或上下移动）
- 单级分类，不支持多级

### 3.3 网站管理

- 添加网站（URL + 标题 + 分类）
- 自动抓取网站预览图（通过第三方 API）
- 手动编辑网站信息（标题、URL、分类）
- 删除网站
- 网站排序

### 3.4 预览图功能

- 添加网站时自动抓取预览图
- 预览图尺寸：紧凑小卡片（约 120x80px 或类似比例）
- 失败时显示默认占位图

### 3.5 首页展示

- 用户登录后显示其所有分类和网站
- 小卡片网格布局（每行 4-6 个，视屏幕宽度）
- 点击卡片跳转到对应网站
- 支持暗黑模式（可选，后续迭代）

## 4. 数据模型

### User
```
- id: string (UUID)
- email: string (unique)
- password: string (hashed)
- name: string (optional)
- createdAt: DateTime
- updatedAt: DateTime
```

### Category
```
- id: string (UUID)
- userId: string (foreign key)
- name: string
- color: string (hex, optional)
- icon: string (optional, emoji or icon name)
- order: integer
- createdAt: DateTime
- updatedAt: DateTime
```

### Bookmark
```
- id: string (UUID)
- userId: string (foreign key)
- categoryId: string (foreign key)
- title: string
- url: string
- favicon: string (optional)
- thumbnail: string (optional, preview image URL)
- order: integer
- createdAt: DateTime
- updatedAt: DateTime
```

## 5. 页面结构

```
/                   # 首页（未登录 -> 登录页，登录后 -> 个人导航页）
/login              # 登录页
/register           # 注册页
/dashboard          # 个人导航页（主页面）
/dashboard/category # 分类管理
/dashboard/add      # 添加网站
```

## 6. API 设计

### Auth
- POST /api/auth/register - 注册
- POST /api/auth/login - 登录（NextAuth 处理）

### Categories (需要认证)
- GET /api/categories - 获取用户分类
- POST /api/categories - 创建分类
- PUT /api/categories/[id] - 更新分类
- DELETE /api/categories/[id] - 删除分类

### Bookmarks (需要认证)
- GET /api/bookmarks - 获取用户网站（可按分类筛选）
- POST /api/bookmarks - 添加网站（自动抓取预览图）
- PUT /api/bookmarks/[id] - 更新网站
- DELETE /api/bookmarks/[id] - 删除网站

### Preview (内部服务)
- POST /api/preview/fetch - 调用第三方 API 抓取网站预览图

## 7. UI/UX 设计方向

### 布局
- 顶部：用户信息 + 登出按钮
- 左侧/顶部：分类标签栏（可点击筛选）
- 主体：网格布局展示网站卡片

### 卡片样式（小卡片）
- 尺寸：约 160x120px 或自适应
- 内容：预览图（占 70% 区域）+ 标题（占 30% 区域）
- 悬停效果：轻微放大或边框高亮
- 点击行为：跳转到目标网站（在新标签页打开）

### 配色
- 简洁风格，以白色/浅灰色为底
- 分类用不同颜色标签区分

## 8. 第三方服务

### 预览图抓取
- 方案：使用 screenshot API 或 linkpreview API
- 免费额度：先调研免费方案，不够再考虑付费

### 部署
- Vercel：前端 + Serverless API
- Neon：PostgreSQL 数据库

## 9. 后续迭代（不包含在第一版）

- 暗黑模式
- 网站搜索
- 导入/导出书签
- 分享公开页面
- 标签系统
- 批量操作

---

**设计版本**：v1.0
**创建日期**：2025-03-11
**状态**：待用户审批
