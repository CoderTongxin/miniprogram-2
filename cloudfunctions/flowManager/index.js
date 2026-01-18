// 云函数：电子流管理
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 格式化时间
function formatTime(date) {
  const now = new Date(date)
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')
  const hour = now.getHours().toString().padStart(2, '0')
  const minute = now.getMinutes().toString().padStart(2, '0')
  return `${month}-${day} ${hour}:${minute}`
}

// 格式化金额（分转元）
function formatAmount(amount) {
  if (!amount) return '0.00'
  return (amount / 100).toFixed(2)
}

// 主函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  const {
    action,         // 操作类型: getList, create, update, delete, getDetail, approve, reject, getStatistics
    flowId,         // 电子流ID
    tab,            // Tab类型: todo, myapply, completed
    type,           // 类型筛选: all, funds, travel, other
    flowData,       // 电子流数据（创建/更新时使用）
    rejectReason,   // 驳回原因
    approveComment, // 审批备注
    periodType,     // 统计周期: year, month
    year,           // 年份
    month           // 月份
  } = event

  try {
    switch (action) {
      case 'getList':
        return await getFlowList(openid, tab, type)
      
      case 'create':
        return await createFlow(openid, flowData)
      
      case 'update':
        return await updateFlow(openid, flowId, flowData)
      
      case 'delete':
        return await deleteFlow(openid, flowId)
      
      case 'getDetail':
        return await getFlowDetail(openid, flowId)
      
      case 'approve':
        return await approveFlow(openid, flowId, approveComment)
      
      case 'reject':
        return await rejectFlow(openid, flowId, rejectReason)
      
      case 'getStatistics':
        return await getStatistics(openid, periodType, year, month)
      
      default:
        return {
          success: false,
          message: '未知操作'
        }
    }
  } catch (error) {
    console.error('云函数执行错误：', error)
    return {
      success: false,
      message: error.message || '服务器错误'
    }
  }
}

// 获取电子流列表
async function getFlowList(openid, tab = 'todo', type = 'all') {
  const flowsCollection = db.collection('flows')
  const usersCollection = db.collection('users')
  
  // 获取当前用户信息（获取伴侣ID）
  const userResult = await usersCollection.where({
    _openid: openid
  }).get()
  
  if (userResult.data.length === 0) {
    return {
      success: false,
      message: '用户不存在'
    }
  }
  
  const user = userResult.data[0]
  const partnerId = user.partnerId
  
  // 构建查询条件
  let whereCondition = {}
  
  switch (tab) {
    case 'todo':
      // 我的待办：状态为待审批 且 我是审批人
      whereCondition = {
        approverId: openid,
        status: 'pending'
      }
      break
    
    case 'myapply':
      // 我的申请：我是申请人
      whereCondition = {
        applicantId: openid
      }
      break
    
    case 'completed':
      // 已完成：状态为已完成 且（我是申请人 或 我是审批人）
      whereCondition = {
        status: 'completed',
        _openid: _.in([openid, partnerId])
      }
      break
  }
  
  // 添加类型筛选
  if (type && type !== 'all') {
    whereCondition.type = type
  }
  
  // 查询数据
  const result = await flowsCollection
    .where(whereCondition)
    .orderBy('createTime', 'desc')
    .limit(100)
    .get()
  
  // 格式化数据
  const flows = result.data.map(flow => {
    // 类型文本映射
    const typeTextMap = {
      funds: '拨款',
      travel: '出行',
      other: '其他'
    }
    
    // 状态文本映射
    const statusTextMap = {
      pending: '待审批',
      completed: '已完成',
      rejected: '已驳回'
    }
    
    return {
      id: flow._id,
      applicantId: flow.applicantId,
      applicantName: flow.applicantName,
      applicantAvatar: flow.applicantAvatar,
      approverId: flow.approverId,
      approverName: flow.approverName,
      approverAvatar: flow.approverAvatar,
      content: flow.content,
      amount: formatAmount(flow.amount),
      type: flow.type,
      typeText: typeTextMap[flow.type] || flow.type,
      status: flow.status,
      statusText: statusTextMap[flow.status] || flow.status,
      createTime: formatTime(flow.createTime),
      approveTime: flow.approveTime ? formatTime(flow.approveTime) : '',
      rejectReason: flow.rejectReason || '',
      approveComment: flow.approveComment || ''
    }
  })
  
  return {
    success: true,
    data: flows
  }
}

