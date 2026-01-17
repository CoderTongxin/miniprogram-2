# 电子流详情页使用指南

## 功能概述

电子流详情页已完成真实的云开发功能，支持查看详情、审批通过、驳回申请等操作。

## 已实现功能

### 1. 数据加载
- ✅ 从云端实时加载电子流详情
- ✅ 显示完整的申请信息（申请人、金额、类型、内容、审批人）
- ✅ 显示审批流程时间线
- ✅ 根据状态显示不同的 UI

### 2. 权限控制
- ✅ **审批权限**：只有审批人才能审批待审批的申请
- ✅ **编辑权限**：只有申请人才能编辑已驳回的申请
- ✅ **查看权限**：只有申请人或审批人才能查看详情

### 3. 审批操作

#### 通过申请
- 审批人点击"通过"按钮
- 弹出确认对话框
- 调用云函数更新状态为"已完成"
- 记录审批时间
- 可选：添加审批备注

#### 驳回申请
- 审批人点击"驳回"按钮
- 弹出驳回原因输入框
- 必须填写驳回原因（必填）
- 调用云函数更新状态为"已驳回"
- 记录驳回原因和时间

### 4. 状态展示

| 状态 | 显示效果 | 可用操作 |
|------|----------|---------|
| 待审批 | 橙色标签 | 审批人可通过/驳回 |
| 已完成 | 绿色横幅 + 绿色标签 | 无操作 |
| 已驳回 | 红色标签 + 驳回原因区域 | 申请人可重新编辑 |

## 页面结构

### 状态横幅（仅已完成显示）
- 绿色渐变背景
- ✓ 图标
- "申请已通过"文字
- 审批完成时间

### 详情卡片
- **用户信息**：头像、姓名、创建时间、状态标签
- **申请金额**：大号显示，已完成为绿色，待审批/已驳回为红色
- **申请类型**：标签形式，不同类型不同颜色
- **申请内容**：多行文本显示
- **审批人**：头像 + 姓名
- **驳回原因**（仅已驳回显示）：红色背景区域

### 审批流程
时间线形式展示：
1. **发起申请**：申请人 + 创建时间
2. **审批中**：
   - 待审批：灰色圆点 + "等待 XXX 审批"
   - 已完成：绿色圆点 + 审批人 + 审批时间 + 备注
   - 已驳回：红色圆点 + 审批人 + 驳回时间 + 原因

### 底部操作按钮
- **待审批状态 + 是审批人**：显示"驳回"和"通过"按钮
- **已驳回状态 + 是申请人**：显示"重新编辑并提交"按钮
- **其他情况**：不显示操作按钮

## 云函数调用

### 获取详情
```javascript
wx.cloud.callFunction({
  name: 'flowManager',
  data: {
    action: 'getDetail',
    flowId: 'xxx'
  }
})
```

**响应数据**：
```javascript
{
  success: true,
  data: {
    id: 'xxx',
    applicantId: 'openid1',
    applicantName: '申请人',
    applicantAvatar: 'url',
    approverId: 'openid2',
    approverName: '审批人',
    approverAvatar: 'url',
    content: '申请内容',
    amount: '100.00',
    type: 'funds',
    typeText: '拨款',
    status: 'pending',
    statusText: '待审批',
    createTime: '12-18 10:30',
    approveTime: '',
    rejectReason: '',
    approveComment: ''
  }
}
```

### 通过申请
```javascript
wx.cloud.callFunction({
  name: 'flowManager',
  data: {
    action: 'approve',
    flowId: 'xxx',
    approveComment: '备注（可选）'
  }
})
```

**响应**：
```javascript
{
  success: true,
  message: '审批通过'
}
```

### 驳回申请
```javascript
wx.cloud.callFunction({
  name: 'flowManager',
  data: {
    action: 'reject',
    flowId: 'xxx',
    rejectReason: '驳回原因（必填）'
  }
})
```

**响应**：
```javascript
{
  success: true,
  message: '已驳回申请'
}
```

## 权限逻辑

### 云函数权限检查

#### 查看权限
```javascript
if (flow.applicantId !== openid && flow.approverId !== openid) {
  return { success: false, message: '无权限查看' }
}
```

#### 审批权限
```javascript
// 必须是审批人
if (flow.approverId !== openid) {
  return { success: false, message: '无权限审批' }
}

// 必须是待审批状态
if (flow.status !== 'pending') {
  return { success: false, message: '该申请已被处理' }
}
```

### 前端权限控制
```javascript
// 判断是否可以审批
const canApprove = flowData.approverId === currentUserId && flowData.status === 'pending';

// 判断是否可以编辑
const canEdit = flowData.applicantId === currentUserId && flowData.status === 'rejected';
```

## 使用流程

### 审批人操作流程

#### 通过申请
1. 打开电子流详情页
2. 确认申请信息
3. 点击"通过"按钮
4. 在确认对话框中点击"确定"
5. 等待审批完成
6. 看到"已通过申请"提示
7. 自动返回上一页

