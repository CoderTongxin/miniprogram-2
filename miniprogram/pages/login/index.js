// pages/login/index.js
import Toast from 'tdesign-miniprogram/toast/index';

const app = getApp();

Page({
  data: {
    isLoggedIn: false,
    userInfo: null
  },

  onLoad() {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    
    this.checkLoginStatus();
  },

  // 检查登录状态
  checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo');
    
    if (userInfo && userInfo._openid) {
      // 已登录，检查是否已绑定伴侣
      if (userInfo.relationStatus === 'paired' && userInfo.partnerId) {
        // 已登录且已绑定伴侣，自动跳转到首页
        console.log('用户已登录且已绑定伴侣，自动跳转首页');
        
        // 保存到全局数据
        app.globalData.userInfo = userInfo;
        app.globalData.partnerId = userInfo.partnerId;
        
        // 延迟跳转，让用户看到加载动画
        setTimeout(() => {
          wx.hideLoading();
          wx.reLaunch({
            url: '/pages/home/index',
            success: () => {
              console.log('自动跳转首页成功');
            },
            fail: (err) => {
              console.error('自动跳转首页失败：', err);
              wx.hideLoading();
            }
          });
        }, 300);
      } else {
        // 已登录但未绑定伴侣，显示登录页面
        this.setData({
          isLoggedIn: true,
          userInfo: userInfo
        });
        
        setTimeout(() => {
          wx.hideLoading();
        }, 500);
      }
    } else {
      // 未登录，显示登录页面
      setTimeout(() => {
        wx.hideLoading();
      }, 500);
    }
  },

  // 获取用户信息并登录
  onGetUserProfile() {
    wx.showLoading({
      title: '登录中...',
      mask: true
    });

    // 获取用户信息
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        console.log('获取用户信息成功：', res.userInfo);
        this.doLogin(res.userInfo);
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('获取用户信息失败：', err);
        Toast({
          context: this,
          selector: '#t-toast',
          message: '获取用户信息失败',
          theme: 'error',
          direction: 'column',
        });
      }
    });
  },

  // 执行登录
  doLogin(userInfo) {
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
        console.log('登录云函数返回：', res);
        
        if (res.result && res.result.success) {
          const userData = res.result.data.userInfo;
          
          // 保存用户信息到本地和全局
          wx.setStorageSync('userInfo', userData);
          app.globalData.userInfo = userData;
          
          // 保存伴侣ID
          if (userData.partnerId) {
            app.globalData.partnerId = userData.partnerId;
            wx.setStorageSync('partnerId', userData.partnerId);
          }
          
          this.setData({
            isLoggedIn: true,
            userInfo: userData
          });
          
          Toast({
            context: this,
            selector: '#t-toast',
            message: res.result.data.isNewUser ? '注册成功' : '登录成功',
            theme: 'success',
            direction: 'column',
          });

          // 如果已绑定伴侣，1秒后自动跳转首页
          if (userData.relationStatus === 'paired') {
            setTimeout(() => {
              this.onEnterHome();
            }, 1000);
          }
        } else {
          Toast({
            context: this,
            selector: '#t-toast',
            message: res.result.message || '登录失败',
            theme: 'error',
            direction: 'column',
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('登录失败：', err);
        Toast({
          context: this,
          selector: '#t-toast',
          message: '登录失败，请重试',
          theme: 'error',
          direction: 'column',
        });
      }
    });
  },

  // 进入首页
  onEnterHome() {
    const { userInfo } = this.data;
    
    // 检查是否已绑定伴侣
    if (!userInfo || userInfo.relationStatus !== 'paired') {
      wx.showModal({
        title: '提示',
        content: '您还未绑定伴侣，是否前往设置页面绑定？',
        confirmText: '去绑定',
        cancelText: '稍后',
        success: (res) => {
          if (res.confirm) {
            this.goToSettings();
          } else {
            // 用户选择稍后，仍然可以进入首页
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
                  icon: 'error'
                });
              }
            });
          }
        }
      });
    } else {
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
            icon: 'error'
          });
        }
      });
    }
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
      fail: () => {
        wx.hideLoading();
      }
    });
  }
});
