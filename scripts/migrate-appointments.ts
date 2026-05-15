import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 老数据来源：appointment 表
// deleted=1 → status=3(已取消)；deleted=0 且预约时间均在过去 → status=4(已过期)
// landlord_deleted / user_deleted：1=否 → false，2=是 → true
// appointment_time / created 均为 13 位毫秒时间戳
// 新 id 由数据库自增生成，不沿用老 id
const OLD_DATA = [
  { userId: 18, roomId: 3,  landlordId: 17, appointmentTime: 1619101644794, landlordDeleted: false, userDeleted: false, created: 1619101646915, deleted: true  },
  { userId: 17, roomId: 2,  landlordId: 19, appointmentTime: 1619101691602, landlordDeleted: false, userDeleted: false, created: 1619101816413, deleted: false },
  { userId: 18, roomId: 1,  landlordId: 17, appointmentTime: 1619265514189, landlordDeleted: false, userDeleted: true,  created: 1619178874579, deleted: false },
  { userId: 1,  roomId: 2,  landlordId: 19, appointmentTime: 1619183553485, landlordDeleted: false, userDeleted: false, created: 1619183554502, deleted: false },
  { userId: 9,  roomId: 3,  landlordId: 17, appointmentTime: 1620034483116, landlordDeleted: false, userDeleted: false, created: 1619710849618, deleted: false },
  { userId: 20, roomId: 6,  landlordId: 2,  appointmentTime: 1620809821472, landlordDeleted: false, userDeleted: false, created: 1620637026171, deleted: false },
  { userId: 20, roomId: 5,  landlordId: 10, appointmentTime: 1621511361654, landlordDeleted: false, userDeleted: false, created: 1620820164177, deleted: true  },
  { userId: 20, roomId: 9,  landlordId: 19, appointmentTime: 1620995893355, landlordDeleted: false, userDeleted: false, created: 1620823098127, deleted: true  },
  { userId: 19, roomId: 8,  landlordId: 20, appointmentTime: 1622388337668, landlordDeleted: false, userDeleted: false, created: 1620833140341, deleted: true  },
  { userId: 18, roomId: 4,  landlordId: 19, appointmentTime: 1622325600777, landlordDeleted: false, userDeleted: false, created: 1621496039639, deleted: false },
  { userId: 22, roomId: 10, landlordId: 18, appointmentTime: 1620438355969, landlordDeleted: false, userDeleted: false, created: 1621561559000, deleted: false },
  { userId: 19, roomId: 10, landlordId: 18, appointmentTime: 1624169814046, landlordDeleted: false, userDeleted: false, created: 1623046618783, deleted: false },
  { userId: 24, roomId: 12, landlordId: 18, appointmentTime: 1623571829511, landlordDeleted: false, userDeleted: false, created: 1623485432245, deleted: false },
  { userId: 26, roomId: 12, landlordId: 18, appointmentTime: 1623819802338, landlordDeleted: false, userDeleted: false, created: 1623733405201, deleted: false },
];

async function main() {
  console.log('开始迁移预约数据...\n');
  let successCount = 0;
  let skipCount = 0;

  for (const old of OLD_DATA) {
    // 校验关联数据是否存在于新库
    const [user, room] = await Promise.all([
      prisma.user.findUnique({ where: { id: old.userId }, select: { id: true, nickname: true, username: true } }),
      prisma.room.findUnique({ where: { id: old.roomId }, select: { id: true, name: true } }),
    ]);

    if (!user) {
      console.warn(`  [跳过] userId=${old.userId} 在新库中不存在，roomId=${old.roomId}`);
      skipCount++;
      continue;
    }
    if (!room) {
      console.warn(`  [跳过] roomId=${old.roomId} 在新库中不存在，userId=${old.userId}`);
      skipCount++;
      continue;
    }

    const createdAt = new Date(old.created);
    // deleted=true → 已取消(3)；否则时间都在 2021 年，均已过期(4)
    const status = old.deleted ? 3 : 4;

    const apt = await prisma.appointment.create({
      data: {
        userId:          old.userId,
        roomId:          old.roomId,
        landlordId:      old.landlordId,
        appointmentTime: new Date(old.appointmentTime),
        status,
        userDeleted:     old.userDeleted,
        landlordDeleted: old.landlordDeleted,
        createdAt,
        updatedAt: createdAt,
      },
    });

    const userName = user.nickname || user.username;
    const aptTimeStr = new Date(old.appointmentTime).toLocaleString('zh-CN');

    // 新预约通知（type=1）→ 房东，时间取当前
    await prisma.notification.create({
      data: {
        userId:      old.landlordId,
        type:        1,
        title:       '您有新的看房预约',
        content:     `用户 ${userName} 预约了您发布的房源「${room.name}」，预约时间为 ${aptTimeStr}`,
        relatedType: 'appointment',
        relatedId:   apt.id,
      },
    });

    // 已取消记录追加取消通知（type=2）→ 房东，时间取当前
    if (old.deleted) {
      await prisma.notification.create({
        data: {
          userId:      old.landlordId,
          type:        2,
          title:       '看房预约已取消',
          content:     `用户 ${userName} 的房源「${room.name}」看房预约已取消`,
          relatedType: 'appointment',
          relatedId:   apt.id,
        },
      });
    }

    console.log(`  ✓ userId=${old.userId} roomId=${old.roomId} → aptId=${apt.id}  status=${status}${old.deleted ? '（+取消通知）' : ''}`);
    successCount++;
  }

  console.log(`\n迁移完成：成功 ${successCount} 条，跳过 ${skipCount} 条`);
}

main()
  .catch((e) => {
    console.error('\n迁移失败：', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
