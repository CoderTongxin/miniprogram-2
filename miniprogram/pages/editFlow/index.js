// pages/editFlow/index.js
import Toast from 'tdesign-miniprogram/toast/index';

Page({
  data: {
    formData: {
      content: '',
      amount: '',
      type: ''
    },
    isOtherType: false,
    approver: {
      name: '',
      avatar: '',
      role: '默认审批人'
    },
    flowId: null,
    isEditMode: false,
    isDemo: false,
    userInfo: null,
    partnerInfo: null
  },

  onLoad(options) {
    // 游客 demo 模式
    if (options.demo) {
      this.loadDemoData();
      return;
    }

    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    
    this.loadUserInfo().then(() => {
      if (options.id) {
        this.setData({
          flowId: options.id,
          isEditMode: true
        });
        this.loadFlowData(options.id);
      } else {
        wx.hideLoading();
      }
    });
  },

  // 加载游客 demo 示例数据
  loadDemoData() {
    this.setData({
      isDemo: true,
      formData: {
        content: '示例：本月家庭聚餐费用报销申请',
        amount: '288.00',
        type: 'funds'
      },
      isOtherType: false,
      approver: {
        name: '示例伴侣',
        avatar: '/images/default_logo.png',
        role: '默认审批人'
      }
    });
  },

  // 加载用户信息和伴侣信息
  async loadUserInfo() {
    try {
      const userInfo = wx.getStorageSync('userInfo');
      
      if (!userInfo || !userInfo._openid) {
        Toast({
          context: this,
          selector: '#t-toast',
          message: '请先登录',
          theme: 'error',
          direction: 'column',
        });
        setTimeout(() => {
          wx.reLaunch({ url: '/pages/login/index' });
        }, 1500);
        return;
      }

      this.setData({ userInfo });

      // 检查是否已绑定伴侣
      if (!userInfo.partnerId || userInfo.relationStatus !== 'paired') {
        wx.hideLoading();
        wx.showModal({
          title: '提示',
          content: '您还未绑定伴侣，无法创建电子流申请',
          showCancel: false,
          success: () => {
            wx.navigateBack();
          }
        });
        return;
      }

      // 获取伴侣信息
      const db = wx.cloud.database();
      const partnerResult = await db.collection('users').where({
        _openid: userInfo.partnerId
      }).get();

      if (partnerResult.data.length > 0) {
        const partner = partnerResult.data[0];
        this.setData({
          partnerInfo: partner,
          approver: {
            name: partner.nickName,
            avatar: partner.avatarUrl,
            role: '默认审批人'
          }
        });
      }
    } catch (error) {
      console.error('加载用户信息失败：', error);
      Toast({
        context: this,
        selector: '#t-toast',
        message: '加载失败，请重试',
        theme: 'error',
        direction: 'column',
      });
    }
  },

  // 加载电子流数据（编辑模式）
  loadFlowData(id) {
    wx.cloud.callFunction({
      name: 'flowManager',
      data: {
        action: 'getDetail',
        flowId: id
      },
      success: (res) => {
        if (res.result && res.result.success) {
          const flow = res.result.data;
          
          // 只有已驳回的才能编辑
          if (flow.status !== 'rejected') {
            wx.hideLoading();
            wx.showModal({
              title: '提示',
              content: '只能编辑已驳回的申请',
              showCancel: false,
              success: () => {
                wx.navigateBack();
              }
            });
            return;
          }

          this.setData({
            formData: {
              content: flow.content,
              amount: flow.amount,
              type: flow.type
            },
            isOtherType: flow.type === 'other'
          });

          wx.setNavigationBarTitle({
            title: '编辑电子流'
          });
        } else {
          Toast({
            context: this,
            selector: '#t-toast',
            message: res.result.message || '加载失败',
            theme: 'error',
            direction: 'column',
          });
        }
        
        wx.hideLoading();
      },
      fail: (err) => {
        console.error('获取电子流详情失败：', err);
        wx.hideLoading();
        Toast({
          context: this,
          selector: '#t-toast',
          message: '加载失败，请重试',
          theme: 'error',
          direction: 'column',
        });
      }
    });
  },

  // 申请内容变更
  onContentChange(e) {
    this.setData({
      'formData.content': e.detail.value
    });
  },

  // 金额变更
  onAmountChange(e) {
    this.setData({
      'formData.amount': e.detail.value
    });
  },

  // 类型选择
  onTypeChange(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      'formData.type': type,
      isOtherType: type === 'other'
    });
  },

  // 转发给朋友
  onShareAppMessage() {
    const { isDemo, isEditMode } = this.data;
    if (isDemo) {
      return {
        title: '体验准了吗 · 轻松提交审批情侣电子流',
        path: '/pages/editFlow/index?demo=1'
      };
    }
    return {
      title: isEditMode ? '重新提交电子流申请' : '快来一起使用准了吗吧',
      path: '/pages/home/index'
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '情侣电子流 · 轻松提交审批申请',
      query: ''
    };
  },

  // 游客横幅点击
  onGuestBannerTap() {
    wx.navigateTo({ url: '/pages/login/index' });
  },

  // 取消
  onCancel() {
    wx.showModal({
      title: '提示',
      content: '确定要取消吗？未保存的内容将丢失。',
      success: (res) => {
        if (res.confirm) {
          wx.navigateBack();
        }
      }
    });
  },

  // 提交
  onSubmit() {
    // 游客 demo 模式，提示登录
    if (this.data.isDemo) {
      wx.showModal({
        title: '需要登录',
        content: '登录后即可创建真实的电子流申请，是否前往登录？',
        confirmText: '去登录',
        cancelText: '暂不',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/login/index' });
          }
        }
      });
      return;
    }

    const { content, amount, type } = this.data.formData;
    const { isOtherType, isEditMode, flowId } = this.data;

    // 验证申请内容
    if (!content || !content.trim()) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请填写申请内容',
        theme: 'warning',
        direction: 'column',
      });
      return;
    }

    // 验证类型
    if (!type) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请选择申请类型',
        theme: 'warning',
        direction: 'column',
      });
      return;
    }

    // 验证金额（非"其他"类型必填）
    if (!isOtherType) {
      if (!amount || parseFloat(amount) <= 0) {
        Toast({
          context: this,
          selector: '#t-toast',
          message: '请填写正确的申请金额',
          theme: 'warning',
          direction: 'column',
        });
        return;
      }
    }

    // 验证金额格式
    if (amount && amount.trim()) {
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum < 0) {
        Toast({
          context: this,
          selector: '#t-toast',
          message: '请填写正确的金额格式',
          theme: 'warning',
          direction: 'column',
        });
        return;
      }
    }

    // 提交数据
    const submitData = {
      content: content.trim(),
      amount: amount ? amount.toString() : '',
      type: type
    };

    wx.showLoading({
      title: isEditMode ? '更新中...' : '提交中...',
      mask: true
    });

    // 调用云函数
    const action = isEditMode ? 'update' : 'create';
    const callData = {
      action: action,
      flowData: submitData
    };

    if (isEditMode) {
      callData.flowId = flowId;
    }

    wx.cloud.callFunction({
      name: 'flowManager',
      data: callData,
      success: (res) => {     
        wx.hideLoading();
        
        if (res.result && res.result.success) {
          Toast({
            context: this,
            selector: '#t-toast',
            message: isEditMode ? '更新成功' : '提交成功',
            theme: 'success',
            direction: 'column',
          });

          // 延迟返回
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        } else {
          Toast({
            context: this,
            selector: '#t-toast',
            message: res.result.message || '提交失败',
            theme: 'error',
            direction: 'column',
          });
        }
      },
      fail: (err) => {
        console.error('提交失败：', err);
        wx.hideLoading();
        Toast({
          context: this,
          selector: '#t-toast',
          message: '提交失败，请重试',
          theme: 'error',
          direction: 'column',
        });
      }
    });
  }
});
