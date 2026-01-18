# 设置页面使用指南

## 功能概述

设置页面提供用户个人信息管理、伴侣绑定、以及其他系统设置功能。

## 已实现功能

### 1. 用户信息展示
- ✅ 显示用户头像
- ✅ 显示用户昵称
- ✅ 显示注册时间

### 2. 伴侣关系管理

#### 生成绑定码
- ✅ 点击"生成绑定码"按钮
- ✅ 调用云函数生成6位数字码
- ✅ 显示绑定码和有效期（24小时）
- ✅ 一键复制绑定码

#### 输入绑定码
- ✅ 输入对方的绑定码
- ✅ 点击"确认绑定"
- ✅ 验证绑定码有效性
- ✅ 建立双向绑定关系
- ✅ **绑定成功后自动跳转到首页** ✨

#### 解除绑定
- ✅ 点击"解除绑定"按钮
- ✅ 弹出确认对话框
- ✅ 确认后解除关系

### 3. 其他设置
- ✅ 清除缓存
- ✅ 关于我们（版本信息）
- ✅ 退出登录

## 伴侣绑定流程

### 用户 A 生成绑定码
```
点击"生成绑定码"
  ↓
调用 userLogin.generateCode
  ↓
显示 6 位数字码
  ↓
复制并分享给伴侣
```

### 用户 B 输入绑定码
```
切换到"输入绑定码"
  ↓
输入用户 A 的绑定码
  ↓
点击"确认绑定"
  ↓
调用 userLogin.bindPartner
  ↓
验证码有效性
  ↓
建立双向绑定
  ↓
显示"绑定成功"提示
  ↓
自动刷新用户信息
  ↓
检测到绑定成功
  ↓
显示"绑定成功，即将跳转首页"
  ↓
1.5秒后自动跳转到首页 ✨
```

## 自动跳转逻辑

### 触发条件
只有满足以下**所有条件**时才会自动跳转：
1. ✅ 操作来自"绑定伴侣"（不是页面刷新）
2. ✅ 绑定操作成功执行
3. ✅ 用户信息刷新成功
4. ✅ `relationStatus === 'paired'`（已配对）

### 跳转方式
```javascript
// 使用 wx.reLaunch 跳转
wx.reLaunch({
  url: '/pages/home/index'
});
```

**为什么用 `reLaunch`？**
- 清空页面栈，用户无法返回设置页
- 回到首页，开始正常使用流程
- 避免页面堆栈混乱

### 用户体验
1. 用户在设置页输入绑定码
2. 点击"确认绑定"
3. 显示"绑定成功"Toast（绿色提示）
4. 显示"绑定成功，即将跳转首页"Toast
5. 等待 1.5 秒（用户看到成功提示）
6. 自动跳转到首页
7. 首页显示已绑定伴侣的信息

## 代码实现

### refreshUserInfo 函数
```javascript
refreshUserInfo() {
  const fromBinding = this.data.binding; // 记录是否来自绑定操作
  wx.showLoading({ title: '加载中...' });
  
  wx.cloud.callFunction({
    name: 'userLogin',
    data: {
      action: 'login',
      userInfo: this.data.userInfo
    },
    success: (res) => {
      if (res.result && res.result.success) {
        const userData = res.result.data.userInfo;
        
        // 保存用户信息
        wx.setStorageSync('userInfo', userData);
        app.globalData.userInfo = userData;
        
        // 更新页面数据
        this.setData({
          userInfo: userData,
          inputCode: '',
          binding: false
        });

        // 如果是绑定操作且绑定成功，跳转到首页
        if (fromBinding && userData.relationStatus === 'paired') {
          Toast({
            message: '绑定成功，即将跳转首页',
            theme: 'success',
          });

          setTimeout(() => {
            wx.reLaunch({
              url: '/pages/home/index'
            });
          }, 1500);
        }
      }
    }
  });
}
```

### 关键变量
- `fromBinding`：标记是否来自绑定操作
  - 绑定时：`binding: true`
  - 刷新后：`binding: false`
- `relationStatus`：关系状态
  - `'pending'`：待绑定
  - `'paired'`：已绑定

