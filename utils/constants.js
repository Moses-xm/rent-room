export const pageSizeInit = 10;
export const pageSizeOptions = [1, 2, 5, 10, 20];

export const FontFamily = 'iconRentRoom';

export const RoomTypeOptions = ['普通住宅', '公寓'];

export const DirectionOptions = [
  '朝南',
  '朝北',
  '朝东',
  '朝西',
  '南北',
  '东西',
  '东南',
  '东北',
  '西南',
  '西北',
];

export const MngRouteList = [
  {
    key: 'welcome',
    path: '/',
    label: 'welcome',
    icon: 'icon-huanyingxiaolian',
  },
  {
    key: 'carousel',
    path: '/carousel',
    label: '轮播图管理',
    icon: 'icon-lunbotu',
  },
  {
    key: 'admin',
    label: '管理员管理',
    path: '/admin/list',
    icon: 'icon-fill',
  },
  {
    key: 'role',
    label: '角色管理',
    path: '/admin/role',
    icon: 'icon-jinzhi',
  },
  {
    key: 'permission',
    label: '权限管理',
    path: '/admin/permission',
    icon: 'icon-jinzhi',
  },
  {
    key: 'user',
    label: '用户管理',
    path: '/user',
    icon: 'icon-yonghu',
  },
  {
    key: 'community',
    label: '小区管理',
    path: '/community',
    icon: 'icon-zufang-',
  },
  {
    key: 'room',
    label: '房源管理',
    path: '/room',
    icon: 'icon-fangyuan1',
  },
  {
    key: 'facility',
    label: '房屋设施管理',
    path: '/facility',
    icon: 'icon-peitao',
  },
  {
    key: 'collection',
    label: '收藏管理',
    path: '/collection',
    icon: 'icon-shoucang',
  },
  {
    key: 'appointment',
    label: '预约管理',
    path: '/appointment',
    icon: 'icon-yuyue4',
  },
  {
    key: 'rentContract',
    label: '租房管理',
    path: '/rent/contract',
    icon: 'icon-zufangyuechifangzixianxing',
  },
  {
    key: 'order',
    label: '订单管理',
    path: '/order',
    icon: 'icon-icon-',
  },
];
