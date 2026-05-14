import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 老数据，跳过 deleted=1 的记录（原始 id 1 和 5）
const oldData = [
  { id: 2,  name: '复兴南苑', province: '浙江省', city: '杭州市', district: '上城区', street: '之江路', streetNumber: '525', subwayLine: '["4号线","5号线"]', lng: 120.17446453749564, lat: 30.21440109556798, cover: '/upload/avatar/20210520/1621497593397.jpg', createdAt: new Date(1618120817945) },
  { id: 3,  name: '钱江BLOCK', province: '浙江省', city: '杭州市', district: '西湖区', street: '河山街', streetNumber: null, subwayLine: '["6号线"]', lng: 120.09386982986098, lat: 30.134400946022794, cover: '/upload/avatar/20210520/1621497268535.jpg', createdAt: new Date(1618121230349) },
  { id: 4,  name: '碧桂园深蓝国际中心', province: '浙江省', city: '杭州市', district: '萧山区', street: '博奥路', streetNumber: null, subwayLine: '["2号线","6号线"]', lng: 120.2401882560807, lat: 30.241648898955905, cover: '/upload/avatar/20210520/1621499281900.jpg', createdAt: new Date(1618121326207) },
  { id: 6,  name: '金铂湾', province: '浙江省', city: '杭州市', district: '滨江区', street: '科技馆街', streetNumber: null, subwayLine: '["1号线","6号线"]', lng: 120.21642947487575, lat: 30.22024749343142, cover: '/upload/avatar/20210520/1621497888344.jpg', createdAt: new Date(1620108960103) },
  { id: 7,  name: '杭州金地广场', province: '浙江省', city: '杭州市', district: '余杭区', street: '古墩路', streetNumber: null, subwayLine: '["2号线"]', lng: 120.08882869031352, lat: 30.345809985301386, cover: '/upload/avatar/20210508/1620478901545.jpeg', createdAt: new Date(1620479786453) },
  { id: 8,  name: '滨兴家园', province: '浙江省', city: '杭州市', district: '滨江区', street: '滨兴路', streetNumber: null, subwayLine: '["6号线"]', lng: 120.2006245381812, lat: 30.197628796981586, cover: '/upload/avatar/20210510/1620654553780.jpeg', createdAt: new Date(1620654710997) },
  { id: 9,  name: '南肖埠北景东苑', province: '浙江省', city: '杭州市', district: '上城区', street: '凤起东路', streetNumber: '112号', subwayLine: '["2号线","4号线","5号线"]', lng: 120.2058745686649, lat: 30.268835393851568, cover: '/upload/avatar/20210510/1620658804500.jpeg', createdAt: new Date(1620659046779) },
  { id: 10, name: '北景月桂苑', province: '浙江省', city: '杭州市', district: '拱墅区', street: '回龙路', streetNumber: '312', subwayLine: null, lng: 120.1932237661877, lat: 30.34790462339769, cover: '/upload/avatar/20210608/1623146516254.jpeg', createdAt: new Date(1623146660475) },
  { id: 11, name: '温馨家园', province: '浙江省', city: '杭州市', district: '下城区', street: '头营巷', streetNumber: '43号', subwayLine: null, lng: 120.18790980661198, lat: 30.279143283244217, cover: '/upload/avatar/20210609/1623220132426.jpeg', createdAt: new Date(1623220179744) },
];

async function main() {
  console.log('开始导入小区数据...');

  for (const item of oldData) {
    const result = await prisma.community.create({ data: item });
    console.log(`✓ 已插入: ${result.name} (id=${result.id})`);
  }

  // 将自增序列重置到当前最大 id 之后，避免后续插入主键冲突
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('community', 'id'), (SELECT MAX(id) FROM community))`;
  console.log('✓ 自增序列已重置');

  console.log(`\n导入完成，共插入 ${oldData.length} 条记录。`);
}

main()
  .catch((e) => {
    console.error('导入失败:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