## 其他场景

### 场景1：从登录页跳转设置页
- 用户未绑定伴侣
- 从登录页选择"前往设置"
- 在设置页绑定成功
- **自动跳转首页** ✅

### 场景2：在设置页主动绑定
- 用户在首页点击设置
- 进入设置页绑定伴侣
- 绑定成功
- **自动跳转首页** ✅

### 场景3：解除绑定
- 用户在设置页解除绑定
- 解除成功后**不跳转**
- 留在设置页，可重新绑定

### 场景4：页面刷新
- 用户在设置页下拉刷新
- 刷新用户信息
- **不跳转**（因为不是绑定操作）

## 状态管理

### binding 标志
```javascript
// 开始绑定
onBindPartner() {
  this.setData({ binding: true });
  // 调用云函数...
}

// 绑定完成（成功或失败）
refreshUserInfo() {
  const fromBinding = this.data.binding; // 记录状态
  // ...
  this.setData({ binding: false }); // 重置状态
}
```

### relationStatus 状态
| 状态 | 说明 | 操作 |
|------|------|------|
| pending | 待绑定 | 显示绑定功能 |
| paired | 已绑定 | 显示伴侣信息和解绑按钮 |

## 用户反馈

### Toast 提示顺序
1. **绑定开始**：`wx.showLoading({ title: '绑定中...' })`
2. **绑定成功**：`Toast({ message: '绑定成功', theme: 'success' })`
3. **刷新信息**：`wx.showLoading({ title: '加载中...' })`
4. **即将跳转**：`Toast({ message: '绑定成功，即将跳转首页', theme: 'success' })`
5. **执行跳转**：`wx.reLaunch({ url: '/pages/home/index' })`

### 时间间隔
- 绑定成功 → 刷新信息：1.5秒
- 刷新完成 → 跳转首页：1.5秒
- 总耗时：约3秒

## 测试步骤

### 测试绑定并跳转
1. 用户 A 登录，进入设置页
2. 点击"生成绑定码"
3. 复制绑定码
4. 用户 B 登录，进入设置页
5. 切换到"输入绑定码"
6. 粘贴用户 A 的绑定码
7. 点击"确认绑定"
8. 观察提示信息
9. **验证自动跳转到首页** ✅
10. 首页显示已绑定状态

### 测试不跳转场景
1. 用户已绑定，进入设置页
2. 下拉刷新页面
3. **验证不跳转** ✅
4. 留在设置页

## 常见问题

### Q1: 绑定成功但没跳转？
**A:** 检查以下几点：
1. `binding` 标志是否正确设置
2. `relationStatus` 是否为 `'paired'`
3. 查看控制台错误信息
4. 确认 `wx.reLaunch` 调用成功

### Q2: 跳转时机不对？
**A:**
- 应该在用户信息刷新**完成后**跳转
- 不应该在绑定请求发送后立即跳转
- 确保有足够的提示时间（1.5秒）

### Q3: 其他操作也触发跳转？
**A:**
- 检查 `fromBinding` 条件
- 确保只有绑定操作设置 `binding: true`
- 其他操作不应该触发跳转

### Q4: 跳转后首页数据不对？
**A:**
- 首页 `onShow` 会重新加载数据
- 使用 `wx.reLaunch` 会清空页面栈
- 首页会重新初始化

## 相关文件

- `/miniprogram/pages/settings/index.wxml` - 页面结构
- `/miniprogram/pages/settings/index.js` - 页面逻辑（包含跳转逻辑）
- `/miniprogram/pages/settings/index.wxss` - 页面样式
- `/cloudfunctions/userLogin/index.js` - 云函数（绑定功能）

## 总结

设置页面现在已经实现了伴侣绑定成功后的自动跳转功能：

- ✅ 绑定成功后自动跳转首页
- ✅ 友好的用户提示
- ✅ 合理的时间间隔
- ✅ 清空页面栈避免混乱
- ✅ 不影响其他操作（刷新、解绑等）

这个功能大大提升了用户体验，让绑定流程更加流畅自然！🎉