// 创建电子流
async function createFlow(openid, flowData) {
  const flowsCollection = db.collection('flows')
  const usersCollection = db.collection('users')
  
  // 获取当前用户和伴侣信息
  const userResult = await usersCollection.where({
    _openid: openid
  }).get()
  
  if (userResult.data.length === 0) {
    return {
      success: false,
      message: '用户不存在'
    }
  }
  
  const user = userResult.data[0]
  
  if (!user.partnerId || user.relationStatus !== 'paired') {
    return {
      success: false,
      message: '请先绑定伴侣'
    }
  }
  
  // 获取伴侣信息
  const partnerResult = await usersCollection.where({
    _openid: user.partnerId
  }).get()
  
  if (partnerResult.data.length === 0) {
    return {
      success: false,
      message: '伴侣信息不存在'
    }
  }
  
  const partner = partnerResult.data[0]
  const now = new Date()
  
  // 金额转换为分（如果有金额）
  let amount = 0
  if (flowData.amount) {
    amount = Math.round(parseFloat(flowData.amount) * 100)
  }
  
  // 创建电子流记录
  const newFlow = {
    _openid: openid,
    applicantId: openid,
    applicantName: user.nickName,
    applicantAvatar: user.avatarUrl,
    approverId: partner._openid,
    approverName: partner.nickName,
    approverAvatar: partner.avatarUrl,
    content: flowData.content,
    amount: amount,
    amountYuan: formatAmount(amount),
    type: flowData.type,
    status: 'pending',
    approveTime: null,
    approveComment: '',
    rejectReason: '',
    createTime: now,
    updateTime: now
  }
  
  const addResult = await flowsCollection.add({
    data: newFlow
  })
  
  return {
    success: true,
    message: '创建成功',
    data: {
      flowId: addResult._id
    }
  }
}

// 更新电子流
async function updateFlow(openid, flowId, flowData) {
  const flowsCollection = db.collection('flows')
  
  // 检查权限（只能更新自己创建的）
  const flowResult = await flowsCollection.doc(flowId).get()
  
  if (!flowResult.data) {
    return {
      success: false,
      message: '电子流不存在'
    }
  }
  
  const flow = flowResult.data
  
  if (flow.applicantId !== openid) {
    return {
      success: false,
      message: '无权限修改'
    }
  }
  
  // 只有已驳回的才能重新编辑
  if (flow.status !== 'rejected') {
    return {
      success: false,
      message: '只能编辑已驳回的申请'
    }
  }
  
  // 金额转换
  let amount = flow.amount
  if (flowData.amount !== undefined) {
    amount = Math.round(parseFloat(flowData.amount) * 100)
  }
  
  // 更新数据
  const updateData = {
    content: flowData.content || flow.content,
    amount: amount,
    amountYuan: formatAmount(amount),
    type: flowData.type || flow.type,
    status: 'pending', // 重新提交后变为待审批
    rejectReason: '', // 清空驳回原因
    updateTime: new Date()
  }
  
  await flowsCollection.doc(flowId).update({
    data: updateData
  })
  
  return {
    success: true,
    message: '更新成功'
  }
}

// 删除电子流
async function deleteFlow(openid, flowId) {
  const flowsCollection = db.collection('flows')
  
  // 检查权限
  const flowResult = await flowsCollection.doc(flowId).get()
  
  if (!flowResult.data) {
    return {
      success: false,
      message: '电子流不存在'
    }
  }
  
  if (flowResult.data.applicantId !== openid) {
    return {
      success: false,
      message: '无权限删除'
    }
  }
  
  await flowsCollection.doc(flowId).remove()
  
  return {
    success: true,
    message: '删除成功'
  }
}

