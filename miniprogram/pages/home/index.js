// pages/home/index.js
import Toast from 'tdesign-miniprogram/toast/index';

Page({
  data: {
    userInfo: {},
    monthlyExpense: '0',
    activeTab: 'todo',
    currentFilter: 'all',
    flowList: [],
    loading: false,
    todoCount: 0 // 待办数量
  },

  onLoad() {
    this.checkLogin();
    this.loadFlowList();
    this.calculateMonthlyExpense();
    this.loadTodoCount(); // 加载待办数量
  },

  onShow() {
    this.checkLogin();
    // 刷新列表数据
    this.loadFlowList();
    this.calculateMonthlyExpense();
    this.loadTodoCount(); // 加载待办数量
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadFlowList();
    this.calculateMonthlyExpense();
    this.loadTodoCount(); // 刷新待办数量
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  },

  // 检查登录状态
  checkLogin() {
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo || !userInfo._openid) {
      wx.reLaunch({
        url: '/pages/login/index'
      });
      return;
    }
    
    this.setData({ userInfo });
  },

  // 加载电子流列表
  loadFlowList() {
    const { activeTab, currentFilter } = this.data;
    
    this.setData({ loading: true });
    
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    
    // 调用云函数获取数据
    wx.cloud.callFunction({
      name: 'flowManager',
      data: {
        action: 'getList',
        tab: activeTab,
        type: currentFilter
      },
      success: (res) => {
        console.log('获取电子流列表成功：', res);
        
        if (res.result && res.result.success) {
          this.setData({
            flowList: res.result.data,
            loading: false
          });
        } else {
          Toast({
            context: this,
            selector: '#t-toast',
            message: res.result.message || '获取数据失败',
            theme: 'error',
            direction: 'column',
          });
          this.setData({ loading: false });
        }
        
        wx.hideLoading();
      },
      fail: (err) => {
        console.error('获取电子流列表失败：', err);
        Toast({
          context: this,
          selector: '#t-toast',
          message: '获取数据失败，请重试',
          theme: 'error',
          direction: 'column',
        });
        this.setData({ loading: false });
        wx.hideLoading();
      }
    });
  },

  // 加载待办数量
  loadTodoCount() {
    wx.cloud.callFunction({
      name: 'flowManager',
      data: {
        action: 'getList',
        tab: 'todo',
        type: 'all'
      },
      success: (res) => {
        if (res.result && res.result.success) {
          const count = res.result.data.length;
          this.setData({
            todoCount: count
          });
        }
      },
      fail: (err) => {
        console.error('获取待办数量失败：', err);
      }
    });
  },

  // 计算本月支出
  calculateMonthlyExpense() {
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo || !userInfo._openid) return;
    
    // 获取本月已完成的电子流
    wx.cloud.callFunction({
      name: 'flowManager',
      data: {
        action: 'getList',
        tab: 'completed',
        type: 'all'
      },
      success: (res) => {
        if (res.result && res.result.success) {
          const flows = res.result.data;
          
          // 计算本月的支出（只计算当前用户作为申请人的）
          const now = new Date();
          const currentMonth = now.getMonth() + 1;
          const currentYear = now.getFullYear();
          
          let totalAmount = 0;
          flows.forEach(flow => {
            // 简单处理：只要是本月的都算（实际应该解析 createTime）
            const amount = parseFloat(flow.amount) || 0;
            totalAmount += amount;
          });
          
          // 格式化金额
          const formattedAmount = totalAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
          
          this.setData({
            monthlyExpense: formattedAmount
          });
        }
      },
      fail: (err) => {
        console.error('计算本月支出失败：', err);
      }
    });
  },

  // Tab 切换
  onTabChange(e) {
    const newTab = e.detail.value;
    
    this.setData({
      activeTab: newTab,
      currentFilter: 'all'
    });
    
    // 延迟加载，让 Tab 切换动画更流畅
    setTimeout(() => {
      this.loadFlowList();
      this.loadTodoCount(); // 切换 Tab 时也刷新待办数量
    }, 100);
  },

  // 筛选器变更
  onFilterChange(e) {
    const filter = e.currentTarget.dataset.filter;
    
    if (filter === this.data.currentFilter) {
      return; // 避免重复点击
    }
    
    this.setData({
      currentFilter: filter
    });
    
    // 延迟加载，让筛选动画更流畅
    setTimeout(() => {
      this.loadFlowList();
    }, 100);
  },

  // 跳转到详情页
  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    
    wx.navigateTo({
      url: `/pages/flow-detail/index?id=${id}`,
      success: () => {
        setTimeout(() => {
          wx.hideLoading();
        }, 300);
      },
      fail: () => {
        wx.hideLoading();
      }
    });
  },

  // 跳转到创建页
  goToCreate() {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    
    wx.navigateTo({
      url: '/pages/editFlow/index',
      success: () => {
        setTimeout(() => {
          wx.hideLoading();
        }, 300);
      },
      fail: () => {
        wx.hideLoading();
      }
    });
  },

  // 跳转到统计页
  goToStatistics() {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    
    wx.navigateTo({
      url: '/pages/statistics/index',
      success: () => {
        setTimeout(() => {
          wx.hideLoading();
        }, 300);
      },
      fail: () => {
        wx.hideLoading();
      }
    });
  },

  // 跳转到设置页
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
