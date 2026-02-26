// app.js
App({
  onLaunch: function () {
    // 监听微信隐私接口授权事件
    this.handlePrivacyAuthorization();
    
    // 显示启动loading
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    
    // 延迟隐藏，等待云开发初始化完成
    setTimeout(() => {
      wx.hideLoading();
    }, 1000);
    
    this.globalData = {
      // env 参数说明：
      //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
      //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
      //   如不填则使用默认环境（第一个创建的环境）
      env: "cloud1-4gpgleakf7ebafb5",
      userInfo: null,
      partnerId: null, // 伴侣的用户ID
      flowList: [], // 电子流列表缓存
      isGuest: true, // 游客模式标识
      userInfoReady: null // 云端刷新 userInfo 的 Promise，供各页面 await
    };
    
    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库以使用云能力");
    } else {
      wx.cloud.init({
        env: this.globalData.env,
        traceUser: true,
      });
    }

    // 每次启动时从云端刷新用户信息（包含最新的伴侣昵称/头像）
    this.refreshUserInfoFromCloud();
  },

  // 监听微信隐私接口授权
  handlePrivacyAuthorization() {
    if (wx.onNeedPrivacyAuthorization) {
      wx.onNeedPrivacyAuthorization((resolve) => {
        // 需要用户同意隐私协议时触发
        // 弹出隐私协议弹窗，用户同意后调用 resolve 授权
        wx.showModal({
          title: '隐私保护提示',
          content: '在使用当前功能前，您需要先同意《隐私保护指引》',
          confirmText: '同意',
          cancelText: '拒绝',
          success: (res) => {
            if (res.confirm) {
              // 用户同意隐私协议
              resolve({ buttonId: 'agree', event: 'agree' });
            } else {
              // 用户拒绝
              resolve({ buttonId: 'disagree', event: 'disagree' });
            }
          }
        });
      });
    }
  },

  // 检查登录状态（不强制跳转）
  checkLogin() {
    const userInfo = wx.getStorageSync('userInfo');
    
    if (!userInfo || !userInfo._openid) {
      this.globalData.isGuest = true;
      return false;
    }
    
    // 已登录，保存到全局变量
    this.globalData.userInfo = userInfo;
    this.globalData.isGuest = false;
    if (userInfo.partnerId) {
      this.globalData.partnerId = userInfo.partnerId;
    }
    
    return true;
  },

  // 每次启动时从云端刷新用户信息，并将 Promise 存入 globalData.userInfoReady
  // 各页面可 await 此 Promise 以获取最新数据（含伴侣最新昵称/头像）
  refreshUserInfoFromCloud() {
    const cachedUserInfo = wx.getStorageSync('userInfo');

    if (!cachedUserInfo || !cachedUserInfo._openid) {
      // 未登录，直接 resolve null
      this.globalData.isGuest = true;
      return;
    }

    // 先用本地缓存让 globalData 有值，避免页面读到 null
    this.globalData.userInfo = cachedUserInfo;
    this.globalData.isGuest = false;
    if (cachedUserInfo.partnerId) {
      this.globalData.partnerId = cachedUserInfo.partnerId;
    }

    // 异步从云端拉取最新数据（会包含伴侣最新昵称/头像）
    new Promise((resolve) => {
      wx.cloud.callFunction({
        name: 'userLogin',
        data: { action: 'login', userInfo: cachedUserInfo },
        success: (res) => {
          if (res.result && res.result.success) {
            const latestUserInfo = res.result.data.userInfo;
            wx.setStorageSync('userInfo', latestUserInfo);
            this.globalData.userInfo = latestUserInfo;
            this.globalData.isGuest = false;
            if (latestUserInfo.partnerId) {
              this.globalData.partnerId = latestUserInfo.partnerId;
            }
            resolve(latestUserInfo);
          } else {
            resolve(cachedUserInfo);
          }
        },
        fail: () => {
          // 云端刷新失败，降级使用本地缓存
          console.warn('app.js: 云端刷新用户信息失败，使用本地缓存');
          resolve(cachedUserInfo);
        }
      });
    });
  },

  // 保存用户信息
  setUserInfo(userInfo) {
    this.globalData.userInfo = userInfo;
    wx.setStorageSync('userInfo', userInfo);
  },

  // 获取伴侣ID
  getPartnerId() {
    const partnerId = wx.getStorageSync('partnerId');
    if (partnerId) {
      this.globalData.partnerId = partnerId;
    }
    return partnerId;
  },

  // 设置伴侣ID
  setPartnerId(partnerId) {
    this.globalData.partnerId = partnerId;
    wx.setStorageSync('partnerId', partnerId);
  }
});
