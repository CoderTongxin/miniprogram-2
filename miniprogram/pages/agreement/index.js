// pages/agreement/index.js - 协议页面（包含用户协议和隐私政策）
Page({
  data: {
    activeTab: 'agreement' // 默认显示用户协议
  },

  onLoad(options) {
    // 通过 URL 参数指定显示哪个 tab
    // 用法: /pages/agreement/index?tab=privacy
    const tab = options.tab || 'agreement';
    this.setData({
      activeTab: tab
    });

    // 设置导航栏标题
    const title = tab === 'privacy' ? '隐私政策' : '用户协议';
    wx.setNavigationBarTitle({
      title: title
    });
  },

  // Tab 切换事件
  onTabChange(e) {
    const tab = e.detail.value;
    this.setData({
      activeTab: tab
    });

    // 更新导航栏标题
    const title = tab === 'privacy' ? '隐私政策' : '用户协议';
    wx.setNavigationBarTitle({
      title: title
    });
  }
});
