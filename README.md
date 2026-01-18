# You and Me - 情侣电子流审批小程序

<div align="center">
  <h3>💑 让情侣间的消费管理更简单、更透明</h3>
  <p>基于微信小程序云开发的情侣电子流审批系统</p>
</div>

## 📱 项目简介

You and Me 是一个专为情侣设计的电子流审批小程序，帮助情侣管理日常消费申请、审批流程和支出统计。采用微信云开发技术，使用 TDesign 组件库构建，提供美观流畅的用户体验。

## ✨ 核心功能

### 🔐 用户系统
- [x] 微信授权登录
- [x] 用户信息管理
- [x] 伴侣绑定功能
- [x] 6位绑定码（24小时有效）
- [x] 登录状态检查

### 📝 电子流管理
- [x] 创建电子流申请
- [x] 三种申请类型（拨款、出行、其他）
- [x] 金额管理（选择"其他"时金额选填）
- [x] 电子流列表（我的待办/我的申请/已完成）
- [x] 类型筛选功能

### ✅ 审批功能
- [x] 查看电子流详情
- [x] 审批通过/驳回
- [x] 驳回原因填写
- [x] 审批流程时间线
- [x] 重新编辑已驳回申请

### 📊 数据统计
- [x] 月度/年度支出统计
- [x] 分类支出统计图表
- [x] 支出趋势分析
- [x] 通过率统计
- [x] 统计摘要（日均支出、最大单笔等）

### ⚙️ 用户设置
- [x] 个人信息展示
- [x] 伴侣关系管理
- [x] 生成/输入绑定码
- [x] 清除缓存
- [x] 退出登录

## 🛠 技术栈

- **框架**: 微信小程序原生开发
- **组件库**: TDesign Miniprogram v1.12.1
- **后端**: 微信云开发
  - 云函数
  - 云数据库
  - 云存储（可选）
- **开发工具**: 微信开发者工具

## 📂 项目结构

```
miniprogram-2/
├── cloudfunctions/              # 云函数
│   └── userLogin/              # 用户登录云函数
│       ├── index.js
│       ├── config.json
│       └── package.json
├── miniprogram/                 # 小程序代码
│   ├── pages/                  # 页面目录
│   │   ├── login/             # 登录页
│   │   ├── home/              # 首页
│   │   ├── editFlow/          # 创建/编辑页
│   │   ├── flow-detail/       # 详情页
│   │   ├── statistics/        # 统计页
│   │   └── settings/          # 设置页
│   ├── components/             # 组件目录
│   ├── images/                 # 图片资源
│   ├── app.js                  # 小程序入口
│   ├── app.json               # 全局配置
│   ├── app.wxss               # 全局样式
│   └── package.json           # 依赖配置
├── docs/                        # 文档目录
│   ├── prd.md                 # 需求文档
│   ├── database-schema.md     # 数据库设计
│   └── login-guide.md         # 登录功能指南
└── prototype/                   # 原型图
    ├── index.html
    ├── home.html
    ├── editFlow.html
    ├── flow-detail.html
    └── statistics.html
```

## 🚀 快速开始

### 1. 环境准备

- 安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
- 注册微信小程序账号
- 开通云开发服务

### 2. 安装依赖

```bash
cd miniprogram
npm install
```

### 3. 配置云开发

1. 在微信开发者工具中打开项目
2. 点击"云开发"按钮，创建云开发环境
3. 记录环境ID，在 `miniprogram/app.js` 中配置：

```javascript
env: "your-env-id"  // 替换为你的环境ID
```

### 4. 创建数据库集合

在云开发控制台 -> 数据库中创建以下集合：
- `users` - 用户表
- `flows` - 电子流表
- `statistics` - 统计表（可选）

详细结构见 [数据库设计文档](./docs/database-schema.md)

### 5. 部署云函数

右键点击 `cloudfunctions/userLogin`，选择"上传并部署：云端安装依赖"

### 6. 构建 npm

在微信开发者工具中：
1. 工具 -> 构建 npm
2. 等待构建完成

### 7. 运行项目

点击编译，在真机上预览测试

## 📖 使用说明

### 新用户流程

1. **登录** - 点击"微信授权登录"
2. **绑定伴侣** - 生成或输入绑定码
3. **开始使用** - 创建电子流申请

### 伴侣绑定

**方式一：生成绑定码**
1. 进入设置页面
2. 点击"生成绑定码"
3. 获得6位数字码
4. 分享给伴侣

**方式二：输入绑定码**
1. 进入设置页面
2. 切换到"输入绑定码"
3. 输入对方的绑定码
4. 完成绑定

## 🎨 设计规范

### 颜色系统（TDesign 风格）

| 颜色 | 色值 | 用途 |
|------|------|------|
| 主题色 | #0052D9 | 按钮、强调元素 |
| 成功色 | #029B6C | 已完成、成功状态 |
| 警告色 | #E37318 | 待审批、警告提示 |
| 错误色 | #D54941 | 已驳回、错误状态 |
| 辅助色 | #666666 | 辅助文字 |

### 间距规范

- 小间距：16rpx (8)
- 中间距：24rpx (12)
- 大间距：32rpx (16)
- 特大间距：48rpx (24)

### 圆角规范

- 卡片：16rpx
- 按钮：12rpx
- 标签：8rpx
- 头像：50%

## 📊 数据库设计

### users 表

```javascript
{
  _openid: String,           // 用户openid
  nickName: String,          // 昵称
  avatarUrl: String,         // 头像
  partnerId: String,         // 伴侣openid
  relationStatus: String,    // 关系状态
  bindCode: String,          // 绑定码
  bindCodeExpireTime: Date,  // 过期时间
  createTime: Date,
  updateTime: Date
}
```

### flows 表

```javascript
{
  applicantId: String,       // 申请人
  approverId: String,        // 审批人
  content: String,           // 内容
  amount: Number,            // 金额
  type: String,              // 类型
  status: String,            // 状态
  createTime: Date,
  approveTime: Date
}
```

详细设计见 [数据库设计文档](./docs/database-schema.md)

## 🔒 安全说明

1. **数据库权限**：已设置仅创建者可读写
2. **云函数安全**：自动获取 openid，前端无需传递
3. **绑定码机制**：24小时有效，使用后立即清空
4. **本地存储**：仅存储必要的用户信息

## 📝 待办事项

- [ ] 实现解除绑定功能
- [ ] 添加消息通知（订阅消息）
- [ ] 支持图片凭证上传
- [ ] 电子流搜索功能
- [ ] 数据导出功能
- [ ] 多人绑定（家庭组）
- [ ] 主题切换功能

## 🤝 参与贡献

欢迎提交 Issue 和 Pull Request！

## 📄 开源协议

MIT License

## 👥 联系方式

如有问题或建议，欢迎提出 Issue。

---<div align="center">
  <p>Made with ❤️ for couples</p>
  <p>© 2024 You and Me. All rights reserved.</p>
</div>
