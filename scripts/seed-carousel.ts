import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 老数据，跳过 deleted=1 的记录（原始 id 3）
// image 字段：去掉 JSON 数组包装，去掉 /public 前缀，保留 /upload 开头
const oldData = [
  {
    id: 1,
    image: '/upload/avatar/20210514/1620960718667.jpg',
    path: '/room',
    createdAt: new Date(1628399473689),
  },
  {
    id: 2,
    image: '/upload/avatar/20210512/1620801705882.jpg',
    path: '/user',
    createdAt: new Date(1620801705882),
  },
  {
    id: 4,
    image: '/upload/avatar/20210514/1620960490152.png',
    path: '/room/list',
    createdAt: new Date(1620134077751),
  },
];

async function main() {
  console.log('开始导入轮播图数据...');

  await prisma.carousel.deleteMany();
  console.log('✓ 已清空旧数据');

  for (const item of oldData) {
    const result = await prisma.carousel.create({ data: item });
    console.log(`✓ 已插入: id=${result.id}  path=${result.path}`);
  }

  // 将自增序列重置到当前最大 id 之后，避免后续插入主键冲突
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('carousel', 'id'), (SELECT MAX(id) FROM carousel))`;
  console.log('✓ 自增序列已重置');

  console.log(`\n导入完成，共插入 ${oldData.length} 条记录。`);
}

main()
  .catch((e) => {
    console.error('导入失败:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
