// pages/flow-detail/index.js
import Toast from 'tdesign-miniprogram/toast/index';

Page({
  data: {
    flowId: null,
    flowData: {},
    canApprove: false,
    canEdit: false,
    showRejectDialog: false,
    rejectReason: '',
    currentUserId: '',
    isDemo: false
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
    
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo || !userInfo._openid) {
      wx.hideLoading();
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

    this.setData({
      currentUserId: userInfo._openid
    });
    
    const flowId = options.id;
    if (flowId) {
      this.setData({ flowId });
      this.loadFlowData(flowId);
    } else {
      wx.hideLoading();
      wx.showModal({
        title: '提示',
        content: '电子流ID不存在',
        showCancel: false,
        success: () => {
          wx.navigateBack();
        }
      });
    }
  },

  // 加载游客 demo 示例数据
  loadDemoData() {
    this.setData({
      isDemo: true,
      canApprove: false,
      canEdit: false,
      flowData: {
        _id: 'demo',
        content: '示例：本月家庭聚餐费用报销申请，包含餐饮、交通等费用',
        amount: '288.00',
        type: 'funds',
        typeText: '拨款',
        status: 'pending',
        statusText: '待审批',
        applicantName: '示例用户',
        applicantAvatar: '/images/default_logo.png',
        approverName: '示例伴侣',
        approverAvatar: '/images/default_logo.png',
        createTime: '2024-12-20 10:00',
        updateTime: '2024-12-20 10:00',
        rejectReason: ''
      }
    });
  },

  // 加载电子流数据
  loadFlowData(flowId) {
    wx.cloud.callFunction({
      name: 'flowManager',
      data: {
        action: 'getDetail',
        flowId: flowId
      },
      success: (res) => {
        if (res.result && res.result.success) {
          const flowData = res.result.data;
          const { currentUserId } = this.data;
          
          // 判断权限
          const canApprove = flowData.approverId === currentUserId && flowData.status === 'pending';
          const canEdit = flowData.applicantId === currentUserId && flowData.status === 'rejected';

          this.setData({
            flowData,
            canApprove,
            canEdit
          });
        } else {
          Toast({
            context: this,
            selector: '#t-toast',
            message: res.result.message || '加载失败',
            theme: 'error',
            direction: 'column',
          });
          
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
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
        
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }
    });
  },

  // 游客横幅点击
  onGuestBannerTap() {
    wx.navigateTo({ url: '/pages/login/index' });
  },

  // 游客操作拦截
  requireLoginForAction() {
    if (this.data.isDemo) {
      wx.showModal({
        title: '需要登录',
        content: '登录后即可进行审批操作，是否前往登录？',
        confirmText: '去登录',
        cancelText: '暂不',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/login/index' });
          }
        }
      });
      return false;
    }
    return true;
  },

  // 通过申请
  onApprove() {
    if (!this.requireLoginForAction()) return;
    wx.showModal({
      title: '确认通过',
      content: '确定要通过此申请吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '处理中...',
            mask: true
          });

          // 调用云函数审批通过
          wx.cloud.callFunction({
            name: 'flowManager',
            data: {
              action: 'approve',
              flowId: this.data.flowId,
              approveComment: '' // 可以添加审批备注输入
            },
            success: (res) => {
              wx.hideLoading();

              if (res.result && res.result.success) {
                Toast({
                  context: this,
                  selector: '#t-toast',
                  message: '已通过申请',
                  theme: 'success',
                  direction: 'column',
                });

                setTimeout(() => {
                  wx.navigateBack();
                }, 1500);
              } else {
                Toast({
                  context: this,
                  selector: '#t-toast',
                  message: res.result.message || '操作失败',
                  theme: 'error',
                  direction: 'column',
                });
              }
            },
            fail: (err) => {
              console.error('审批通过失败：', err);
              wx.hideLoading();
              
              Toast({
                context: this,
                selector: '#t-toast',
                message: '操作失败，请重试',
                theme: 'error',
                direction: 'column',
              });
            }
          });
        }
      }
    });
  },

  // 点击驳回按钮
  onReject() {
    if (!this.requireLoginForAction()) return;
    this.setData({
      showRejectDialog: true,
      rejectReason: ''
    });
  },

  // 驳回原因输入
  onRejectReasonChange(e) {
    this.setData({
      rejectReason: e.detail.value
    });
  },

  // 确认驳回
  onConfirmReject() {
    const { rejectReason, flowId } = this.data;
    
    if (!rejectReason || !rejectReason.trim()) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请输入驳回原因',
        theme: 'warning',
        direction: 'column',
      });
      return;
    }

    this.setData({
      showRejectDialog: false
    });

    wx.showLoading({
      title: '处理中...',
      mask: true
    });

    // 调用云函数驳回
    wx.cloud.callFunction({
      name: 'flowManager',
      data: {
        action: 'reject',
        flowId: flowId,
        rejectReason: rejectReason.trim()
      },
      success: (res) => {
        wx.hideLoading();

        if (res.result && res.result.success) {
          Toast({
            context: this,
            selector: '#t-toast',
            message: '已驳回申请',
            theme: 'success',
            direction: 'column',
          });

          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        } else {
          Toast({
            context: this,
            selector: '#t-toast',
            message: res.result.message || '操作失败',
            theme: 'error',
            direction: 'column',
          });
        }
      },
      fail: (err) => {
        console.error('驳回失败：', err);
        wx.hideLoading();
        
        Toast({
          context: this,
          selector: '#t-toast',
          message: '操作失败，请重试',
          theme: 'error',
          direction: 'column',
        });
      }
    });
  },

  // 取消驳回
  onCancelReject() {
    this.setData({
      showRejectDialog: false,
      rejectReason: ''
    });
  },

  // 重新编辑
  onEdit() {
    if (!this.requireLoginForAction()) return;
    const { flowId } = this.data;
    wx.redirectTo({
      url: `/pages/editFlow/index?id=${flowId}`
    });
  }
});
