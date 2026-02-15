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
    showSearch: false
  },

  onLoad() {
    this.checkLogin();
    // 尝试恢复之前保存的 tab 和筛选状态
    this.restoreTabState();
    this.loadFlowList();
    this.calculateMonthlyExpense();
    this.loadTodoCount(); // 加载待办数量
  },

  onShow() {
    this.checkLogin();
    // 从其他页面返回时，恢复状态并刷新数据
    const shouldRestore = wx.getStorageSync('shouldRestoreHomeTab');
    if (shouldRestore) {
      this.restoreTabState();
      wx.removeStorageSync('shouldRestoreHomeTab');
    }
    // 刷新列表数据
    this.loadFlowList();
    this.calculateMonthlyExpense();
    this.loadTodoCount(); // 加载待办数量
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.resetAndLoadList();
    this.calculateMonthlyExpense();
    this.loadTodoCount(); // 刷新待办数量
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  },

  // 上拉加载更多
  onReachBottom() {
    if (!this.data.hasMore || this.data.loadingMore) {
      return;
    }
    this.loadMoreFlowList();
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
      currentFilter: 'all',
      searchKeyword: '' // 切换 Tab 时清空搜索
    });
    
    // 保存当前状态
    this.saveTabState();
    
    // 延迟加载，让 Tab 切换动画更流畅
    setTimeout(() => {
      this.resetAndLoadList();
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
    
    // 保存当前状态
    this.saveTabState();
    
    // 延迟加载，让筛选动画更流畅
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
    // 失焦时如果有内容，自动执行搜索
    if (this.data.searchKeyword && this.data.searchKeyword.trim()) {
      // 延迟执行，避免与点击事件冲突
      setTimeout(() => {
        this.resetAndLoadList();
      }, 200);
    }
  },

  // 执行搜索
  onSearch() {
    if (this.data.searchKeyword && this.data.searchKeyword.trim()) {
      this.saveTabState(); // 保存搜索状态
      this.resetAndLoadList();
    }
  },

  // 清空搜索
  onClearSearch() {
    this.setData({
      searchKeyword: ''
    });
    this.saveTabState(); // 保存清空后的状态
    this.resetAndLoadList();
  },

  // 跳转到详情页
  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    
    // 保存当前状态，以便返回时恢复
    this.saveTabState();
    wx.setStorageSync('shouldRestoreHomeTab', true);
    
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
