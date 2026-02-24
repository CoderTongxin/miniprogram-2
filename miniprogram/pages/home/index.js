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
    todoCount: 0, // 待办数量
    // 分页相关
    page: 1,
    pageSize: 10,
    hasMore: true,
    total: 0,
    loadingMore: false,
    // 搜索相关
    searchKeyword: '',
    showSearch: false,
    // 游客模式
    isGuest: true
  },

  onLoad() {
    const isLoggedIn = this.checkLogin();
    
    if (isLoggedIn) {
      // 已登录用户：加载真实数据
      this.restoreTabState();
      this.loadFlowList();
      this.calculateMonthlyExpense();
      this.loadTodoCount();
    } else {
      // 游客模式：显示示例数据
      this.loadGuestData();
    }
  },

  onShow() {
    const isLoggedIn = this.checkLogin();
    
    if (isLoggedIn) {
      // 已登录用户：刷新数据
      const shouldRestore = wx.getStorageSync('shouldRestoreHomeTab');
      if (shouldRestore) {
        this.restoreTabState();
        wx.removeStorageSync('shouldRestoreHomeTab');
      }
      this.loadFlowList();
      this.calculateMonthlyExpense();
      this.loadTodoCount();
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    if (this.data.isGuest) {
      wx.stopPullDownRefresh();
      return;
    }
    this.resetAndLoadList();
    this.calculateMonthlyExpense();
    this.loadTodoCount();
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  },

  // 上拉加载更多
  onReachBottom() {
    if (this.data.isGuest) return;
    if (!this.data.hasMore || this.data.loadingMore) {
      return;
    }
    this.loadMoreFlowList();
  },

  // 检查登录状态（不强制跳转）
  checkLogin() {
    const userInfo = wx.getStorageSync('userInfo');
    const app = getApp();
    
    if (!userInfo || !userInfo._openid) {
      // 游客模式
      this.setData({ 
        isGuest: true,
        userInfo: {
          nickName: '游客',
          avatarUrl: '/images/default_logo.png'
        }
      });
      return false;
    }
    
    // 已登录
    this.setData({ 
      isGuest: false,
      userInfo: userInfo 
    });
    app.globalData.isGuest = false;
    return true;
  },

  // 加载游客模式示例数据
  loadGuestData() {
    const demoFlowList = [
      {
        id: 'demo1',
        applicantName: '示例用户',
        applicantAvatar: '/images/default_logo.png',
        content: '这是一个示例电子流申请，登录后可以创建真实的申请',
        amount: '100.00',
        type: 'other',
        typeText: '其他',
        status: 'pending',
        statusText: '待审批',
        createTime: '2024-12-20 10:00'
      },
      {
        id: 'demo2',
        applicantName: '示例用户',
        applicantAvatar: '/images/default_logo.png',
        content: '绑定伴侣后，你们可以互相审批电子流申请',
        amount: '200.00',
        type: 'funds',
        typeText: '拨款',
        status: 'completed',
        statusText: '已完成',
        createTime: '2024-12-19 15:30'
      }
    ];

    this.setData({
      flowList: demoFlowList,
      monthlyExpense: '0',
      todoCount: 0,
      hasMore: false,
      total: 2,
      loading: false
    });
  },

  // 检查是否需要登录
  requireLogin() {
    if (this.data.isGuest) {
      wx.showModal({
        title: '需要登录',
        content: '此功能需要登录后才能使用，是否前往登录？',
        confirmText: '去登录',
        cancelText: '暂不',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/login/index'
            });
          }
        }
      });
      return false;
    }
    return true;
  },

  // 保存当前 tab 和筛选状态
  saveTabState() {
    const { activeTab, currentFilter, searchKeyword } = this.data;
    wx.setStorageSync('homeTabState', {
      activeTab,
      currentFilter,
      searchKeyword
    });
  },

  // 恢复之前保存的 tab 和筛选状态
  restoreTabState() {
    const savedState = wx.getStorageSync('homeTabState');
    if (savedState) {
      this.setData({
        activeTab: savedState.activeTab || 'todo',
        currentFilter: savedState.currentFilter || 'all',
        searchKeyword: savedState.searchKeyword || ''
      });
    }
  },

  // 重置并加载列表
  resetAndLoadList() {
    this.setData({
      page: 1,
      flowList: [],
      hasMore: true
    });
    this.loadFlowList();
  },

  // 加载电子流列表（首次加载）
  loadFlowList() {
    const { activeTab, currentFilter, page, pageSize, searchKeyword } = this.data;
    
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
        type: currentFilter,
        page: page,
        pageSize: pageSize,
        searchKeyword: searchKeyword
      },
      success: (res) => {
        if (res.result && res.result.success) {
          const { data, pagination } = res.result;
          this.setData({
            flowList: data,
            hasMore: pagination.hasMore,
            total: pagination.total,
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

  // 加载更多数据
  loadMoreFlowList() {
    const { activeTab, currentFilter, page, pageSize, searchKeyword, flowList } = this.data;
    
    this.setData({ loadingMore: true });
    
    const nextPage = page + 1;
    
    wx.cloud.callFunction({
      name: 'flowManager',
      data: {
        action: 'getList',
        tab: activeTab,
        type: currentFilter,
        page: nextPage,
        pageSize: pageSize,
        searchKeyword: searchKeyword
      },
      success: (res) => {
        if (res.result && res.result.success) {
          const { data, pagination } = res.result;
          this.setData({
            flowList: flowList.concat(data),
            page: nextPage,
            hasMore: pagination.hasMore,
            total: pagination.total,
            loadingMore: false
          });
        } else {
          this.setData({ loadingMore: false });
        }
      },
      fail: (err) => {
        console.error('加载更多失败：', err);
        this.setData({ loadingMore: false });
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

  // 计算本月支出（使用统计接口获取当前月已完成的真实数据）
  calculateMonthlyExpense() {
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo || !userInfo._openid) return;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    wx.cloud.callFunction({
      name: 'flowManager',
      data: {
        action: 'getStatistics',
        periodType: 'month',
        year: currentYear,
        month: currentMonth
      },
      success: (res) => {
        if (res.result && res.result.success) {
          // getStatistics 返回的 totalAmount 已是当前月已完成金额的格式化字符串（元）
          const totalAmount = res.result.data.totalAmount || '0.00';
          const formattedAmount = totalAmount.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
          this.setData({
            monthlyExpense: formattedAmount
          });
        }
      },
      fail: (err) => {
        console.error('计算本月支出失败：', err);
        this.setData({ monthlyExpense: '0.00' });
      }
    });
  },

  // Tab 切换
  onTabChange(e) {
    const newTab = e.detail.value;
    
    this.setData({
      activeTab: newTab,
      currentFilter: 'all',
      searchKeyword: ''
    });
    
    // 游客模式下只切换 Tab UI，不触发云函数刷新
    if (this.data.isGuest) return;
    
    this.saveTabState();
    
    setTimeout(() => {
      this.resetAndLoadList();
      this.loadTodoCount();
    }, 100);
  },

  // 筛选器变更
  onFilterChange(e) {
    const filter = e.currentTarget.dataset.filter;
    
    if (filter === this.data.currentFilter) {
      return;
    }
    
    this.setData({
      currentFilter: filter
    });
    
    if (this.data.isGuest) return;
    
    this.saveTabState();
    
    setTimeout(() => {
      this.resetAndLoadList();
    }, 100);
  },

  // 切换搜索框显示
  toggleSearch() {
    this.setData({
      showSearch: !this.data.showSearch
    });
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
  },

  // 搜索框聚焦
  onSearchFocus() {
    // 可以在这里添加聚焦动画效果
  },

  // 搜索框失焦
  onSearchBlur() {
    if (this.data.isGuest) return;
    if (this.data.searchKeyword && this.data.searchKeyword.trim()) {
      setTimeout(() => {
        this.resetAndLoadList();
      }, 200);
    }
  },

  // 执行搜索
  onSearch() {
    if (this.data.isGuest) return;
    if (this.data.searchKeyword && this.data.searchKeyword.trim()) {
      this.saveTabState();
      this.resetAndLoadList();
    }
  },

  // 清空搜索
  onClearSearch() {
    this.setData({
      searchKeyword: ''
    });
    if (this.data.isGuest) return;
    this.saveTabState();
    this.resetAndLoadList();
  },

  // 跳转到详情页
  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    const isGuest = this.data.isGuest;
    
    if (!isGuest) {
      this.saveTabState();
      wx.setStorageSync('shouldRestoreHomeTab', true);
    }
    
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    
    const url = isGuest
      ? `/pages/flow-detail/index?demo=1`
      : `/pages/flow-detail/index?id=${id}`;
    
    wx.navigateTo({
      url,
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
    const isGuest = this.data.isGuest;
    
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    
    const url = isGuest
      ? '/pages/editFlow/index?demo=1'
      : '/pages/editFlow/index';
    
    wx.navigateTo({
      url,
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

  // 跳转到设置页（需要登录）
  goToSettings() {
    if (!this.requireLogin()) {
      return;
    }

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
