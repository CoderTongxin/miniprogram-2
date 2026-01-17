# 标签样式使用指南

## 标签分类

为了避免混淆，我们对不同类型的标签采用了不同的视觉样式。

## 1. 状态标签（Status Tags）

**用途**：表示电子流的审批状态

**样式**：浅色透明背景（`variant="light"`）

### 状态类型

| 状态 | 文本 | theme | variant | 颜色效果 |
|------|------|-------|---------|----------|
| 待审批 | pending | warning | light | 浅橙色背景 + 橙色文字 |
| 已完成 | completed | success | light | 浅绿色背景 + 绿色文字 |
| 已驳回 | rejected | danger | light | 浅红色背景 + 红色文字 |

### 使用示例

```xml
<!-- 状态标签：浅色透明背景 -->
<t-tag 
  theme="{{status === 'pending' ? 'warning' : status === 'completed' ? 'success' : 'danger'}}" 
  variant="light"
  size="small"
>
  {{statusText}}
</t-tag>
```

### 视觉特征
- ✅ 背景半透明
- ✅ 颜色柔和
- ✅ 边框与背景同色
- ✅ 适合作为辅助信息展示

## 2. 类型标签（Type Tags）

**用途**：表示电子流的申请类型

**样式**：纯色背景（不设置 `variant` 或 `variant="dark"`）

### 类型分类

| 类型 | 文本 | 自定义颜色 | 颜色效果 |
|------|------|-----------|----------|
| 拨款 | funds | #00875A | 深绿色背景 + 白色文字 |
| 出行 | travel | #5CADFF | 浅蓝色背景 + 白色文字 |
| 其他 | other | #DCDCDC | 灰色背景 + 深色文字 |

### 使用示例

```xml
<!-- 类型标签：纯色背景 + 自定义颜色 -->
<t-tag 
  theme="{{type === 'other' ? 'default' : 'primary'}}"
  class="type-tag type-tag-{{type}}"
  size="small"
>
  {{typeText}}
</t-tag>
```

### 自定义样式（WXSS）

```css
/* 拨款：深绿色 */
.type-tag-funds {
  background-color: #00875A !important;
  border-color: #00875A !important;
  color: #FFFFFF !important;
}

/* 出行：浅蓝色 */
.type-tag-travel {
  background-color: #5CADFF !important;
  border-color: #5CADFF !important;
  color: #FFFFFF !important;
}

/* 其他：灰色 */
.type-tag-other {
  background-color: #DCDCDC !important;
  border-color: #DCDCDC !important;
  color: #333333 !important;
}
```

### 视觉特征
- ✅ 背景纯色
- ✅ 颜色饱满鲜艳
- ✅ 白色文字高对比度
- ✅ 视觉冲击力强

## 3. 视觉对比

### 首页列表

```
┌─────────────────────────────┐
│ 👤 谢熊猫                    │
│                              │
│ [待审批] [拨款]  ← 左浅右深   │
│                              │
│ 申请内容...                  │
│ ¥100.00                      │
└─────────────────────────────┘
```

- **状态标签**（待审批）：浅橙色背景，视觉柔和
- **类型标签**（拨款）：蓝色纯色背景，视觉醒目

### 详情页

```
申请类型
[拨款] ← 纯色背景，醒目突出

状态
[待审批] ← 浅色背景，柔和辅助
```

## 4. 设计原则

### 状态标签（浅色背景）
- **作用**：辅助信息，表示当前状态
- **优先级**：中等
- **视觉权重**：柔和，不抢眼
- **使用场景**：状态指示器

### 类型标签（纯色背景）
- **作用**：核心分类信息
- **优先级**：较高
- **视觉权重**：醒目，易识别
- **使用场景**：类别标识

## 5. 颜色映射表

### 状态标签颜色（variant="light"）

| 状态 | 背景色 | 文字色 | 边框色 |
|------|--------|--------|--------|
| 待审批 (warning) | rgba(255, 139, 0, 0.1) | #E37318 | rgba(255, 139, 0, 0.2) |
| 已完成 (success) | rgba(2, 155, 108, 0.1) | #029B6C | rgba(2, 155, 108, 0.2) |
| 已驳回 (danger) | rgba(213, 73, 65, 0.1) | #D54941 | rgba(213, 73, 65, 0.2) |

### 类型标签颜色（纯色 + 自定义）

