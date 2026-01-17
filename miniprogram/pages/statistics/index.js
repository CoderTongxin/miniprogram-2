// pages/statistics/index.js
Page({
  data: {
    periodType: 'month', // year 或 month
    selectedYear: 2024,
    selectedMonth: 12,
    currentPeriodText: '2024年12月',
    
    // 年份和月份列表
    yearList: [2022, 2023, 2024, 2025],
    monthList: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    
    // 统计数据
    totalAmount: '8,580.00',
    totalCount: 15,
    approvedCount: 12,
    approveRate: 80,
    
    // 分类统计
    typeStats: [
      {
        type: 'funds',
        name: '拨款',
        amount: '5,000.00',
        percentage: 58,
        color: '#0052D9',
        lightColor: '#E0EDFF'
      },
      {
        type: 'travel',
        name: '出行',
        amount: '2,400.00',
        percentage: 28,
        color: '#E37318',
        lightColor: '#FFF4E5'
      },
      {
        type: 'other',
        name: '其他',
        amount: '1,180.00',
        percentage: 14,
        color: '#666666',
        lightColor: '#F2F3F5'
      }
    ],
    
    // 趋势数据
    trendData: [
      { period: '12月', amount: '8,580.00', change: 15 },
      { period: '11月', amount: '7,460.00', change: -8 },
      { period: '10月', amount: '8,120.00', change: 22 },
      { period: '9月', amount: '6,650.00', change: -5 },
      { period: '8月', amount: '7,000.00', change: 10 }
    ],
    
    // 统计摘要
    avgDaily: '476',
    maxSingle: '2,000',
    mostFrequent: '拨款',
    rejectedCount: 3
  },

  onLoad() {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    
    this.updatePeriodText();
    this.loadStatistics();
    
    setTimeout(() => {
      wx.hideLoading();
    }, 500);
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
    this.setData({
      periodType: type
    }, () => {
      this.updatePeriodText();
      this.loadStatistics();
    });
  },

  // 选择年份
  onYearChange(e) {
    const year = e.currentTarget.dataset.year;
    this.setData({
      selectedYear: year
    }, () => {
      this.updatePeriodText();
      this.loadStatistics();
    });
  },

  // 选择月份
  onMonthChange(e) {
    const month = e.currentTarget.dataset.month;
    this.setData({
      selectedMonth: month
    }, () => {
      this.updatePeriodText();
      this.loadStatistics();
    });
  },

  // 加载统计数据
  loadStatistics() {
    const { periodType, selectedYear, selectedMonth } = this.data;
    
    // 这里应该调用API加载实际数据
    // 现在使用模拟数据
    console.log('加载统计数据:', { periodType, selectedYear, selectedMonth });
    
    // 根据不同的时间范围，可以更新不同的统计数据
    if (periodType === 'year') {
      // 年度数据
      this.setData({
        totalAmount: '98,560.00',
        totalCount: 156,
        approvedCount: 128,
        approveRate: 82,
        trendData: [
          { period: '12月', amount: '8,580.00', change: 15 },
          { period: '11月', amount: '7,460.00', change: -8 },
          { period: '10月', amount: '8,120.00', change: 22 },
          { period: '9月', amount: '6,650.00', change: -5 },
          { period: '8月', amount: '7,000.00', change: 10 },
          { period: '7月', amount: '9,200.00', change: 18 },
          { period: '6月', amount: '7,800.00', change: -2 },
          { period: '5月', amount: '8,950.00', change: 12 }
        ],
        avgDaily: '270',
        maxSingle: '5,000',
        mostFrequent: '拨款',
        rejectedCount: 28
      });
    } else {
      // 月度数据
      this.setData({
        totalAmount: '8,580.00',
        totalCount: 15,
        approvedCount: 12,
        approveRate: 80,
        trendData: [
          { period: '12月', amount: '8,580.00', change: 15 },
          { period: '11月', amount: '7,460.00', change: -8 },
          { period: '10月', amount: '8,120.00', change: 22 },
          { period: '9月', amount: '6,650.00', change: -5 },
          { period: '8月', amount: '7,000.00', change: 10 }
        ],
        avgDaily: '476',
        maxSingle: '2,000',
        mostFrequent: '拨款',
        rejectedCount: 3
      });
    }
  }
});
