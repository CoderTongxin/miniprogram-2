// pages/statistics/index.js
import Toast from 'tdesign-miniprogram/toast/index';

Page({
  data: {
    periodType: 'month',
    selectedYear: 0,
    selectedMonth: 0,
    currentPeriodText: '',
    isDemo: false,
    
    yearList: [],
    monthList: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    
    totalAmount: '0.00',
    totalCount: 0,
    approvedCount: 0,
    approveRate: 0,
    
    typeStats: [
      { type: 'funds', name: '拨款', amount: '0.00', percentage: 0, color: '#0052D9', lightColor: '#E0EDFF' },
      { type: 'travel', name: '出行', amount: '0.00', percentage: 0, color: '#E37318', lightColor: '#FFF4E5' },
      { type: 'other', name: '其他', amount: '0.00', percentage: 0, color: '#666666', lightColor: '#F2F3F5' }
    ],
    
    trendData: [
      { period: '12月', amount: '0.00', change: 0 },
      { period: '11月', amount: '0.00', change: 0 },
      { period: '10月', amount: '0.00', change: 0 },
      { period: '9月', amount: '0.00', change: 0 },
      { period: '8月', amount: '0.00', change: 0 }
    ],
    
    avgDaily: '0',
    maxSingle: '0',
    mostFrequent: '',
    rejectedCount: 0
  },

  onLoad() {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    
    const yearList = []
    for (let i = 0; i < 4; i++) {
      yearList.unshift(currentYear - i)
    }

    // 判断是否为游客模式
    const userInfo = wx.getStorageSync('userInfo');
    const isGuest = !userInfo || !userInfo._openid;
    
    this.setData({
      isDemo: isGuest,
      selectedYear: currentYear,
      selectedMonth: currentMonth,
      yearList: yearList
    }, () => {
      this.updatePeriodText()
      if (isGuest) {
        this.loadDemoStatistics();
      } else {
        this.loadStatistics();
      }
    });
  },

  // 加载游客 demo 统计数据
  loadDemoStatistics() {
    this.setData({
      totalAmount: '1,580.00',
      totalCount: 8,
      approvedCount: 6,
      rejectedCount: 1,
      approveRate: 75,
      typeStats: [
        { type: 'funds', name: '拨款', amount: '880.00', percentage: 55.7, color: '#0052D9', lightColor: '#E0EDFF' },
        { type: 'travel', name: '出行', amount: '480.00', percentage: 30.4, color: '#E37318', lightColor: '#FFF4E5' },
        { type: 'other', name: '其他', amount: '220.00', percentage: 13.9, color: '#666666', lightColor: '#F2F3F5' }
      ],
      trendData: [
        { period: '12月', amount: '1,580.00', change: 12 },
        { period: '11月', amount: '1,410.00', change: -5 },
        { period: '10月', amount: '1,480.00', change: 8 },
        { period: '9月', amount: '1,370.00', change: 3 },
        { period: '8月', amount: '1,330.00', change: 0 }
      ],
      avgDaily: '52.67',
      maxSingle: '580.00',
      mostFrequent: '拨款'
    });
  },

  // 更新时间范围文本
  updatePeriodText() {
    const { periodType, selectedYear, selectedMonth } = this.data;
    let text = '';
    
    if (periodType === 'year') {
      text = `${selectedYear}年`;
    } else {
      text = `${selectedYear}年${selectedMonth}月`;
    }
    
    this.setData({ currentPeriodText: text });
  },

  // 切换年度/月度
  onPeriodTypeChange(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ periodType: type }, () => {
      this.updatePeriodText();
      if (this.data.isDemo) {
        this.loadDemoStatistics();
      } else {
        this.loadStatistics();
      }
    });
  },

  // 选择年份
  onYearChange(e) {
    const year = e.currentTarget.dataset.year;
    this.setData({ selectedYear: year }, () => {
      this.updatePeriodText();
      if (this.data.isDemo) {
        this.loadDemoStatistics();
      } else {
        this.loadStatistics();
      }
    });
  },

  // 选择月份
  onMonthChange(e) {
    const month = e.currentTarget.dataset.month;
    this.setData({ selectedMonth: month }, () => {
      this.updatePeriodText();
      if (this.data.isDemo) {
        this.loadDemoStatistics();
      } else {
        this.loadStatistics();
      }
    });
  },

  // 转发给朋友
  onShareAppMessage() {
    const { currentPeriodText, totalAmount, approveRate, isDemo } = this.data;
    const demoTip = isDemo ? '（示例）' : '';
    return {
      title: `${demoTip}${currentPeriodText} 总支出 ¥${totalAmount}，审批通过率 ${approveRate}%`,
      path: '/pages/statistics/index'
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    const { currentPeriodText, totalAmount, isDemo } = this.data;
    const demoTip = isDemo ? '（示例）' : '';
    return {
      title: `${demoTip}情侣账单 · ${currentPeriodText}共支出 ¥${totalAmount}`,
      query: ''
    };
  },

  // 加载统计数据
  loadStatistics() {
    const { periodType, selectedYear, selectedMonth } = this.data;
    
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    
    // 调用云函数获取统计数据
    wx.cloud.callFunction({
      name: 'flowManager',
      data: {
        action: 'getStatistics',
        periodType: periodType,
        year: selectedYear,
        month: selectedMonth
      },
      success: (res) => {
        if (res.result && res.result.success) {
          const data = res.result.data;
          
          this.setData({
            totalAmount: data.totalAmount,
            totalCount: data.totalCount,
            approvedCount: data.approvedCount,
            rejectedCount: data.rejectedCount,
            approveRate: data.approveRate,
            typeStats: data.typeStats,
            trendData: data.trendData,
            avgDaily: data.avgDaily,
            maxSingle: data.maxSingle,
            mostFrequent: data.mostFrequent
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
        console.error('获取统计数据失败：', err);
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
  }
});
