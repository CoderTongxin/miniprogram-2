# 用户登录注册功能使用指南

## 功能概述

本小程序已实现完整的用户登录注册和伴侣绑定功能，基于微信云开发实现。

## 核心功能

### 1. 用户登录/注册
- 微信授权登录
- 自动创建用户记录
- 用户信息本地缓存
- 登录状态检查

### 2. 伴侣绑定
- 生成6位绑定码（24小时有效）
- 输入绑定码完成绑定
- 双向绑定关系
- 解除绑定功能

### 3. 用户管理
- 查看用户信息
- 查看伴侣关系
- 退出登录
- 清除缓存

## 部署步骤

### 第一步：开通云开发

1. 打开微信开发者工具
2. 点击"云开发"按钮
3. 创建云开发环境（如果还没有）
4. 记录环境ID

### 第二步：配置环境ID

在 `miniprogram/app.js` 中配置你的云开发环境ID：

```javascript
env: "your-env-id"  // 替换为你的环境ID
```

### 第三步：创建云数据库集合

在云开发控制台 -> 数据库中，创建以下集合：

1. **users** - 用户表
   - 权限设置：仅创建者可读写
   
2. **flows** - 电子流表
   - 权限设置：
     - 读：`auth.openid == doc.applicantId || auth.openid == doc.approverId`
     - 写：`auth.openid == doc._openid`

3. **statistics** - 统计表（可选）
   - 权限设置：仅创建者可读

### 第四步：部署云函数

1. 右键点击 `cloudfunctions/userLogin` 文件夹
2. 选择"上传并部署：云端安装依赖"
3. 等待部署完成

### 第五步：添加 Logo 图片

将小程序 Logo 放置到 `/miniprogram/images/logo.png`

如果没有 Logo，可以使用占位图或创建一个简单的图标。

### 第六步：测试登录功能

1. 在模拟器中预览小程序
2. 点击"微信授权登录"按钮
3. 在真机上测试（模拟器可能无法完整测试授权）

## 数据库结构

### users 集合

```javascript
{
  _id: "",                    // 自动生成
  _openid: "",                // 用户openid（云开发自动获取）
  nickName: "",               // 用户昵称
  avatarUrl: "",              // 用户头像
  partnerId: "",              // 伴侣openid
  partnerNickName: "",        // 伴侣昵称
  partnerAvatarUrl: "",       // 伴侣头像
  relationStatus: "",         // single/pending/paired
  bindCode: "",               // 绑定码
  bindCodeExpireTime: null,   // 过期时间
  createTime: null,           // 创建时间
  updateTime: null            // 更新时间
}
```

## 云函数说明

### userLogin 云函数

支持以下操作：

#### 1. login - 登录/注册

```javascript
wx.cloud.callFunction({
  name: 'userLogin',
  data: {
    action: 'login',
    userInfo: {
      nickName: '',
      avatarUrl: '',
      gender: 0
    }
  }
})
```

#### 2. generateCode - 生成绑定码

```javascript
wx.cloud.callFunction({
  name: 'userLogin',
  data: {
    action: 'generateCode'
  }
})
```

#### 3. bindPartner - 绑定伴侣

```javascript
wx.cloud.callFunction({
  name: 'userLogin',
  data: {
    action: 'bindPartner',
    bindCode: '123456'
  }
})
```

## 使用流程

### 新用户首次使用

1. 打开小程序 → 进入登录页
2. 点击"微信授权登录" → 授权用户信息
3. 登录成功 → 显示未绑定伴侣提示
4. 点击"去绑定" → 进入设置页面
5. 选择"生成绑定码"或"输入绑定码"
6. 完成绑定 → 可以正常使用

### 伴侣绑定流程

**方式一：生成绑定码**

1. 用户A进入设置页
2. 点击"生成绑定码"
3. 获得6位数字绑定码
4. 将绑定码发送给用户B
5. 用户B输入绑定码完成绑定

**方式二：输入绑定码**

1. 用户B进入设置页
2. 切换到"输入绑定码"标签
3. 输入用户A提供的绑定码
4. 点击"确认绑定"
5. 绑定成功

## 页面路由

```javascript
/pages/login/index         // 登录页（首页）
/pages/home/index          // 应用首页
/pages/settings/index      // 设置页（伴侣绑定）
/pages/editFlow/index      // 创建电子流
/pages/flow-detail/index   // 电子流详情
/pages/statistics/index    // 数据统计
```

## 安全建议

### 1. 数据库权限

确保设置正确的数据库权限规则：

```json
{
  "read": "auth.openid == doc._openid || auth.openid == doc.partnerId",
  "write": "auth.openid == doc._openid"
}
```

### 2. 云函数权限

云函数自动获取用户的 openid，无需前端传递，更安全。

### 3. 敏感信息

不要在前端存储敏感信息，如完整的 openid。

### 4. 绑定码安全

- 绑定码24小时有效
- 使用后立即清空
- 只能使用一次

## 常见问题

### Q1: 登录失败怎么办？

**A:** 检查以下几点：
1. 云开发环境ID是否正确
2. 云函数是否已部署
3. 数据库集合是否已创建
4. 是否在真机上测试（模拟器授权有限制）

### Q2: 绑定码无效？

**A:** 可能的原因：
1. 绑定码已过期（24小时）
2. 绑定码已被使用
3. 输入错误

### Q3: 如何解除绑定？

**A:** 在设置页点击"解除绑定"按钮（功能待完善）

### Q4: 用户数据如何迁移？

**A:** 可以在云开发控制台导出数据库数据

## 下一步优化

1. [ ] 实现解除绑定功能
2. [ ] 添加绑定申请确认机制
3. [ ] 支持多人绑定（扩展为家庭组）
4. [ ] 添加用户信息编辑功能
5. [ ] 实现手机号绑定
6. [ ] 添加实名认证

## 技术支持

如遇到问题，请检查：
1. 微信开发者工具控制台错误信息
2. 云开发控制台日志
3. 数据库权限设置

## 相关文档

- [微信小程序云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)
- [云函数文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/functions.html)
- [云数据库文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/database.html)
