import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 老数据来源：facility 表，跳过 deleted=1 的记录（原始数据无 deleted=1 条目）
// created 字段为 13 位毫秒时间戳字符串
const oldData = [
  { id: 1,  name: '冰箱',   icon: 'icon-bingxiang1',    createdAt: new Date(1620053827326) },
  { id: 2,  name: '洗衣机', icon: 'icon-xiyiji',         createdAt: new Date(1620053906719) },
  { id: 3,  name: '热水器', icon: 'icon-reshuiqi',        createdAt: new Date(1620053973067) },
  { id: 4,  name: '空调',   icon: 'icon-kongtiao',        createdAt: new Date(1620054248136) },
  { id: 5,  name: '卫生间', icon: 'icon-weishengjian-',   createdAt: new Date(1620054281080) },
  { id: 6,  name: '床',     icon: 'icon-chuang1',         createdAt: new Date(1620054338294) },
  { id: 7,  name: '衣柜',   icon: 'icon-yigui',           createdAt: new Date(1620054364455) },
  { id: 8,  name: '阳台',   icon: 'icon-yangtai-',        createdAt: new Date(1620054390462) },
  { id: 9,  name: '可做饭', icon: 'icon-kezuofan-',       createdAt: new Date(1620054414201) },
  { id: 10, name: '油烟机', icon: 'icon-chouyanji',       createdAt: new Date(1620054433582) },
  { id: 11, name: '燃气灶', icon: 'icon-ranqizao',        createdAt: new Date(1620054447358) },
  { id: 12, name: '电视',   icon: 'icon-icon3',           createdAt: new Date(1620054516504) },
  { id: 13, name: '宽带',   icon: 'icon-kuandai',         createdAt: new Date(1620054559343) },
  { id: 14, name: '智能门锁', icon: 'icon-zhinengmensuo', createdAt: new Date(1620056116902) },
  { id: 15, name: '沙发',   icon: 'icon-shafa',           createdAt: new Date(1620056166845) },
  { id: 16, name: '暖气',   icon: 'icon-nuanqi',          createdAt: new Date(1620056239248) },
];

async function main() {
  console.log('开始导入房屋设施数据...');

  await prisma.facility.deleteMany();
  console.log('✓ 已清空旧数据');

  for (const item of oldData) {
    const result = await prisma.facility.create({
      data: {
        id: item.id,
        name: item.name,
        icon: item.icon,
        createdAt: item.createdAt,
        updatedAt: item.createdAt,
      },
    });
    console.log(`✓ 已插入: id=${result.id}  name=${result.name}  icon=${result.icon}`);
  }

  // 重置自增序列，避免后续插入主键冲突
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('facility', 'id'), (SELECT MAX(id) FROM facility))`;
  console.log('✓ 自增序列已重置');

  console.log(`\n导入完成，共插入 ${oldData.length} 条记录。`);
}

main()
  .catch((e) => {
    console.error('导入失败:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
