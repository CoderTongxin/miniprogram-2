# 首页功能使用指南

## 功能概述

首页已完成真实的云开发功能，可以从云数据库获取电子流数据。

## 已实现功能

### 1. 数据获取
- ✅ 从云数据库实时获取电子流列表
- ✅ 根据Tab自动筛选数据（我的待办/我的申请/已完成）
- ✅ 按类型筛选（全部/拨款/出行/其他）
- ✅ 计算数据统计

### 2. Tab 功能
- **我的待办**：显示待审批且当前用户是审批人的申请
- **我的申请**：显示当前用户发起的所有申请
- **已完成**：显示状态为已完成的申请

### 3. 交互功能
- ✅ 下拉刷新列表数据
- ✅ 点击列表项跳转到详情页
- ✅ 点击浮动按钮创建新申请
- ✅ 点击头像进入设置页
- ✅ 点击数据统计进入统计页

## 云函数说明

### flowManager 云函数

#### getList - 获取列表
```javascript
wx.cloud.callFunction({
  name: 'flowManager',
  data: {
    action: 'getList',
    tab: 'todo',      // todo/myapply/completed
    type: 'all'       // all/funds/travel/other
  }
})
```

#### create - 创建电子流
```javascript
wx.cloud.callFunction({
  name: 'flowManager',
  data: {
    action: 'create',
    flowData: {
      content: '申请内容',
      amount: '100.00',  // 金额（元）
      type: 'funds'      // funds/travel/other
    }
  }
})
```

#### getDetail - 获取详情
```javascript
wx.cloud.callFunction({
  name: 'flowManager',
  data: {
    action: 'getDetail',
    flowId: 'xxx'
  }
})
```

## 数据流转

### 1. 页面加载流程
```
onLoad
  ↓
checkLogin (检查登录状态)
  ↓
loadFlowList (加载列表数据)
  ↓
calculateMonthlyExpense (计算本月支出)
```

### 2. Tab切换流程
```
用户点击Tab
  ↓
onTabChange
  ↓
设置 activeTab 和 currentFilter
  ↓
loadFlowList (重新加载数据)
```

### 3. 筛选流程
```
用户点击筛选器
  ↓
onFilterChange
  ↓
设置 currentFilter
  ↓
loadFlowList (重新加载数据)
```

## 权限说明

### 数据权限
- 我的待办：只能看到自己作为审批人的申请
- 我的申请：只能看到自己发起的申请
- 已完成：可以看到自己和伴侣的已完成申请

### 操作权限
- 只能创建自己的申请
- 只能编辑自己被驳回的申请
- 只能删除自己的申请

## 使用步骤

### 部署云函数

1. 右键点击 `cloudfunctions/flowManager`
2. 选择"上传并部署：云端安装依赖"
3. 等待部署完成

### 测试功能

1. **创建测试数据**
   - 打开创建页面
   - 填写表单并提交
   - 返回首页查看

2. **测试Tab切换**
   - 切换到"我的申请"
   - 查看自己创建的申请

3. **测试筛选**
   - 点击不同的类型筛选
   - 查看筛选结果

4. **测试下拉刷新**
   - 下拉首页
   - 查看数据是否刷新

## 数据格式

### 列表项数据结构
```javascript
{
  id: "flow_id",
  applicantId: "user_openid",
  applicantName: "用户昵称",
  applicantAvatar: "头像URL",
  approverId: "审批人_openid",
  approverName: "审批人昵称",
  approverAvatar: "审批人头像",
  content: "申请内容",
  amount: "100.00",        // 格式化后的金额
  type: "funds",           // funds/travel/other
  typeText: "拨款",        // 类型中文
  status: "pending",       // pending/completed/rejected
  statusText: "待审批",    // 状态中文
  createTime: "12-18 10:30",
  approveTime: "",
  rejectReason: "",
  approveComment: ""
}
```

## 常见问题

### Q1: 列表为空？
**A:** 检查以下几点：
1. 是否已绑定伴侣？
2. 数据库中是否有数据？
3. 云函数是否部署成功？
4. 查看控制台是否有错误

### Q2: 无法加载数据？
**A:** 
1. 检查网络连接
2. 查看云函数日志
3. 确认数据库权限设置正确

### Q3: 本月支出不准确？
**A:** 
- 当前计算逻辑较简单
- 需要优化日期过滤
- 建议使用统计页面查看详细数据

## 性能优化

### 1. 缓存策略
- 可以将列表数据缓存到本地
- 下次打开时先显示缓存数据
- 后台更新最新数据

### 2. 分页加载
- 当数据量大时，使用分页
- 每次加载20条
- 滚动到底部时加载更多

### 3. 防抖优化
- Tab切换和筛选器添加延迟
- 避免频繁请求云函数

## 后续优化

1. [ ] 添加本地缓存
2. [ ] 实现分页加载
3. [ ] 优化本月支出计算
4. [ ] 添加骨架屏
5. [ ] 添加空状态提示
6. [ ] 支持搜索功能
7. [ ] 添加排序功能

## 相关文件

- `/miniprogram/pages/home/index.wxml` - 页面结构
- `/miniprogram/pages/home/index.js` - 页面逻辑
- `/miniprogram/pages/home/index.wxss` - 页面样式
- `/cloudfunctions/flowManager/index.js` - 云函数