| 类型 | 背景色 | 文字色 | 边框色 | 说明 |
|------|--------|--------|--------|------|
| 拨款 (funds) | #00875A | #FFFFFF | #00875A | 深绿色，比审批通过更深 |
| 出行 (travel) | #5CADFF | #FFFFFF | #5CADFF | 浅蓝色，清新明亮 |
| 其他 (other) | #DCDCDC | #333333 | #DCDCDC | 中性灰色 |

## 6. 使用场景

### 首页列表（home/index.wxml）
```xml
<view class="flow-badges">
  <!-- 状态：浅色 -->
  <t-tag theme="warning" variant="light" size="small">待审批</t-tag>
  <!-- 类型：纯色 + 自定义颜色 -->
  <t-tag theme="primary" class="type-tag type-tag-funds" size="small">拨款</t-tag>
</view>
```

### 详情页（flow-detail/index.wxml）
```xml
<!-- 用户信息区 - 状态标签：浅色 -->
<t-tag theme="success" variant="light">已完成</t-tag>

<!-- 申请类型 - 类型标签：纯色 + 自定义颜色 -->
<t-tag theme="primary" class="type-tag type-tag-travel">出行</t-tag>
```

## 7. 注意事项

### ❌ 不要这样做
```xml
<!-- 错误：状态和类型都用浅色，难以区分 -->
<t-tag theme="warning" variant="light">待审批</t-tag>
<t-tag theme="primary" variant="light">拨款</t-tag>

<!-- 错误：状态和类型都用纯色，视觉混乱 -->
<t-tag theme="warning">待审批</t-tag>
<t-tag theme="primary">拨款</t-tag>

<!-- 错误：没有使用自定义颜色类 -->
<t-tag theme="primary">拨款</t-tag>
```

### ✅ 正确做法
```xml
<!-- 正确：状态用浅色，类型用纯色 + 自定义颜色 -->
<t-tag theme="warning" variant="light">待审批</t-tag>
<t-tag theme="primary" class="type-tag type-tag-funds">拨款</t-tag>
```

## 8. 适配其他页面

如果需要在其他页面使用标签，请遵循以下规则：

### 状态类信息
- 审批状态
- 支付状态
- 完成状态
- 在线状态

**使用**：`variant="light"`（浅色背景）

### 分类类信息
- 业务类型
- 商品分类
- 标签分类
- 重要等级

**使用**：不设置 `variant`（纯色背景）

## 9. 可访问性

### 对比度要求
- **状态标签**：浅色背景与文字对比度 ≥ 4.5:1
- **类型标签**：纯色背景与白色文字对比度 ≥ 7:1

### 色盲友好
- 除了颜色区分外，还应使用文字说明
- 不同状态使用不同的图标辅助

## 10. 实际效果对比

### 修改前（都是浅色）
```
[待审批] [拨款]  ← 视觉权重相似，难以区分
浅橙色   浅蓝色
```

### 修改后（一浅一深 + 自定义颜色）
```
[待审批] [拨款]  ← 视觉层次分明，易于识别
浅橙色   深绿色  ← 深绿色与审批通过的绿色区分开

[待审批] [出行]
浅橙色   浅蓝色  ← 清新明亮的浅蓝色

[已完成] [拨款]
浅绿色   深绿色  ← 状态浅绿 vs 类型深绿，容易区分
```

## 11. 开发者提示

### 快速记忆口诀
- **状态用浅色**（Status → Soft）
- **类型用纯色**（Type → Thick）

### 代码片段
```javascript
// 状态标签配置
const statusTag = {
  variant: 'light',  // 浅色
  theme: 'warning'   // 根据状态变化
}

// 类型标签配置
const typeTag = {
  // variant: 不设置,  // 纯色
  theme: 'primary'    // 根据类型变化
}
```

## 12. 总结

| 特性 | 状态标签 | 类型标签 |
|------|----------|----------|
| **背景** | 浅色透明 | 纯色饱满 |
| **variant** | light | 不设置 |
| **视觉权重** | 柔和 | 醒目 |
| **优先级** | 辅助信息 | 核心信息 |
| **对比度** | 中等 | 高 |
| **使用场景** | 状态指示 | 分类标识 |

通过这种区分，用户可以快速识别：
- **浅色标签** = 状态信息（告诉你"怎么样了"）
- **纯色标签** = 类型信息（告诉你"是什么"）
