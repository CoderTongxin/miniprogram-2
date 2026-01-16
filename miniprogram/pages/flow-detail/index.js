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
    // 模拟数据
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
    const flowId = options.id;
    if (flowId) {
      this.setData({ flowId });
      this.loadFlowData(flowId);
    }
  },

  // 加载电子流数据
  loadFlowData(flowId) {
    const flowData = this.data.mockDataMap[flowId];
    
    if (flowData) {
      // 判断当前用户是否可以审批（这里简化处理，实际应根据用户ID判断）
      const currentUserId = 'user1'; // 模拟当前用户ID
      const canApprove = flowData.approverId === currentUserId && flowData.status === 'pending';
      const canEdit = flowData.applicantId === currentUserId && flowData.status === 'rejected';

      this.setData({
        flowData,
        canApprove,
        canEdit
      });
    }
  },

  // 通过申请
  onApprove() {
    wx.showModal({
      title: '确认通过',
      content: '确定要通过此申请吗？',
      success: (res) => {
        if (res.confirm) {
          // 模拟审批通过
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
    const { rejectReason } = this.data;
    
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

    // 模拟驳回操作
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