#### 驳回申请
1. 打开电子流详情页
2. 确认申请信息
3. 点击"驳回"按钮
4. 在弹窗中输入驳回原因（必填）
5. 点击"确认驳回"
6. 等待处理完成
7. 看到"已驳回申请"提示
8. 自动返回上一页

### 申请人操作流程

#### 查看待审批申请
1. 打开详情页
2. 查看申请信息
3. 查看审批流程（等待审批中）
4. 没有操作按钮

#### 查看已完成申请
1. 打开详情页
2. 看到绿色成功横幅
3. 查看审批时间和备注
4. 没有操作按钮

#### 重新编辑已驳回申请
1. 打开详情页
2. 查看驳回原因
3. 点击"重新编辑并提交"
4. 跳转到编辑页面
5. 修改后重新提交

## 数据流转

### 页面加载流程
```
打开详情页
  ↓
获取用户信息（currentUserId）
  ↓
调用 flowManager.getDetail
  ↓
云端验证权限（申请人或审批人）
  ↓
返回详情数据
  ↓
前端判断权限（canApprove, canEdit）
  ↓
显示对应的操作按钮
```

### 审批通过流程
```
点击"通过"按钮
  ↓
弹出确认对话框
  ↓
用户确认
  ↓
调用 flowManager.approve
  ↓
云端验证权限和状态
  ↓
更新 status = 'completed'
  ↓
记录 approveTime
  ↓
返回成功
  ↓
显示成功提示
  ↓
1.5秒后返回上一页
```

### 驳回流程
```
点击"驳回"按钮
  ↓
显示驳回原因输入框
  ↓
用户输入原因
  ↓
点击"确认驳回"
  ↓
验证原因不为空
  ↓
调用 flowManager.reject
  ↓
云端验证权限和状态
  ↓
更新 status = 'rejected'
  ↓
保存 rejectReason
  ↓
记录 approveTime
  ↓
返回成功
  ↓
显示成功提示
  ↓
1.5秒后返回上一页
```

## 状态说明

### 电子流状态
- `pending`：待审批
- `completed`：已完成
- `rejected`：已驳回

### 状态转换规则
- `pending` → `completed`：审批人通过
- `pending` → `rejected`：审批人驳回
- `rejected` → `pending`：申请人重新编辑并提交
- `completed`：最终状态，不可更改

## UI 元素

### 标签颜色
- **待审批**：橙色（warning）
- **已完成**：绿色（success）
- **已驳回**：红色（danger）

### 类型标签颜色
- **拨款**：蓝色（primary）
- **出行**：橙色（warning）
- **其他**：灰色（default）

### 时间线圆点颜色
- **发起申请**：蓝色
- **待审批**：灰色
- **已完成**：绿色
- **已驳回**：红色

## 错误处理

### 页面加载错误
- 未登录：提示并跳转登录页
- flowId 不存在：提示并返回上一页
- 加载失败：显示错误信息并返回

### 审批操作错误
- 无权限：显示"无权限审批"
- 已被处理：显示"该申请已被处理"
- 网络错误：显示"操作失败，请重试"

### 驳回原因验证
- 必须填写：为空时提示"请输入驳回原因"
- 最多200字：超过长度自动截断

## 常见问题

### Q1: 看不到操作按钮？
**A:** 检查以下几点：
1. 是否是审批人？（待审批状态）
2. 是否是申请人？（已驳回状态）
3. 申请状态是否正确？
4. 用户信息是否正确加载？

### Q2: 审批操作失败？
**A:**
1. 检查网络连接
2. 确认是否有审批权限
3. 确认申请状态是否为待审批
4. 查看云函数日志

### Q3: 驳回原因无法输入？
**A:**
1. 确认弹窗是否正常显示
2. 检查 t-textarea 组件是否正常
3. 查看控制台错误信息

### Q4: 审批后数据没更新？
**A:**
- 审批完成后会自动返回上一页
- 返回首页后数据会自动刷新
- 如果数据未更新，尝试下拉刷新

## 性能优化

### 1. 加载优化
- 页面打开时立即显示 loading
- 数据加载完成后隐藏 loading
- 错误时自动返回上一页

### 2. 操作反馈
- 审批操作显示"处理中..."
- 操作完成显示成功提示
- 1.5秒后自动返回

### 3. 权限预判
- 前端先判断权限显示按钮
- 云端再次验证权限
- 双重保证安全性

## 后续优化

1. [ ] 添加审批备注输入功能
2. [ ] 支持审批历史记录
3. [ ] 添加消息通知（审批完成通知申请人）
4. [ ] 支持批量审批
5. [ ] 添加审批统计
6. [ ] 支持撤回审批（限时）
7. [ ] 添加审批流程图可视化

## 相关文件

- `/miniprogram/pages/flow-detail/index.wxml` - 页面结构
- `/miniprogram/pages/flow-detail/index.js` - 页面逻辑
- `/miniprogram/pages/flow-detail/index.wxss` - 页面样式
- `/cloudfunctions/flowManager/index.js` - 云函数（approve/reject）