// 获取电子流详情
async function getFlowDetail(openid, flowId) {
  const flowsCollection = db.collection('flows')
  
  const result = await flowsCollection.doc(flowId).get()
  
  if (!result.data) {
    return {
      success: false,
      message: '电子流不存在'
    }
  }
  
  const flow = result.data
  
  // 检查权限（申请人或审批人才能查看）
  if (flow.applicantId !== openid && flow.approverId !== openid) {
    return {
      success: false,
      message: '无权限查看'
    }
  }
  
  // 格式化数据
  const typeTextMap = {
    funds: '拨款',
    travel: '出行',
    other: '其他'
  }
  
  const statusTextMap = {
    pending: '待审批',
    completed: '已完成',
    rejected: '已驳回'
  }
  
  const formattedFlow = {
    id: flow._id,
    applicantId: flow.applicantId,
    applicantName: flow.applicantName,
    applicantAvatar: flow.applicantAvatar,
    approverId: flow.approverId,
    approverName: flow.approverName,
    approverAvatar: flow.approverAvatar,
    content: flow.content,
    amount: formatAmount(flow.amount),
    type: flow.type,
    typeText: typeTextMap[flow.type] || flow.type,
    status: flow.status,
    statusText: statusTextMap[flow.status] || flow.status,
    createTime: formatTime(flow.createTime),
    approveTime: flow.approveTime ? formatTime(flow.approveTime) : '',
    rejectReason: flow.rejectReason || '',
    approveComment: flow.approveComment || ''
  }
  
  return {
    success: true,
    data: formattedFlow
  }
}

// 通过电子流
async function approveFlow(openid, flowId, approveComment = '') {
  const flowsCollection = db.collection('flows')
  
  // 获取电子流信息
  const flowResult = await flowsCollection.doc(flowId).get()
  
  if (!flowResult.data) {
    return {
      success: false,
      message: '电子流不存在'
    }
  }
  
  const flow = flowResult.data
  
  // 检查权限（必须是审批人）
  if (flow.approverId !== openid) {
    return {
      success: false,
      message: '无权限审批'
    }
  }
  
  // 检查状态（只能审批待审批状态的）
  if (flow.status !== 'pending') {
    return {
      success: false,
      message: '该申请已被处理'
    }
  }
  
  const now = new Date()
  
  // 更新电子流状态
  await flowsCollection.doc(flowId).update({
    data: {
      status: 'completed',
      approveTime: now,
      approveComment: approveComment || '',
      updateTime: now
    }
  })
  
  // TODO: 可以在这里添加消息通知功能，通知申请人
  
  return {
    success: true,
    message: '审批通过'
  }
}

// 驳回电子流
async function rejectFlow(openid, flowId, rejectReason) {
  const flowsCollection = db.collection('flows')
  
  // 验证驳回原因
  if (!rejectReason || !rejectReason.trim()) {
    return {
      success: false,
      message: '请填写驳回原因'
    }
  }
  
  // 获取电子流信息
  const flowResult = await flowsCollection.doc(flowId).get()
  
  if (!flowResult.data) {
    return {
      success: false,
      message: '电子流不存在'
    }
  }
  
  const flow = flowResult.data
  
  // 检查权限（必须是审批人）
  if (flow.approverId !== openid) {
    return {
      success: false,
      message: '无权限审批'
    }
  }
  
  // 检查状态（只能审批待审批状态的）
  if (flow.status !== 'pending') {
    return {
      success: false,
      message: '该申请已被处理'
    }
  }
  
  const now = new Date()
  
  // 更新电子流状态
  await flowsCollection.doc(flowId).update({
    data: {
      status: 'rejected',
      approveTime: now,
      rejectReason: rejectReason.trim(),
      updateTime: now
    }
  })
  
  // TODO: 可以在这里添加消息通知功能，通知申请人
  
  return {
    success: true,
    message: '已驳回申请'
  }
}

