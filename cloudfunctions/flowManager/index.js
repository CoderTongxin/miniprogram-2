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
    action,      // 操作类型: getList, create, update, delete, getDetail
    flowId,      // 电子流ID
    tab,         // Tab类型: todo, myapply, completed
    type,        // 类型筛选: all, funds, travel, other
    flowData     // 电子流数据（创建/更新时使用）
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
