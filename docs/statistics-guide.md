# 数据统计页使用指南

## 功能概述

数据统计页已完成真实的云开发功能，支持按年度/月度查看电子流统计数据。

## 已实现功能

### 1. 时间筛选
- ✅ **年度统计**：按年查看全年数据
- ✅ **月度统计**：按月查看单月数据
- ✅ 动态生成年份列表（当前年份及前3年）
- ✅ 自动初始化为当前年月

### 2. 统计维度

#### 头部统计卡片
- **总支出**：选定时间范围内已完成的总金额
- **申请总数**：所有状态的申请数量
- **已通过**：已完成状态的申请数量
- **通过率**：已完成 / 总数 × 100%

#### 分类支出统计
- **拨款**：深绿色柱状图
- **出行**：浅蓝色柱状图
- **其他**：灰色柱状图
- 显示金额和百分比（相对于最大金额）

#### 支出趋势
- **年度模式**：显示最近8个月的趋势
- **月度模式**：显示最近5个月的趋势
- 显示每期金额和环比变化百分比

#### 统计摘要
- **日均支出**：总支出 / 天数
- **最大单笔**：单笔最高金额
- **最常申请**：申请次数最多的类型
- **驳回次数**：被驳回的申请数量

## 数据范围

### 查询范围
- 包含当前用户和伴侣的所有电子流
- 只统计已完成状态的金额数据
- 所有状态的数量统计

### 时间计算
- **年度统计**：1月1日 00:00:00 ~ 12月31日 23:59:59
- **月度统计**：当月1日 00:00:00 ~ 当月最后一天 23:59:59

## 云函数说明

### getStatistics - 获取统计数据

#### 调用方式
```javascript
wx.cloud.callFunction({
  name: 'flowManager',
  data: {
    action: 'getStatistics',
    periodType: 'month',  // 'year' 或 'month'
    year: 2024,
    month: 12             // 月度统计时需要
  }
})
```

#### 响应数据
```javascript
{
  success: true,
  data: {
    // 基础统计
    totalAmount: '8,580.00',    // 总支出（元）
    totalCount: 15,              // 申请总数
    approvedCount: 12,           // 已通过
    rejectedCount: 3,            // 已驳回
    pendingCount: 0,             // 待审批
    approveRate: 80,             // 通过率（%）
    
    // 分类统计
    typeStats: [
      {
        type: 'funds',
        name: '拨款',
        amount: '5,000.00',
        percentage: 58,
        color: '#00875A',
        lightColor: '#E8F8F2'
      },
      {
        type: 'travel',
        name: '出行',
        amount: '2,400.00',
        percentage: 28,
        color: '#5CADFF',
        lightColor: '#E0F2FF'
      },
      {
        type: 'other',
        name: '其他',
        amount: '1,180.00',
        percentage: 14,
        color: '#DCDCDC',
        lightColor: '#F2F3F5'
      }
    ],
    
    // 趋势数据
    trendData: [
      { period: '12月', amount: '8,580.00', change: 15 },
      { period: '11月', amount: '7,460.00', change: -8 },
      // ...
    ],
    
    // 统计摘要
    avgDaily: '476',         // 日均支出（元）
    maxSingle: '2,000.00',   // 最大单笔（元）
    mostFrequent: '拨款'     // 最常申请类型
  }
}
```

## 统计算法

### 1. 分类统计
```javascript
// 遍历所有已完成的电子流
flows.forEach(flow => {
  if (flow.status === 'completed') {
    typeStats[flow.type].count++
    typeStats[flow.type].amount += flow.amount
  }
})

// 计算百分比（相对于最大金额）
const maxAmount = Math.max(...typeStats.map(t => t.amount))
percentage = (amount / maxAmount) * 100
```

### 2. 趋势计算
```javascript
// 环比变化
if (previousAmount > 0) {
  change = ((currentAmount - previousAmount) / previousAmount) * 100
} else if (currentAmount > 0) {
  change = 100  // 上期为0，本期有数据
}
```

### 3. 统计摘要
```javascript
// 日均支出
const days = periodType === 'year' ? 365 : getDaysInMonth(year, month)
avgDaily = totalAmount / days

// 最大单笔
maxSingle = Math.max(...flows.map(f => f.amount))

// 最常申请类型
mostFrequent = Object.keys(typeStats).sort((a, b) => 
  typeStats[b].count - typeStats[a].count
)[0]
```

## 使用流程

### 查看月度统计
1. 打开统计页面
2. 默认显示当前月份数据
3. 可点击其他月份切换
4. 查看各项统计指标

### 查看年度统计
1. 点击顶部"年度"标签
2. 选择要查看的年份
3. 查看全年统计数据
4. 支出趋势显示最近8个月