// 获取统计数据
async function getStatistics(openid, periodType = 'month', year, month) {
  const flowsCollection = db.collection('flows')
  const usersCollection = db.collection('users')
  
  // 获取当前用户信息
  const userResult = await usersCollection.where({
    _openid: openid
  }).get()
  
  if (userResult.data.length === 0) {
    return {
      success: false,
      message: '用户不存在'
    }
  }
  
  const user = userResult.data[0]
  const partnerId = user.partnerId
  
  // 构建时间范围查询条件
  let startDate, endDate
  
  if (periodType === 'year') {
    // 年度统计
    startDate = new Date(year, 0, 1) // 1月1日
    endDate = new Date(year, 11, 31, 23, 59, 59) // 12月31日
  } else {
    // 月度统计
    startDate = new Date(year, month - 1, 1) // 月初
    endDate = new Date(year, month, 0, 23, 59, 59) // 月末
  }
  
  // 查询该时间范围内的所有电子流（我和伴侣的）
  const whereCondition = {
    createTime: _.gte(startDate).and(_.lte(endDate)),
    _openid: _.in([openid, partnerId])
  }
  
  const result = await flowsCollection
    .where(whereCondition)
    .get()
  
  const flows = result.data
  
  // 计算统计数据
  const stats = {
    totalCount: flows.length,
    approvedCount: 0,
    rejectedCount: 0,
    pendingCount: 0,
    totalAmount: 0,
    approveRate: 0,
    
    // 分类统计
    typeStats: {
      funds: { count: 0, amount: 0 },
      travel: { count: 0, amount: 0 },
      other: { count: 0, amount: 0 }
    },
    
    // 趋势数据（按月或按周）
    trendData: [],
    
    // 统计摘要
    maxSingle: 0,
    mostFrequentType: 'funds',
    avgDaily: 0
  }
  
  // 遍历计算
  flows.forEach(flow => {
    // 状态统计
    if (flow.status === 'completed') {
      stats.approvedCount++
      stats.totalAmount += flow.amount || 0
    } else if (flow.status === 'rejected') {
      stats.rejectedCount++
    } else if (flow.status === 'pending') {
      stats.pendingCount++
    }
    
    // 分类统计（只统计已完成的）
    if (flow.status === 'completed' && flow.type) {
      if (stats.typeStats[flow.type]) {
        stats.typeStats[flow.type].count++
        stats.typeStats[flow.type].amount += flow.amount || 0
      }
    }
    
    // 最大单笔
    if (flow.amount > stats.maxSingle) {
      stats.maxSingle = flow.amount
    }
  })
  
  // 计算通过率
  if (stats.totalCount > 0) {
    stats.approveRate = Math.round((stats.approvedCount / stats.totalCount) * 100)
  }
  
  // 计算最常申请类型
  let maxTypeCount = 0
  Object.keys(stats.typeStats).forEach(type => {
    if (stats.typeStats[type].count > maxTypeCount) {
      maxTypeCount = stats.typeStats[type].count
      stats.mostFrequentType = type
    }
  })
  
  // 计算日均支出
  const days = periodType === 'year' ? 365 : new Date(year, month, 0).getDate()
  stats.avgDaily = stats.totalAmount > 0 ? Math.round(stats.totalAmount / 100 / days) : 0
  
  // 生成趋势数据
  if (periodType === 'year') {
    // 年度统计：按月
    stats.trendData = await generateYearlyTrend(openid, partnerId, year)
  } else {
    // 月度统计：最近5个月
    stats.trendData = await generateMonthlyTrend(openid, partnerId, year, month)
  }
  
  // 格式化分类统计数据
  const formattedTypeStats = []
  const typeTextMap = {
    funds: '拨款',
    travel: '出行',
    other: '其他'
  }
  const typeColorMap = {
    funds: { color: '#00875A', lightColor: '#E8F8F2' },
    travel: { color: '#5CADFF', lightColor: '#E0F2FF' },
    other: { color: '#DCDCDC', lightColor: '#F2F3F5' }
  }
  
  let maxAmount = 0
  Object.keys(stats.typeStats).forEach(type => {
    if (stats.typeStats[type].amount > maxAmount) {
      maxAmount = stats.typeStats[type].amount
    }
  })
  
  Object.keys(stats.typeStats).forEach(type => {
    const data = stats.typeStats[type]
    const percentage = maxAmount > 0 ? Math.round((data.amount / maxAmount) * 100) : 0
    
    formattedTypeStats.push({
      type: type,
      name: typeTextMap[type],
      amount: formatAmount(data.amount),
      percentage: percentage,
      color: typeColorMap[type].color,
      lightColor: typeColorMap[type].lightColor
    })
  })
  
  // 返回格式化后的数据
  return {
    success: true,
    data: {
      totalAmount: formatAmount(stats.totalAmount),
      totalCount: stats.totalCount,
      approvedCount: stats.approvedCount,
      rejectedCount: stats.rejectedCount,
      pendingCount: stats.pendingCount,
      approveRate: stats.approveRate,
      typeStats: formattedTypeStats,
      trendData: stats.trendData,
      avgDaily: stats.avgDaily.toString(),
      maxSingle: formatAmount(stats.maxSingle),
      mostFrequent: typeTextMap[stats.mostFrequentType] || '拨款'
    }
  }
}

