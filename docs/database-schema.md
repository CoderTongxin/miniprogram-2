# 数据库设计文档

## 云数据库集合列表

### 1. users - 用户表

存储用户基本信息和关系绑定

```javascript
{
  _id: "",                    // 自动生成的文档ID
  _openid: "",                // 用户openid（云开发自动获取）
  nickName: "谢熊猫",         // 用户昵称
  avatarUrl: "",              // 用户头像URL
  gender: 1,                  // 性别 0-未知 1-男 2-女
  country: "中国",            // 国家
  province: "广东",           // 省份
  city: "深圳",               // 城市
  
  // 伴侣关系
  partnerId: "",              // 伴侣的 _openid
  partnerNickName: "",        // 伴侣昵称
  partnerAvatarUrl: "",       // 伴侣头像
  relationStatus: "single",   // 关系状态: single-单身, pending-待确认, paired-已配对
  
  // 绑定码（用于伴侣绑定）
  bindCode: "",               // 6位绑定码，24小时有效
  bindCodeExpireTime: null,   // 绑定码过期时间
  
  // 时间戳
  createTime: null,           // Date 创建时间
  updateTime: null            // Date 更新时间
}
```

**索引**：
- `_openid` (唯一)
- `bindCode`
- `partnerId`

### 2. flows - 电子流表

存储所有电子流申请记录

```javascript
{
  _id: "",                    // 自动生成的文档ID
  _openid: "",                // 申请人openid
  
  // 申请人信息
  applicantId: "",            // 申请人openid
  applicantName: "",          // 申请人昵称
  applicantAvatar: "",        // 申请人头像
  
  // 审批人信息
  approverId: "",             // 审批人openid
  approverName: "",           // 审批人昵称
  approverAvatar: "",         // 审批人头像
  
  // 申请内容
  title: "",                  // 申请标题（可选）
  content: "",                // 申请内容
  amount: 0,                  // 金额（分）
  amountYuan: "0.00",         // 金额（元，字符串格式）
  type: "funds",              // 类型: funds-拨款, travel-出行, other-其他
  
  // 状态
  status: "pending",          // 状态: pending-待审批, completed-已完成, rejected-已驳回
  
  // 审批信息
  approveTime: null,          // Date 审批时间
  approveComment: "",         // 审批备注
  rejectReason: "",           // 驳回原因
  
  // 时间戳
  createTime: null,           // Date 创建时间
  updateTime: null            // Date 更新时间
}
```

**索引**：
- `applicantId` + `createTime`（降序）
- `approverId` + `status` + `createTime`（降序）
- `status` + `createTime`（降序）

### 3. statistics - 统计数据表

存储用户的统计数据（可选，用于优化查询性能）

```javascript
{
  _id: "",                    // 自动生成的文档ID
  _openid: "",                // 用户openid
  
  userId: "",                 // 用户openid
  year: 2024,                 // 年份
  month: 12,                  // 月份（1-12，0表示年度统计）
  
  // 统计数据
  totalCount: 0,              // 总申请数
  approvedCount: 0,           // 已通过数
  rejectedCount: 0,           // 已驳回数
  pendingCount: 0,            // 待审批数
  
  totalAmount: 0,             // 总金额（分）
  totalAmountYuan: "0.00",    // 总金额（元）
  
  // 分类统计
  typeStats: {
    funds: { count: 0, amount: 0, amountYuan: "0.00" },
    travel: { count: 0, amount: 0, amountYuan: "0.00" },
    other: { count: 0, amount: 0, amountYuan: "0.00" }
  },
  
  updateTime: null            // Date 更新时间
}
```

**索引**：
- `userId` + `year` + `month`（唯一）

## 数据库权限设置

### users 集合
- 读权限：仅创建者可读
- 写权限：仅创建者可写

### flows 集合
- 读权限：申请人或审批人可读
- 写权限：申请人可创建，审批人可更新状态

### statistics 集合
- 读权限：仅创建者可读
- 写权限：仅云函数可写

## 初始化脚本

在云开发控制台执行以下脚本创建集合：

```javascript
// 1. 创建 users 集合
db.createCollection('users')

// 2. 创建 flows 集合
db.createCollection('flows')

// 3. 创建 statistics 集合
db.createCollection('statistics')
```

## 数据库规则示例

```json
{
  "read": "auth.openid == doc._openid || auth.openid == doc.applicantId || auth.openid == doc.approverId",
  "write": "auth.openid == doc._openid"
}
```
