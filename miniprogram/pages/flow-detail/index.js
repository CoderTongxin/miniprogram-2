// pages/flow-detail/index.js
import Toast from 'tdesign-miniprogram/toast/index';

Page({
  data: {
    flowId: null,
    flowData: {},
    canApprove: false, // 是否可以审批
    canEdit: false, // 是否可以编辑
    showRejectDialog: false,
    rejectReason: '',
    currentUserId: '',
    // 以下模拟数据仅供参考，已不再使用
    mockDataMap: {
      '1': {
        id: 1,
        applicantId: 'user2',
        applicantName: '小红',
        applicantAvatar: 'https://via.placeholder.com/100',
        approverId: 'user1',
        approverName: '谢熊猫',
        approverAvatar: 'https://via.placeholder.com/60',
        content: '需要参加公司年会，想申请购买一套得体的礼服。这是一个比较正式的场合，需要穿着合适的服装出席，希望能够给同事和领导留下好印象。',
        amount: '1,580.00',
        type: 'other',
        typeText: '其他',
        status: 'pending',
        statusText: '待审批',
        createTime: '2024-12-18 10:30',
        approveTime: '',
        rejectReason: '',
        approveComment: ''
      },
      '4': {
        id: 4,
        applicantId: 'user1',
        applicantName: '谢熊猫（我）',
        applicantAvatar: 'https://via.placeholder.com/100',
        approverId: 'user2',
        approverName: '小红',
        approverAvatar: 'https://via.placeholder.com/60',
        content: '周末想去周边自驾游，租车费用和住宿费。计划租车两天，预算800元，住宿一晚大约400元。可以好好放松一下，呼吸新鲜空气。',
        amount: '1,200.00',
        type: 'travel',
        typeText: '出行',
        status: 'completed',
        statusText: '已完成',
        createTime: '2024-12-15 14:20',
        approveTime: '2024-12-15 16:20',
        rejectReason: '',
        approveComment: '好久没出去玩了，这个计划不错！周末天气预报也很好，可以好好放松一下。记得带好相机，多拍点照片。'
      },
      '5': {
        id: 5,
        applicantId: 'user1',
        applicantName: '谢熊猫（我）',
        applicantAvatar: 'https://via.placeholder.com/100',
        approverId: 'user2',
        approverName: '小红',
        approverAvatar: 'https://via.placeholder.com/60',
        content: '想报名参加专业培训课程，提升职业技能。这个课程是行业内比较权威的认证培训，对职业发展很有帮助。课程为期3个月，包含线上学习和实践项目。',
        amount: '3,200.00',
        type: 'other',
        typeText: '其他',
        status: 'rejected',
        statusText: '已驳回',
        createTime: '2024-12-14 10:30',
        approveTime: '2024-12-14 15:45',
        rejectReason: '培训费用有点高，建议先看看公司是否有相关的培训资源或者报销政策。如果公司能够承担部分费用，我们再考虑申请剩余部分。另外，可以先试听一下免费课程，确认课程质量后再做决定。',
        approveComment: ''
      }
    }
  },

  onLoad(options) {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    
    // 获取当前用户信息
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

  // 加载电子流数据
  loadFlowData(flowId) {
    wx.cloud.callFunction({
      name: 'flowManager',
      data: {
        action: 'getDetail',
        flowId: flowId
      },
      success: (res) => {
        console.log('获取电子流详情成功：', res);
        
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

  // 通过申请
  onApprove() {
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
              console.log('审批通过成功：', res);
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
        console.log('驳回成功：', res);
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
    const { flowId } = this.data;
    wx.redirectTo({
      url: `/pages/editFlow/index?id=${flowId}`
    });
  }
});
