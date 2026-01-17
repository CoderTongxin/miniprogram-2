// app.js
App({
  onLaunch: function () {
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
      flowList: [] // 电子流列表缓存
    };
    
    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库以使用云能力");
    } else {
      wx.cloud.init({
        env: this.globalData.env,
        traceUser: true,
      });
    }

    // 获取用户信息
    this.getUserInfo();
    
    // 检查登录状态
    this.checkLogin();
  },

  // 检查登录状态
  checkLogin() {
    const userInfo = wx.getStorageSync('userInfo');
    
    if (!userInfo || !userInfo._openid) {
      // 未登录，跳转到登录页
      wx.reLaunch({
        url: '/pages/login/index'
      });
      return false;
    }
    
    // 已登录，保存到全局变量
    this.globalData.userInfo = userInfo;
    if (userInfo.partnerId) {
      this.globalData.partnerId = userInfo.partnerId;
    }
    
    return true;
  },

  // 获取用户信息
  getUserInfo() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.globalData.userInfo = userInfo;
    }
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