// 生成年度趋势（按月）
async function generateYearlyTrend(openid, partnerId, year) {
  const flowsCollection = db.collection('flows')
  const trendData = []
  
  for (let month = 1; month <= 12; month++) {
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)
    
    const result = await flowsCollection
      .where({
        createTime: _.gte(startDate).and(_.lte(endDate)),
        _openid: _.in([openid, partnerId]),
        status: 'completed'
      })
      .get()
    
    let totalAmount = 0
    result.data.forEach(flow => {
      totalAmount += flow.amount || 0
    })
    
    trendData.push({
      period: `${month}月`,
      amount: formatAmount(totalAmount),
      rawAmount: totalAmount
    })
  }
  
  // 计算变化百分比
  for (let i = 0; i < trendData.length; i++) {
    if (i > 0) {
      const prevAmount = trendData[i - 1].rawAmount
      const currentAmount = trendData[i].rawAmount
      
      let change = 0
      if (prevAmount > 0) {
        change = Math.round(((currentAmount - prevAmount) / prevAmount) * 100)
      } else if (currentAmount > 0) {
        change = 100
      }
      
      trendData[i].change = change
    } else {
      trendData[i].change = 0
    }
    
    delete trendData[i].rawAmount
  }
  
  return trendData.reverse().slice(0, 8) // 返回最近8个月
}

// 生成月度趋势（最近5个月）
async function generateMonthlyTrend(openid, partnerId, currentYear, currentMonth) {
  const flowsCollection = db.collection('flows')
  const trendData = []
  
  for (let i = 0; i < 5; i++) {
    let year = currentYear
    let month = currentMonth - i
    
    if (month <= 0) {
      month += 12
      year -= 1
    }
    
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)
    
    const result = await flowsCollection
      .where({
        createTime: _.gte(startDate).and(_.lte(endDate)),
        _openid: _.in([openid, partnerId]),
        status: 'completed'
      })
      .get()
    
    let totalAmount = 0
    result.data.forEach(flow => {
      totalAmount += flow.amount || 0
    })
    
    trendData.push({
      period: `${month}月`,
      amount: formatAmount(totalAmount),
      rawAmount: totalAmount
    })
  }
  
  // 计算变化百分比
  for (let i = 0; i < trendData.length; i++) {
    if (i > 0) {
      const prevAmount = trendData[i - 1].rawAmount
      const currentAmount = trendData[i].rawAmount
      
      let change = 0
      if (prevAmount > 0) {
        change = Math.round(((currentAmount - prevAmount) / prevAmount) * 100)
      } else if (currentAmount > 0) {
        change = 100
      }
      
      trendData[i].change = change
    } else {
      trendData[i].change = 0
    }
    
    delete trendData[i].rawAmount
  }
  
  return trendData.reverse()
}
