// pages/home/index.js
Page({
  data: {
    userInfo: {
      nickName: '谢熊猫',
      avatarUrl: 'https://via.placeholder.com/100'
    },
    monthlyExpense: '8,580',
    activeTab: 'todo',
    currentFilter: 'all',
    allFlows: [],
    flowList: [],
    // 模拟数据
    mockData: {
      todo: [
        {
          id: 1,
          applicantId: 'user2',
          applicantName: '小红',
          applicantAvatar: 'https://via.placeholder.com/80',
          content: '需要参加公司年会，想申请购买一套得体的礼服',
          amount: '1,580.00',
          type: 'other',
          typeText: '其他',
          status: 'pending',
          statusText: '待审批',
          createTime: '12-18 10:30'
        },
        {
          id: 2,
          applicantId: 'user2',
          applicantName: '小红',
          applicantAvatar: 'https://via.placeholder.com/80',
          content: '周末想去周边古镇游玩，放松一下心情',
          amount: '800.00',
          type: 'travel',
          typeText: '出行',
          status: 'pending',
          statusText: '待审批',
          createTime: '12-17 15:20'
        },
        {
          id: 3,
          applicantId: 'user2',
          applicantName: '小红',
          applicantAvatar: 'https://via.placeholder.com/80',
          content: '这个月生活费快用完了，想申请一笔拨款',
          amount: '2,000.00',
          type: 'funds',
          typeText: '拨款',
          status: 'pending',
          statusText: '待审批',
          createTime: '12-16 09:45'
        }
      ],
      myapply: [
        {
          id: 4,
          applicantId: 'user1',
          applicantName: '谢熊猫（我）',
          applicantAvatar: 'https://via.placeholder.com/80',
          content: '周末想去周边自驾游，租车费用和住宿费',
          amount: '1,200.00',
          type: 'travel',
          typeText: '出行',
          status: 'completed',
          statusText: '已完成',
          createTime: '12-15 14:20'
        },
        {
          id: 5,
          applicantId: 'user1',
          applicantName: '谢熊猫（我）',
          applicantAvatar: 'https://via.placeholder.com/80',
          content: '申请报名参加专业培训课程',
          amount: '3,200.00',
          type: 'other',
          typeText: '其他',
          status: 'rejected',
          statusText: '已驳回',
          createTime: '12-14 10:30'
        }
      ],
      completed: [
        {
          id: 4,
          applicantId: 'user1',
          applicantName: '谢熊猫（我）',
          applicantAvatar: 'https://via.placeholder.com/80',
          content: '周末想去周边自驾游，租车费用和住宿费',
          amount: '1,200.00',
          type: 'travel',
          typeText: '出行',
          status: 'completed',
          statusText: '已完成',
          createTime: '12-15 14:20'
        },
        {
          id: 6,
          applicantId: 'user2',
          applicantName: '小红',
          applicantAvatar: 'https://via.placeholder.com/80',
          content: '购买生日礼物送给妈妈',
          amount: '899.00',
          type: 'other',
          typeText: '其他',
          status: 'completed',
          statusText: '已完成',
          createTime: '12-13 16:45'
        }
      ]
    }
  },

  onLoad() {
    this.loadFlowList();
  },

  // 加载电子流列表
  loadFlowList() {
    const { activeTab, currentFilter, mockData } = this.data;
    let flows = mockData[activeTab] || [];
    
    // 按类型筛选
    if (currentFilter !== 'all') {
      flows = flows.filter(item => item.type === currentFilter);
    }
    
    this.setData({
      allFlows: mockData[activeTab] || [],
      flowList: flows
    });
  },

  // Tab 切换
  onTabChange(e) {
    this.setData({
      activeTab: e.detail.value,
      currentFilter: 'all'
    }, () => {
      this.loadFlowList();
    });
  },

  // 筛选器变更
  onFilterChange(e) {
    const filter = e.currentTarget.dataset.filter;
    this.setData({
      currentFilter: filter
    }, () => {
      this.loadFlowList();
    });
  },

  // 跳转到详情页
  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/flow-detail/index?id=${id}`
    });
  },

  // 跳转到创建页
  goToCreate() {
    wx.navigateTo({
      url: '/pages/editFlow/index'
    });
  },

  // 跳转到统计页
  goToStatistics() {
    wx.navigateTo({
      url: '/pages/statistics/index'
    });
  }
});