### 切换时间范围
1. 点击"年度"或"月度"标签
2. 在下方网格中选择具体年份或月份
3. 自动刷新统计数据
4. 标题显示当前时间范围

## 数据流转

### 页面加载流程
```
打开页面
  ↓
初始化当前年月
  ↓
生成年份列表（近4年）
  ↓
更新时间范围文本
  ↓
调用 flowManager.getStatistics
  ↓
显示统计数据
```

### 切换筛选流程
```
点击年度/月度标签
  ↓
onPeriodTypeChange
  ↓
更新 periodType
  ↓
调用 loadStatistics
  ↓
云函数重新计算
  ↓
更新页面数据
```

## UI 展示

### 头部卡片
- 紫色渐变背景
- 大号总支出金额
- 3个关键指标网格

### 分类统计
- 横向柱状图
- 动态宽度（按百分比）
- 显示金额数值

### 支出趋势
- 列表形式
- 显示金额和变化
- 上涨红色，下降绿色

### 统计摘要
- 2×2 网格布局
- 不同颜色左边框
- 大号数值显示

## 颜色方案

### 类型颜色（与列表页一致）
| 类型 | 颜色 | 浅色背景 |
|------|------|----------|
| 拨款 | #00875A | #E8F8F2 |
| 出行 | #5CADFF | #E0F2FF |
| 其他 | #DCDCDC | #F2F3F5 |

### 统计摘要颜色
| 指标 | 颜色 | 用途 |
|------|------|------|
| 日均支出 | #0052D9（蓝） | primary |
| 最大单笔 | #029B6C（绿） | success |
| 最常申请 | #E37318（橙） | warning |
| 驳回次数 | #D54941（红） | danger |

## 性能优化

### 1. 云端计算
- 所有统计在云端完成
- 减少前端计算压力
- 数据格式化后返回

### 2. 缓存策略
- 可以添加本地缓存
- 切换时先显示缓存数据
- 后台更新最新数据

### 3. 分页加载
- 趋势数据限制条数
- 年度最多8个月
- 月度最多5个月

## 常见问题

### Q1: 统计数据为0？
**A:** 检查以下几点：
1. 是否有已完成的电子流？
2. 时间范围是否正确？
3. 是否已绑定伴侣？
4. 查看云函数日志

### Q2: 趋势数据不准确？
**A:**
- 确认电子流的 createTime 正确
- 检查云函数的时间范围计算
- 查看控制台日志

### Q3: 分类统计显示异常？
**A:**
- 确认类型字段值正确（funds/travel/other）
- 检查已完成状态的电子流
- 验证金额字段存储正确

### Q4: 通过率计算不对？
**A:**
- 通过率 = 已通过数 / 总数 × 100%
- 只统计当前时间范围内的数据
- 包含所有状态的总数

## 部署步骤

### 第一步：重新部署云函数
由于修改了 `flowManager` 云函数，需要重新部署：

```bash
右键 cloudfunctions/flowManager
→ 上传并部署：云端安装依赖
```

### 第二步：测试功能

#### 测试月度统计
1. 打开统计页面
2. 查看当前月份数据
3. 切换不同月份
4. 验证数据正确性

#### 测试年度统计
1. 点击"年度"标签
2. 选择年份
3. 查看全年数据
4. 验证趋势数据

#### 测试数据准确性
1. 创建几个不同类型的申请
2. 审批通过部分申请
3. 打开统计页面
4. 验证各项数据是否正确

## 扩展功能

### 可以添加的功能
1. [ ] 导出统计报表
2. [ ] 图表可视化（使用 ECharts）
3. [ ] 自定义时间范围
4. [ ] 对比分析（同比、环比）
5. [ ] 支出预测
6. [ ] 预算设置和提醒
7. [ ] 分享统计报告

### 数据增强
1. [ ] 添加申请人维度统计
2. [ ] 按审批人统计
3. [ ] 按时段统计（早中晚）
4. [ ] 按金额区间统计
5. [ ] 添加备注标签统计

## 相关文件

- `/miniprogram/pages/statistics/index.wxml` - 页面结构
- `/miniprogram/pages/statistics/index.js` - 页面逻辑
- `/miniprogram/pages/statistics/index.wxss` - 页面样式
- `/cloudfunctions/flowManager/index.js` - 云函数（getStatistics）

## 总结

统计页面现在已经完成了真实的云开发功能：
- ✅ 实时从云数据库查询数据
- ✅ 支持年度/月度切换
- ✅ 完整的统计维度
- ✅ 趋势分析和环比计算
- ✅ 美观的数据可视化
- ✅ 响应式的用户体验

所有统计数据都是基于真实的电子流数据计算得出，确保准确性和实时性！🎉
