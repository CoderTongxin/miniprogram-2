// pages/settings/index.js
import Toast from 'tdesign-miniprogram/toast/index';

const app = getApp();

Page({
  data: {
    userInfo: null,
    activeTab: 'generate',
    bindCode: '',
    expireTimeText: '',
    inputCode: '',
    generating: false,
    binding: false,
    showUnbindDialog: false
  },

  onLoad() {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    
    this.loadUserInfo();
    
    setTimeout(() => {
      wx.hideLoading();
    }, 500);
  },

  onShow() {
    this.loadUserInfo();
  },

  // 加载用户信息
  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({ userInfo });
    } else {
      wx.redirectTo({
        url: '/pages/login/index'
      });
    }
  },

  // Tab切换
  onTabChange(e) {
    this.setData({
      activeTab: e.detail.value,
      bindCode: '',
      inputCode: ''
    });
  },

  // 生成绑定码
  onGenerateCode() {
    this.setData({ generating: true });

    wx.cloud.callFunction({
      name: 'userLogin',
      data: {
        action: 'generateCode'
      },
      success: (res) => {
        console.log('生成绑定码返回：', res);
        
        if (res.result && res.result.success) {
          const { bindCode, expireTime } = res.result.data;
          const expireDate = new Date(expireTime);
          const expireTimeText = this.formatTime(expireDate);
          
          this.setData({
            bindCode,
            expireTimeText,
            generating: false
          });

          Toast({
            context: this,
            selector: '#t-toast',
            message: '绑定码生成成功',
            theme: 'success',
            direction: 'column',
          });
        } else {
          this.setData({ generating: false });
          Toast({
            context: this,
            selector: '#t-toast',
            message: res.result.message || '生成失败',
            theme: 'error',
            direction: 'column',
          });
        }
      },
      fail: (err) => {
        console.error('生成绑定码失败：', err);
        this.setData({ generating: false });
        Toast({
          context: this,
          selector: '#t-toast',
          message: '生成失败，请重试',
          theme: 'error',
          direction: 'column',
        });
      }
    });
  },

  // 复制绑定码
  onCopyCode() {
    wx.setClipboardData({
      data: this.data.bindCode,
      success: () => {
        Toast({
          context: this,
          selector: '#t-toast',
          message: '已复制到剪贴板',
          theme: 'success',
          direction: 'column',
        });
      }
    });
  },

  // 输入绑定码变化
  onInputCodeChange(e) {
    this.setData({
      inputCode: e.detail.value
    });
  },

  // 绑定伴侣
  onBindPartner() {
    const { inputCode } = this.data;
    
    if (inputCode.length !== 6) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请输入6位绑定码',
        theme: 'warning',
        direction: 'column',
      });
      return;
    }

    this.setData({ binding: true });

    wx.cloud.callFunction({
      name: 'userLogin',
      data: {
        action: 'bindPartner',
        bindCode: inputCode
      },
      success: (res) => {
        console.log('绑定伴侣返回：', res);
        
        if (res.result && res.result.success) {
          Toast({
            context: this,
            selector: '#t-toast',
            message: '绑定成功',
            theme: 'success',
            direction: 'column',
          });

          // 刷新用户信息
          setTimeout(() => {
            this.refreshUserInfo();
          }, 1500);
        } else {
          this.setData({ binding: false });
          Toast({
            context: this,
            selector: '#t-toast',
            message: res.result.message || '绑定失败',
            theme: 'error',
            direction: 'column',
          });
        }
      },
      fail: (err) => {
        console.error('绑定失败：', err);
        this.setData({ binding: false });
        Toast({
          context: this,
          selector: '#t-toast',
          message: '绑定失败，请重试',
          theme: 'error',
          direction: 'column',
        });
      }
    });
  },

  // 刷新用户信息
  refreshUserInfo() {
    wx.showLoading({ title: '加载中...' });
    
    wx.cloud.callFunction({
      name: 'userLogin',
      data: {
        action: 'login',
        userInfo: this.data.userInfo
      },
      success: (res) => {
        wx.hideLoading();
        
        if (res.result && res.result.success) {
          const userData = res.result.data.userInfo;
          wx.setStorageSync('userInfo', userData);
          app.globalData.userInfo = userData;
          
          if (userData.partnerId) {
            app.globalData.partnerId = userData.partnerId;
            wx.setStorageSync('partnerId', userData.partnerId);
          }
          
          this.setData({
            userInfo: userData,
            inputCode: '',
            binding: false
          });
        }
      },
      fail: () => {
        wx.hideLoading();
        this.setData({ binding: false });
      }
    });
  },

  // 解除绑定
  onUnbind() {
    this.setData({ showUnbindDialog: true });
  },

  confirmUnbind() {
    this.setData({ showUnbindDialog: false });
    
    Toast({
      context: this,
      selector: '#t-toast',
      message: '解除绑定功能待开发',
      theme: 'warning',
      direction: 'column',
    });
  },

  cancelUnbind() {
    this.setData({ showUnbindDialog: false });
  },

  // 清除缓存
  onClearCache() {
    wx.showModal({
      title: '提示',
      content: '确定要清除缓存吗？',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorage({
            success: () => {
              Toast({
                context: this,
                selector: '#t-toast',
                message: '清除成功',
                theme: 'success',
                direction: 'column',
              });
            }
          });
        }
      }
    });
  },

  // 关于我们
  onAbout() {
    wx.showModal({
      title: 'You and Me',
      content: '情侣电子流审批小程序\n版本：1.0.0\n\n让情侣间的消费管理更简单、更透明',
      showCancel: false
    });
  },

  // 退出登录
  onLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorage({
            success: () => {
              app.globalData.userInfo = null;
              app.globalData.partnerId = null;
              
              wx.reLaunch({
                url: '/pages/login/index'
              });
            }
          });
        }
      }
    });
  },

  // 格式化时间
  formatTime(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    
    return `${year}-${month}-${day} ${hour}:${minute}`;
  }
});
