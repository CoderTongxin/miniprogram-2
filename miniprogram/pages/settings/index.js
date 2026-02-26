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

  // 定时检测绑定状态的定时器
  bindCheckTimer: null,

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
    // 启动绑定状态自动检测
    this.startBindCheckTimer();
  },

  onHide() {
    // 页面隐藏时清除定时器
    this.stopBindCheckTimer();
  },

  onUnload() {
    // 页面卸载时清除定时器
    this.stopBindCheckTimer();
  },

  // 加载用户信息，同时从云端刷新并检测是否被被动绑定
  loadUserInfo() {
    const cachedUserInfo = wx.getStorageSync('userInfo');
    if (!cachedUserInfo) {
      wx.redirectTo({ url: '/pages/login/index' });
      return;
    }

    // 先用本地缓存渲染页面，避免白屏
    const wasNotBound = cachedUserInfo.relationStatus !== 'paired';
    this.setData({ userInfo: cachedUserInfo });

    // 从云端拉取最新数据（检测被动绑定 / 伴侣信息变更）
    wx.cloud.callFunction({
      name: 'userLogin',
      data: { action: 'login', userInfo: cachedUserInfo },
      success: (res) => {
        if (!res.result || !res.result.success) return;

        const latestUserInfo = res.result.data.userInfo;
        wx.setStorageSync('userInfo', latestUserInfo);
        app.globalData.userInfo = latestUserInfo;
        if (latestUserInfo.partnerId) {
          app.globalData.partnerId = latestUserInfo.partnerId;
        }

        this.setData({ userInfo: latestUserInfo });

        // 检测到被伴侣被动绑定（本地未绑定 → 云端已绑定）
        if (wasNotBound && latestUserInfo.relationStatus === 'paired') {
          wx.showModal({
            title: '绑定成功 🎉',
            content: `${latestUserInfo.partnerNickName} 已将你绑定为情侣，页面已刷新`,
            showCancel: false,
            confirmText: '知道了'
          });
          // 绑定成功后停止自动检测
          this.stopBindCheckTimer();
        }
      },
      fail: (err) => {
        console.error('刷新用户信息失败：', err);
      }
    });
  },

  // 启动定时检测绑定状态（仅在未绑定时启动）
  startBindCheckTimer() {
    // 先清除已有的定时器
    this.stopBindCheckTimer();

    const { userInfo } = this.data;
    // 只有在用户未绑定时才启动定时检测
    if (!userInfo || userInfo.relationStatus === 'paired') {
      return;
    }

    // 每10秒检测一次绑定状态
    this.bindCheckTimer = setInterval(() => {
      this.checkBindStatusSilently();
    }, 10000);
  },

  // 停止定时检测
  stopBindCheckTimer() {
    if (this.bindCheckTimer) {
      clearInterval(this.bindCheckTimer);
      this.bindCheckTimer = null;
    }
  },

  // 静默检测绑定状态（不显示 loading）
  checkBindStatusSilently() {
    const { userInfo } = this.data;
    if (!userInfo) return;

    // 如果已经绑定，停止检测
    if (userInfo.relationStatus === 'paired') {
      this.stopBindCheckTimer();
      return;
    }

    wx.cloud.callFunction({
      name: 'userLogin',
      data: { action: 'login', userInfo: userInfo },
      success: (res) => {
        if (!res.result || !res.result.success) return;

        const latestUserInfo = res.result.data.userInfo;
        
        // 检测到被伴侣被动绑定
        if (userInfo.relationStatus !== 'paired' && latestUserInfo.relationStatus === 'paired') {
          // 更新缓存和全局数据
          wx.setStorageSync('userInfo', latestUserInfo);
          app.globalData.userInfo = latestUserInfo;
          if (latestUserInfo.partnerId) {
            app.globalData.partnerId = latestUserInfo.partnerId;
          }

          // 更新页面数据
          this.setData({ userInfo: latestUserInfo });

          // 显示绑定成功提示
          wx.showModal({
            title: '绑定成功 🎉',
            content: `${latestUserInfo.partnerNickName} 已将你绑定为情侣，页面已刷新`,
            showCancel: false,
            confirmText: '知道了'
          });

          // 停止定时检测
          this.stopBindCheckTimer();
        }
      },
      fail: (err) => {
        console.error('静默检测绑定状态失败：', err);
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

  // 选择头像（编辑资料时）- 仅本地预览，实际上传在保存时进行
  onChooseAvatar(e) {
    this.setData({
      editAvatarUrl: e.detail.avatarUrl  // 临时路径，仅用于预览
    });
  },

  // 将临时头像路径上传至云存储，返回永久 fileID
  uploadAvatar(tempFilePath) {
    return new Promise((resolve, reject) => {
      const { userInfo } = this.data;
      // 每个用户固定一个路径，新头像会覆盖旧头像，避免累积垃圾文件
      const cloudPath = `avatars/${userInfo._openid}.jpg`;

      wx.cloud.uploadFile({
        cloudPath,
        filePath: tempFilePath,
        success: (res) => resolve(res.fileID),
        fail: (err) => reject(err)
      });
    });
  },

  // 昵称输入（编辑资料时）
  onNicknameInput(e) {
    this.setData({
      editNickName: e.detail.value
    });
  },

  // 保存资料
  async onSaveProfile() {
    const { editNickName, editAvatarUrl, userInfo } = this.data;
    const nickName = editNickName.trim() || userInfo.nickName;
    let avatarUrl = editAvatarUrl || userInfo.avatarUrl;

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

    // 若头像是临时路径（非 cloud:// 永久地址），先上传到云存储
    if (avatarUrl && !avatarUrl.startsWith('cloud://')) {
      try {
        avatarUrl = await this.uploadAvatar(avatarUrl);
      } catch (err) {
        console.error('头像上传失败：', err);
        this.setData({ savingProfile: false });
        Toast({
          context: this,
          selector: '#t-toast',
          message: '头像上传失败，请重试',
          theme: 'error',
          direction: 'column',
        });
        return;
      }
    }

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

          // 绑定成功，停止定时检测
          this.stopBindCheckTimer();

          // 先刷新用户信息，再提示（保证页面数据已更新）
          this.refreshUserInfo(() => {
            wx.showModal({
              title: '绑定成功 🎉',
              content: `已成功与 ${partnerName} 绑定为情侣！`,
              confirmText: '去首页',
              cancelText: '留在此页',
              success: (modalRes) => {
                if (modalRes.confirm) {
                  wx.reLaunch({ url: '/pages/home/index' });
                }
              }
            });
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

  // 刷新用户信息，完成后执行可选回调
  refreshUserInfo(onComplete = null) {
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

        if (typeof onComplete === 'function') onComplete();
      },
      fail: () => {
        wx.hideLoading();
        this.setData({ binding: false });
        if (typeof onComplete === 'function') onComplete();
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

          // 解除绑定后重新启动定时检测
          this.startBindCheckTimer();
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
  },

  // 转发给朋友
  onShareAppMessage() {
    const { userInfo } = this.data;
    const name = userInfo && userInfo.nickName ? userInfo.nickName : '我';
    return {
      title: `${name}邀请你使用准了吗，一起管理两人开支~`,
      path: '/pages/login/index'
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '准了吗情侣电子流 · 轻松管理两人开支',
      query: ''
    };
  }
});
