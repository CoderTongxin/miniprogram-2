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
      name: '谢熊猫',
      avatar: 'https://via.placeholder.com/80',
      role: '默认审批人'
    },
    flowId: null, // 如果是编辑模式，会有 flowId
    isEditMode: false
  },

  onLoad(options) {
    // 如果有 id 参数，表示是编辑模式
    if (options.id) {
      this.setData({
        flowId: options.id,
        isEditMode: true
      });
      // 加载电子流数据
      this.loadFlowData(options.id);
    }
  },

  // 加载电子流数据（编辑模式）
  loadFlowData(id) {
    // 模拟加载数据
    const mockData = {
      content: '申请报名参加专业培训课程',
      amount: '3200',
      type: 'other'
    };
    
    this.setData({
      formData: mockData,
      isOtherType: mockData.type === 'other'
    });

    wx.setNavigationBarTitle({
      title: '编辑电子流'
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
    const { content, amount, type } = this.data.formData;
    const { isOtherType } = this.data;

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

    // 提交数据
    const submitData = {
      content: content.trim(),
      amount: amount ? parseFloat(amount) : null,
      type: type
    };

    console.log('提交数据：', submitData);

    Toast({
      context: this,
      selector: '#t-toast',
      message: '提交成功',
      theme: 'success',
      direction: 'column',
    });

    // 延迟返回
    setTimeout(() => {
      wx.navigateBack();
    }, 1500);
  }
});
