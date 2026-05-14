import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 老数据来源：collection 表
// deleted=1 的记录跳过；created 为 13 位毫秒时间戳字符串；updatedAt 使用 createdAt 值
const oldData = [
  { id: 1,  user_id: 15, room_id: 2,  created: '1619016052576', deleted: 0 },
  { id: 6,  user_id: 18, room_id: 3,  created: '1619017037274', deleted: 1 },
  { id: 7,  user_id: 16, room_id: 3,  created: '1619017056101', deleted: 0 },
  { id: 8,  user_id: 18, room_id: 2,  created: '1619017120805', deleted: 0 },
  { id: 9,  user_id: 4,  room_id: 3,  created: '1619017147125', deleted: 0 },
  { id: 10, user_id: 9,  room_id: 1,  created: '1619017158482', deleted: 0 },
  { id: 11, user_id: 16, room_id: 3,  created: '1619019287287', deleted: 1 },
  { id: 12, user_id: 9,  room_id: 2,  created: '1619020527899', deleted: 0 },
  { id: 13, user_id: 14, room_id: 3,  created: '1620115698452', deleted: 0 },
  { id: 14, user_id: 1,  room_id: 3,  created: '1620117156265', deleted: 0 },
  { id: 15, user_id: 19, room_id: 8,  created: '1620819255146', deleted: 1 },
  { id: 16, user_id: 19, room_id: 8,  created: '1620819719804', deleted: 1 },
  { id: 17, user_id: 18, room_id: 9,  created: '1620825119708', deleted: 1 },
  { id: 18, user_id: 19, room_id: 9,  created: '1620833088189', deleted: 1 },
  { id: 19, user_id: 18, room_id: 8,  created: '1620869513802', deleted: 1 },
  { id: 20, user_id: 18, room_id: 9,  created: '1620893536219', deleted: 1 },
  { id: 21, user_id: 18, room_id: 9,  created: '1620959877159', deleted: 1 },
  { id: 22, user_id: 18, room_id: 9,  created: '1621496005190', deleted: 0 },
  { id: 23, user_id: 22, room_id: 9,  created: '1621561478436', deleted: 1 },
  { id: 24, user_id: 18, room_id: 10, created: '1621679684013', deleted: 0 },
  { id: 25, user_id: 19, room_id: 10, created: '1623046605248', deleted: 1 },
  { id: 26, user_id: 19, room_id: 10, created: '1623046672830', deleted: 1 },
  { id: 27, user_id: 24, room_id: 12, created: '1623485364095', deleted: 1 },
  { id: 28, user_id: 24, room_id: 12, created: '1623485420369', deleted: 0 },
  { id: 29, user_id: 25, room_id: 12, created: '1623553116754', deleted: 1 },
  { id: 30, user_id: 18, room_id: 12, created: '1623679990912', deleted: 1 },
  { id: 31, user_id: 18, room_id: 12, created: '1623680012515', deleted: 1 },
  { id: 32, user_id: 18, room_id: 12, created: '1623680612152', deleted: 0 },
  { id: 33, user_id: 26, room_id: 12, created: '1623733382896', deleted: 0 },
];

async function main() {
  console.log('开始迁移收藏数据...\n');

  const valid = oldData.filter((r) => r.deleted === 0);
  console.log(`原始记录 ${oldData.length} 条，过滤 deleted=1 后剩余 ${valid.length} 条\n`);

  let inserted = 0;
  let skipped = 0;

  for (const r of valid) {
    const ts = new Date(parseInt(r.created));
    try {
      await prisma.collection.create({
        data: {
          id: r.id,
          userId: r.user_id,
          roomId: r.room_id,
          createdAt: ts,
          updatedAt: ts,
        },
      });
      console.log(`✓ id=${r.id}  userId=${r.user_id}  roomId=${r.room_id}  createdAt=${ts.toISOString()}`);
      inserted++;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      // 外键不存在（用户或房源在新库中不存在）或唯一约束冲突时跳过
      console.warn(`⚠ id=${r.id}  userId=${r.user_id}  roomId=${r.room_id}  跳过 → ${msg.split('\n')[0]}`);
      skipped++;
    }
  }

  // 重置自增序列，避免后续插入主键冲突
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('collection', 'id'), (SELECT MAX(id) FROM collection))`;
  console.log('\n✓ 自增序列已重置');

  console.log(`\n迁移完成：成功 ${inserted} 条，跳过 ${skipped} 条。`);
}

main()
  .catch((e) => {
    console.error('迁移失败:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
