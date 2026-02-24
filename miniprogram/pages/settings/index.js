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
    showUnbindDialog: false,
    // 编辑资料相关
    showEditProfile: false,
    editNickName: '',
    editAvatarUrl: '',
    savingProfile: false
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
    // 检查是否被其他用户绑定
    this.checkBindStatusFromCloud();
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

  // 从云端检查绑定状态（检测被动绑定）
  checkBindStatusFromCloud() {
    const currentUserInfo = wx.getStorageSync('userInfo');
    if (!currentUserInfo) return;
    
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
          
          // 更新本地用户信息
          wx.setStorageSync('userInfo', latestUserInfo);
          app.globalData.userInfo = latestUserInfo;
          
          if (latestUserInfo.partnerId) {
            app.globalData.partnerId = latestUserInfo.partnerId;
          }
          
          // 检测到被其他用户绑定（从未绑定变为已绑定）
          if (wasNotBound && latestUserInfo.relationStatus === 'paired' && latestUserInfo.partnerId) {
            // 更新页面状态
            this.setData({ userInfo: latestUserInfo });
            
            // 显示提示并跳转
            wx.showModal({
              title: '绑定成功',
              content: `已经被 ${latestUserInfo.partnerNickName} 绑定为情侣，现在系统会自动为您跳转到首页`,
              showCancel: false,
              success: () => {
                setTimeout(() => {
                  wx.reLaunch({
                    url: '/pages/home/index'
                  });
                }, 500);
              }
            });
          } else {
            // 正常更新页面数据
            this.setData({ userInfo: latestUserInfo });
          }
        }
      },
      fail: (err) => {
        console.error('检查绑定状态失败：', err);
      }
    });
  },

  // 打开编辑资料
  onEditProfile() {
    const { userInfo } = this.data;
    this.setData({
      showEditProfile: true,
      editNickName: userInfo.nickName || '',
      editAvatarUrl: userInfo.avatarUrl || ''
    });
  },

  // 取消编辑资料
  onCancelEditProfile() {
    this.setData({
      showEditProfile: false,
      editNickName: '',
      editAvatarUrl: ''
    });
  },

  // 选择头像（编辑资料时）
  onChooseAvatar(e) {
    this.setData({
      editAvatarUrl: e.detail.avatarUrl
    });
  },

  // 昵称输入（编辑资料时）
  onNicknameInput(e) {
    this.setData({
      editNickName: e.detail.value
    });
  },

  // 保存资料
  onSaveProfile() {
    const { editNickName, editAvatarUrl, userInfo } = this.data;
    const nickName = editNickName.trim() || userInfo.nickName;
    const avatarUrl = editAvatarUrl || userInfo.avatarUrl;

    if (!nickName) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '昵称不能为空',
        theme: 'warning',
        direction: 'column',
      });
      return;
    }

    this.setData({ savingProfile: true });

    wx.cloud.callFunction({
      name: 'userLogin',
      data: {
        action: 'updateInfo',
        userInfo: { nickName, avatarUrl }
      },
      success: (res) => {
        if (res.result && res.result.success) {
          const updatedUserInfo = res.result.data ? res.result.data.userInfo : { ...userInfo, nickName, avatarUrl };

          wx.setStorageSync('userInfo', updatedUserInfo);
          app.globalData.userInfo = updatedUserInfo;

          this.setData({
            userInfo: updatedUserInfo,
            showEditProfile: false,
            editNickName: '',
            editAvatarUrl: '',
            savingProfile: false
          });

          Toast({
            context: this,
            selector: '#t-toast',
            message: '资料已保存',
            theme: 'success',
            direction: 'column',
          });
        } else {
          this.setData({ savingProfile: false });
          Toast({
            context: this,
            selector: '#t-toast',
            message: res.result.message || '保存失败',
            theme: 'error',
            direction: 'column',
          });
        }
      },
      fail: (err) => {
        console.error('保存资料失败：', err);
        this.setData({ savingProfile: false });
        Toast({
          context: this,
          selector: '#t-toast',
          message: '保存失败，请重试',
          theme: 'error',
          direction: 'column',
        });
      }
    });
  },

  // Tab切换
  onTabChange(e) {
    this.setData({
      activeTab: e.detail.value,
      inputCode: '' // 只清空输入框，保留已生成的绑定码
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
        if (res.result && res.result.success) {
          const partnerName = res.result.data.partner.nickName;
          
          // 显示成功提示
          wx.showModal({
            title: '绑定成功',
            content: `已成功与 ${partnerName} 绑定为情侣，现在系统会自动为您跳转到首页`,
            showCancel: false,
            success: () => {
              // 刷新用户信息并跳转
              this.refreshUserInfo(true);
            }
          });
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
  refreshUserInfo(shouldJumpToHome = false) {
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

          // 如果需要跳转到首页
          if (shouldJumpToHome && userData.relationStatus === 'paired') {
            setTimeout(() => {
              wx.reLaunch({
                url: '/pages/home/index'
              });
            }, 800);
          }
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
    
    wx.showLoading({
      title: '解除绑定中...',
      mask: true
    });

    // 调用云函数解除绑定
    wx.cloud.callFunction({
      name: 'userLogin',
      data: {
        action: 'unbind'
      },
      success: (res) => {
        wx.hideLoading();
        
        if (res.result && res.result.success) {
          // 更新本地用户信息
          const userData = res.result.data.userInfo;
          wx.setStorageSync('userInfo', userData);
          app.globalData.userInfo = userData;
          
          // 清除伴侣相关数据
          app.globalData.partnerId = null;
          wx.removeStorageSync('partnerId');
          
          // 更新页面状态
          this.setData({
            userInfo: userData
          });

          Toast({
            context: this,
            selector: '#t-toast',
            message: '解除绑定成功',
            theme: 'success',
            direction: 'column',
          });
        } else {
          Toast({
            context: this,
            selector: '#t-toast',
            message: res.result.message || '解除绑定失败',
            theme: 'error',
            direction: 'column',
          });
        }
      },
      fail: (err) => {
        console.error('解除绑定失败：', err);
        wx.hideLoading();
        Toast({
          context: this,
          selector: '#t-toast',
          message: '解除绑定失败，请重试',
          theme: 'error',
          direction: 'column',
        });
      }
    });
  },

  cancelUnbind() {
    this.setData({ showUnbindDialog: false });
  },

  // 进入首页
  onGoHome() {
    wx.reLaunch({
      url: '/pages/home/index'
    });
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
      title: '准了吗',
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
