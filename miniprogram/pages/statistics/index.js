// pages/statistics/index.js
import Toast from 'tdesign-miniprogram/toast/index';

Page({
  data: {
    periodType: 'month', // year 或 month
    selectedYear: 0,
    selectedMonth: 0,
    currentPeriodText: '',
    
    // 年份和月份列表
    yearList: [],
    monthList: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    
    // 统计数据
    totalAmount: '0.00',
    totalCount: 0,
    approvedCount: 0,
    approveRate: 0,
    
    // 分类统计
    typeStats: [
      {
        type: 'funds',
        name: '拨款',
        amount: '0.00',
        percentage: 0,
        color: '#0052D9',
        lightColor: '#E0EDFF'
      },
      {
        type: 'travel',
        name: '出行',
        amount: '0.00',
        percentage: 0,
        color: '#E37318',
        lightColor: '#FFF4E5'
      },
      {
        type: 'other',
        name: '其他',
        amount: '0.00',
        percentage: 0,
        color: '#666666',
        lightColor: '#F2F3F5'
      }
    ],
    
    // 趋势数据
    trendData: [
      { period: '12月', amount: '0.00', change: 0 },
      { period: '11月', amount: '0.00', change: 0 },
      { period: '10月', amount: '0.00', change: 0 },
      { period: '9月', amount: '0.00', change: 0 },
      { period: '8月', amount: '0.00', change: 0 }
    ],
    
    // 统计摘要
    avgDaily: '0',
    maxSingle: '0',
    mostFrequent: '',
    rejectedCount: 0
  },

  onLoad() {
    // 初始化年份和月份
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    
    // 生成年份列表（当前年份及前3年）
    const yearList = []
    for (let i = 0; i < 4; i++) {
      yearList.unshift(currentYear - i)
    }
    
    this.setData({
      selectedYear: currentYear,
      selectedMonth: currentMonth,
      yearList: yearList
    }, () => {
      this.updatePeriodText()
      this.loadStatistics()
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
