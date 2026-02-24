// pages/login/index.js - 准了么登录页（像素级还原版）

const app = getApp();

Page({
  data: {
    // 用户状态
    isLoggedIn: false,
    isBound: false,
    userInfo: null,
    
    // 按钮文案（动态计算）
    buttonText: '去绑定',
    
    // 隐私协议同意状态
    privacyAgreed: false,
    
    // 用户输入的昵称和头像
    nickName: '',
    avatarUrl: ''
  },

  onLoad() {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    
    this.checkLoginStatus();
  },

  onShow() {
    // 每次页面显示时检查状态（可能被其他用户绑定）
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo && userInfo._openid) {
      this.checkBindStatusFromCloud();
    }
  },

  // 检查登录状态
  checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo');
    
    if (userInfo && userInfo._openid) {
      // 已登录
      const isBound = userInfo.relationStatus === 'paired' && userInfo.partnerId;
      
      // 保存到全局数据
      app.globalData.userInfo = userInfo;
      if (userInfo.partnerId) {
        app.globalData.partnerId = userInfo.partnerId;
      }
      
      // 如果已登录且已绑定，直接跳转到首页
      if (isBound) {
        setTimeout(() => {
          this.goToHome();
        }, 500);
        return;
      }
      
      // 已登录但未绑定，显示登录页面
      this.setData({
        isLoggedIn: true,
        isBound: false,
        userInfo: userInfo,
        buttonText: '去绑定'
      });
      
      setTimeout(() => {
        wx.hideLoading();
      }, 500);
    } else {
      // 未登录
      this.setData({
        isLoggedIn: false,
        isBound: false,
        buttonText: '去登录绑定'
      });
      
      setTimeout(() => {
        wx.hideLoading();
      }, 500);
    }
  },

  // 从云端检查绑定状态（检测被动绑定）
  checkBindStatusFromCloud() {
    const currentUserInfo = wx.getStorageSync('userInfo');
    const wasNotBound = currentUserInfo.relationStatus !== 'paired';
    
    wx.cloud.callFunction({
      name: 'userLogin',
      data: {
        action: 'login',
        userInfo: currentUserInfo
      },
      success: (res) => {
        if (res.result && res.result.success) {
          const latestUserInfo = res.result.data.userInfo;
          
          // 检测到被其他用户绑定
          if (wasNotBound && latestUserInfo.relationStatus === 'paired' && latestUserInfo.partnerId) {
            // 更新本地数据
            wx.setStorageSync('userInfo', latestUserInfo);
            app.globalData.userInfo = latestUserInfo;
            app.globalData.partnerId = latestUserInfo.partnerId;
            
            // 显示提示并跳转
            wx.showModal({
              title: '绑定成功',
              content: `已经被 ${latestUserInfo.partnerNickName} 绑定为情侣，现在系统会自动为您跳转到首页`,
              showCancel: false,
              success: () => {
                setTimeout(() => {
                  this.goToHome();
                }, 1000);
              }
            });
          }
        }
      },
      fail: (err) => {
        console.error('检查绑定状态失败：', err);
      }
    });
  },

  // 隐私协议复选框变化
  onPrivacyChange(e) {
    // e.detail.value 是一个数组，包含所有选中的 checkbox 的 value
    // 如果数组长度大于0，说明已勾选；否则未勾选
    const isAgreed = e.detail.value.length > 0;
    this.setData({
      privacyAgreed: isAgreed
    });
  },

  // 头像选择（使用新的 button open-type="chooseAvatar"）
  onChooseAvatar(e) {
    this.setData({
      avatarUrl: e.detail.avatarUrl
    });
  },

  // 昵称输入（使用 type="nickname" 的 input）
  onNicknameInput(e) {
    this.setData({
      nickName: e.detail.value
    });
  },

  // 点击"我的小档案"
  onTapProfile() {
    const { isLoggedIn } = this.data;
    
    if (!isLoggedIn) {
      // 未登录时不做操作，需要通过主按钮登录
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
    }
  },

  // 点击主按钮（去绑定/进入首页）
  onTapBind() {
    const { isLoggedIn, isBound, privacyAgreed, nickName, avatarUrl } = this.data;
    
    // 场景1：未登录 -> 检查隐私协议并登录
    if (!isLoggedIn) {
      // 检查是否同意隐私协议
      if (!privacyAgreed) {
        wx.showToast({
          title: '请先阅读并同意隐私政策',
          icon: 'none',
          duration: 2000
        });
        return;
      }
      
      // 检查是否已填写昵称和头像
      if (!nickName || !avatarUrl) {
        wx.showToast({
          title: '请先设置头像和昵称',
          icon: 'none',
          duration: 2000
        });
        return;
      }
      
      this.doLogin({
        nickName: nickName,
        avatarUrl: avatarUrl
      });
      return;
    }
    
    // 场景2：已登录但未绑定 -> 跳转到设置页面
    if (!isBound) {
      this.goToSettings();
      return;
    }
    
    // 场景3：已登录且已绑定 -> 进入首页
    this.goToHome();
  },

  // 执行登录
  doLogin(userInfo) {
    wx.showLoading({
      title: '登录中...',
      mask: true
    });
    wx.cloud.callFunction({
      name: 'userLogin',
      data: {
        action: 'login',
        userInfo: {
          nickName: userInfo.nickName,
          avatarUrl: userInfo.avatarUrl,
          gender: userInfo.gender,
          country: userInfo.country,
          province: userInfo.province,
          city: userInfo.city
        }
      },
      success: (res) => {
        wx.hideLoading();
        
        if (res.result && res.result.success) {
          const userData = res.result.data.userInfo;
          const isBound = userData.relationStatus === 'paired' && userData.partnerId;
          
          // 保存用户信息到本地和全局
          wx.setStorageSync('userInfo', userData);
          app.globalData.userInfo = userData;
          
          // 保存伴侣ID
          if (userData.partnerId) {
            app.globalData.partnerId = userData.partnerId;
            wx.setStorageSync('partnerId', userData.partnerId);
          }
          
          // 更新状态
          this.setData({
            isLoggedIn: true,
            isBound: isBound,
            userInfo: userData,
            buttonText: isBound ? '进入首页' : '去绑定'
          });
          
          wx.showToast({
            title: res.result.data.isNewUser ? '注册成功' : '登录成功',
            icon: 'success'
          });

          // 登录成功后，如果是从主按钮触发的，延迟跳转
          setTimeout(() => {
            if (isBound) {
              this.goToHome();
            } else {
              this.goToSettings();
            }
          }, 1000);
        } else {
          wx.showToast({
            title: res.result.message || '登录失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('登录失败：', err);
        wx.showToast({
          title: '登录失败，请重试',
          icon: 'none'
        });
      }
    });
  },

  // 跳转到设置页面
  goToSettings() {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    
    wx.navigateTo({
      url: '/pages/settings/index',
      success: () => {
        setTimeout(() => {
          wx.hideLoading();
        }, 300);
      },
      fail: (err) => {
        console.error('跳转设置页面失败：', err);
        wx.hideLoading();
        wx.showToast({
          title: '跳转失败',
          icon: 'none'
        });
      }
    });
  },

  // 跳转到首页
  goToHome() {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    
    wx.reLaunch({
      url: '/pages/home/index',
      success: () => {
        setTimeout(() => {
          wx.hideLoading();
        }, 300);
      },
      fail: (err) => {
        console.error('跳转首页失败：', err);
        wx.hideLoading();
        wx.showToast({
          title: '跳转失败',
          icon: 'none'
        });
      }
    });
  },

  // 点击用户协议
  onTapUserAgreement() {
    wx.navigateTo({
      url: '/pages/agreement/index?tab=agreement'
    });
  },

  // 点击隐私政策
  onTapPrivacy() {
    wx.navigateTo({
      url: '/pages/agreement/index?tab=privacy'
    });
  }
});
