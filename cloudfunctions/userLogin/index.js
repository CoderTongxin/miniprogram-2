// 云函数：用户登录/注册
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 生成6位随机绑定码
function generateBindCode() {
  return Math.random().toString().slice(2, 8)
}

// 主函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  const { 
    action,        // 操作类型: login, updateInfo, generateCode, bindPartner, unbind
    userInfo,      // 用户信息
    bindCode       // 绑定码（绑定伴侣时使用）
  } = event

  try {
    switch (action) {
      case 'login':
        return await handleLogin(openid, userInfo)
      
      case 'updateInfo':
        return await handleUpdateInfo(openid, userInfo)
      
      case 'generateCode':
        return await handleGenerateCode(openid)
      
      case 'bindPartner':
        return await handleBindPartner(openid, bindCode)
      
      case 'unbind':
        return await handleUnbind(openid)
      
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

// 处理登录/注册
async function handleLogin(openid, userInfo) {
  const usersCollection = db.collection('users')
  
  // 查询用户是否已存在
  const userResult = await usersCollection.where({
    _openid: openid
  }).get()
  
  const now = new Date()
  
  if (userResult.data.length > 0) {
    // 用户已存在，更新登录时间；若资料未完善且传入了微信信息，一并补全
    const user = userResult.data[0]
    
    const updateData = { updateTime: now }
    
    // 若昵称仍是默认值且此次登录带来了微信昵称，自动更新
    if (userInfo && userInfo.nickName && (!user.nickName || user.nickName === '用户')) {
      updateData.nickName = userInfo.nickName
    }
    // 若头像为空且此次登录带来了微信头像，自动更新
    if (userInfo && userInfo.avatarUrl && !user.avatarUrl) {
      updateData.avatarUrl = userInfo.avatarUrl
    }
    
    await usersCollection.doc(user._id).update({
      data: updateData
    })
    
    // 返回最新的用户数据（重新查询以获取最新状态）
    const updatedResult = await usersCollection.doc(user._id).get()
    
    return {
      success: true,
      message: '登录成功',
      data: {
        isNewUser: false,
        userInfo: updatedResult.data
      }
    }
  } else {
    // 新用户，创建记录（不需要传入 userInfo，头像昵称后续通过 updateInfo 设置）
    const newUser = {
      _openid: openid,
      nickName: (userInfo && userInfo.nickName) ? userInfo.nickName : '用户',
      avatarUrl: (userInfo && userInfo.avatarUrl) ? userInfo.avatarUrl : '',
      gender: (userInfo && userInfo.gender) ? userInfo.gender : 0,
      country: (userInfo && userInfo.country) ? userInfo.country : '',
      province: (userInfo && userInfo.province) ? userInfo.province : '',
      city: (userInfo && userInfo.city) ? userInfo.city : '',
      
      partnerId: '',
      partnerNickName: '',
      partnerAvatarUrl: '',
      relationStatus: 'single',
      
      bindCode: '',
      bindCodeExpireTime: null,
      
      createTime: now,
      updateTime: now
    }
    
    const addResult = await usersCollection.add({
      data: newUser
    })
    
    newUser._id = addResult._id
    
    return {
      success: true,
      message: '注册成功',
      data: {
        isNewUser: true,
        userInfo: newUser
      }
    }
  }
}

// 更新用户信息
async function handleUpdateInfo(openid, userInfo) {
  const usersCollection = db.collection('users')
  
  const updateData = {
    updateTime: new Date()
  }
  
  if (userInfo.nickName) updateData.nickName = userInfo.nickName
  if (userInfo.avatarUrl) updateData.avatarUrl = userInfo.avatarUrl
  if (userInfo.gender !== undefined) updateData.gender = userInfo.gender
  
  await usersCollection.where({
    _openid: openid
  }).update({
    data: updateData
  })
  
  // 查询并返回更新后的完整用户信息
  const updatedResult = await usersCollection.where({
    _openid: openid
  }).get()
  
  const updatedUser = updatedResult.data[0]

  // 若有伴侣，同步更新对方记录中缓存的昵称和头像
  if (updatedUser && updatedUser.partnerId) {
    const partnerCacheUpdate = {}
    if (userInfo.nickName) partnerCacheUpdate.partnerNickName = userInfo.nickName
    if (userInfo.avatarUrl) partnerCacheUpdate.partnerAvatarUrl = userInfo.avatarUrl

    if (Object.keys(partnerCacheUpdate).length > 0) {
      partnerCacheUpdate.updateTime = new Date()
      await usersCollection.where({
        _openid: updatedUser.partnerId
      }).update({
        data: partnerCacheUpdate
      })
    }
  }

  return {
    success: true,
    message: '信息更新成功',
    data: {
      userInfo: updatedUser
    }
  }
}

// 生成绑定码
async function handleGenerateCode(openid) {
  const usersCollection = db.collection('users')
  
  // 生成绑定码，24小时有效
  const bindCode = generateBindCode()
  const expireTime = new Date(Date.now() + 24 * 60 * 60 * 1000)
  
  await usersCollection.where({
    _openid: openid
  }).update({
    data: {
      bindCode: bindCode,
      bindCodeExpireTime: expireTime,
      updateTime: new Date()
    }
  })
  
  return {
    success: true,
    message: '绑定码生成成功',
    data: {
      bindCode,
      expireTime
    }
  }
}

// 绑定伴侣
async function handleBindPartner(openid, bindCode) {
  const usersCollection = db.collection('users')
  
  if (!bindCode) {
    return {
      success: false,
      message: '请输入绑定码'
    }
  }
  
  // 查找拥有此绑定码的用户
  const partnerResult = await usersCollection.where({
    bindCode: bindCode,
    bindCodeExpireTime: _.gt(new Date())
  }).get()
  
  if (partnerResult.data.length === 0) {
    return {
      success: false,
      message: '绑定码无效或已过期'
    }
  }
  
  const partner = partnerResult.data[0]
  
  // 不能绑定自己
  if (partner._openid === openid) {
    return {
      success: false,
      message: '不能绑定自己'
    }
  }
  
  // 检查对方是否已有伴侣
  if (partner.relationStatus === 'paired') {
    return {
      success: false,
      message: '对方已有伴侣'
    }
  }
  
  // 获取当前用户信息
  const currentUserResult = await usersCollection.where({
    _openid: openid
  }).get()
  
  if (currentUserResult.data.length === 0) {
    return {
      success: false,
      message: '用户不存在'
    }
  }
  
  const currentUser = currentUserResult.data[0]
  
  // 检查当前用户是否已有伴侣
  if (currentUser.relationStatus === 'paired') {
    return {
      success: false,
      message: '您已有伴侣'
    }
  }
  
  const now = new Date()
  
  // 更新双方的伴侣信息
  await Promise.all([
    // 更新当前用户
    usersCollection.doc(currentUser._id).update({
      data: {
        partnerId: partner._openid,
        partnerNickName: partner.nickName,
        partnerAvatarUrl: partner.avatarUrl,
        relationStatus: 'paired',
        updateTime: now
      }
    }),
    // 更新伴侣
    usersCollection.doc(partner._id).update({
      data: {
        partnerId: currentUser._openid,
        partnerNickName: currentUser.nickName,
        partnerAvatarUrl: currentUser.avatarUrl,
        relationStatus: 'paired',
        bindCode: '',  // 清空绑定码
        bindCodeExpireTime: null,
        updateTime: now
      }
    })
  ])
  
  return {
    success: true,
    message: '绑定成功',
    data: {
      partner: {
        nickName: partner.nickName,
        avatarUrl: partner.avatarUrl
      }
    }
  }
}

// 解除绑定
async function handleUnbind(openid) {
  const usersCollection = db.collection('users')
  
  // 获取当前用户信息
  const currentUserResult = await usersCollection.where({
    _openid: openid
  }).get()
  
  if (currentUserResult.data.length === 0) {
    return {
      success: false,
      message: '用户不存在'
    }
  }
  
  const currentUser = currentUserResult.data[0]
  
  // 检查是否有伴侣
  if (currentUser.relationStatus !== 'paired' || !currentUser.partnerId) {
    return {
      success: false,
      message: '当前没有绑定伴侣'
    }
  }
  
  const partnerId = currentUser.partnerId
  const now = new Date()
  
  // 查找伴侣
  const partnerResult = await usersCollection.where({
    _openid: partnerId
  }).get()
  
  // 更新双方的关系状态
  const updatePromises = [
    // 更新当前用户
    usersCollection.doc(currentUser._id).update({
      data: {
        partnerId: '',
        partnerNickName: '',
        partnerAvatarUrl: '',
        relationStatus: 'single',
        updateTime: now
      }
    })
  ]
  
  // 如果找到了伴侣，也更新对方的状态
  if (partnerResult.data.length > 0) {
    const partner = partnerResult.data[0]
    updatePromises.push(
      usersCollection.doc(partner._id).update({
        data: {
          partnerId: '',
          partnerNickName: '',
          partnerAvatarUrl: '',
          relationStatus: 'single',
          updateTime: now
        }
      })
    )
  }
  
  await Promise.all(updatePromises)
  
  // 获取更新后的用户信息
  const updatedUserResult = await usersCollection.where({
    _openid: openid
  }).get()
  
  return {
    success: true,
    message: '解除绑定成功',
    data: {
      userInfo: updatedUserResult.data[0]
    }
  }
}
