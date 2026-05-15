import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 老数据来源：contract 表
// 字段转换说明：
//   onlinetime / offlinetime：格式 "YYYY.MM.DD" → DateTime（UTC 00:00:00）
//   created / checkout_time ：13 位毫秒时间戳字符串 → DateTime
//   paid_period / paying_period：["YYYY.MM.DD-YYYY.MM.DD",...] → [{start:ISO,end:ISO},...]
//   ischeckout：1=未退→false  2=已退→true
//   refund：null→null  1=不退→false  2=退→true
//   landlord_deleted / user_deleted：1=否→false  2=是→true
//   status：ischeckout=1→1(进行中)  ischeckout=2→2(已完成)
//   renewMonths：老数据无此字段，统一设为 0
//   id：沿用老数据主键，插完后重置序列

function parseOldDate(s: string): Date {
  const [y, m, d] = s.split('.').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function parseTs(ts: string | null): Date | null {
  if (!ts) return null;
  return new Date(Number(ts));
}

// 老格式 "YYYY.MM.DD-YYYY.MM.DD" → {start, end}（ISO 字符串）
function parsePeriodStr(s: string): { start: string; end: string } {
  const [startStr, endStr] = s.split('-');
  return {
    start: parseOldDate(startStr).toISOString(),
    end: parseOldDate(endStr).toISOString(),
  };
}

function parsePeriods(json: string): { start: string; end: string }[] {
  const arr: string[] = JSON.parse(json);
  return arr.map(parsePeriodStr);
}

// 老 ischeckout：1=未退  2=已退
function parseIsCheckout(v: number): boolean {
  return v === 2;
}

// 老 refund：null=未退房  1=不退押金  2=退押金
function parseRefund(v: number | null): boolean | null {
  if (v === null) return null;
  return v === 2;
}

// 老 landlord_deleted / user_deleted：1=否  2=是
function parseDeletedFlag(v: number): boolean {
  return v === 2;
}

const OLD_CONTRACTS = [
  {
    id: 2,
    userId: 18, roomId: 1, landlordId: 17,
    tenancy: 14,
    onlineTime:  parseOldDate('2021.05.08'),
    offlineTime: parseOldDate('2022.07.08'),
    pledge: 1500, fee: 1500,
    paidPeriod: parsePeriods('["2021.05.08-2021.06.08","2021.06.08-2021.07.08","2021.07.08-2021.08.08","2021.08.08-2021.09.08","2021.09.08-2021.10.08","2021.10.08-2021.11.08"]'),
    payingPeriod: parsePeriods('["2021.11.08-2021.12.08","2021.12.08-2022.01.08","2022.01.08-2022.02.08","2022.02.08-2022.03.08","2022.03.08-2022.04.08","2022.04.08-2022.05.08","2022.05.08-2022.06.08","2022.06.08-2022.07.08"]'),
    renewTimes: 1, ischeckout: 1,
    refund: null as number | null,
    checkoutTime: null as string | null,
    landlordDeleted: 1, userDeleted: 1,
    created: '1619841679274',
  },
  {
    id: 3,
    userId: 2, roomId: 2, landlordId: 19,
    tenancy: 48,
    onlineTime:  parseOldDate('2021.05.07'),
    offlineTime: parseOldDate('2025.05.07'),
    pledge: 2000, fee: 6000,
    paidPeriod: parsePeriods('["2021.05.07-2021.08.07","2021.08.07-2021.11.07","2021.11.07-2022.02.07","2022.02.07-2022.05.07","2022.05.07-2022.08.07","2022.08.07-2022.11.07","2022.11.07-2023.02.07","2023.02.07-2023.05.07","2023.05.07-2023.08.07","2023.08.07-2023.11.07","2023.11.07-2024.02.07"]'),
    payingPeriod: parsePeriods('["2024.02.07-2024.05.07","2024.05.07-2024.08.07","2024.08.07-2024.11.07","2024.11.07-2025.02.07","2025.02.07-2025.05.07"]'),
    renewTimes: 11, ischeckout: 1,
    refund: null as number | null,
    checkoutTime: null as string | null,
    landlordDeleted: 1, userDeleted: 1,
    created: '1619842842654',
  },
  {
    id: 4,
    userId: 1, roomId: 3, landlordId: 17,
    tenancy: 12,
    onlineTime:  parseOldDate('2021.05.08'),
    offlineTime: parseOldDate('2022.05.08'),
    pledge: 3000, fee: 9000,
    paidPeriod: parsePeriods('["2021.05.08-2021.08.08","2021.08.08-2021.11.08"]'),
    payingPeriod: parsePeriods('["2021.11.08-2022.02.08","2022.02.08-2022.05.08"]'),
    renewTimes: 0, ischeckout: 1,
    refund: null as number | null,
    checkoutTime: null as string | null,
    landlordDeleted: 1, userDeleted: 1,
    created: '1620051761342',
  },
  {
    id: 5,
    userId: 18, roomId: 9, landlordId: 19,
    tenancy: 21,
    onlineTime:  parseOldDate('2021.05.14'),
    offlineTime: parseOldDate('2023.02.14'),
    pledge: 3900, fee: 11700,
    paidPeriod: parsePeriods('["2021.05.14-2021.08.14","2021.08.14-2021.11.14","2021.11.14-2022.02.14","2022.02.14-2022.05.14","2022.05.14-2022.08.14","2022.08.14-2022.11.14","2022.11.14-2023.02.14"]'),
    payingPeriod: parsePeriods('[]'),
    renewTimes: 3, ischeckout: 2,
    refund: 2 as number | null,
    checkoutTime: '1621680150218' as string | null,
    landlordDeleted: 1, userDeleted: 1,
    created: '1620876162900',
  },
  {
    id: 6,
    userId: 18, roomId: 8, landlordId: 20,
    tenancy: 24,
    onlineTime:  parseOldDate('2021.05.16'),
    offlineTime: parseOldDate('2023.05.16'),
    pledge: 1200, fee: 3600,
    paidPeriod: parsePeriods('["2021.05.16-2021.08.16","2021.08.16-2021.11.16","2021.11.16-2022.02.16","2022.02.16-2022.05.16","2022.05.16-2022.08.16","2022.08.16-2022.11.16"]'),
    payingPeriod: parsePeriods('["2022.11.16-2023.02.16","2023.02.16-2023.05.16"]'),
    renewTimes: 4, ischeckout: 2,
    refund: 1 as number | null,
    checkoutTime: '1620888585577' as string | null,
    landlordDeleted: 1, userDeleted: 1,
    created: '1620876579268',
  },
  {
    id: 7,
    userId: 24, roomId: 12, landlordId: 18,
    tenancy: 15,
    onlineTime:  parseOldDate('2021.06.13'),
    offlineTime: parseOldDate('2022.09.13'),
    pledge: 4550, fee: 13650,
    paidPeriod: parsePeriods('["2021.06.13-2021.09.13","2021.09.13-2021.12.13","2021.12.13-2022.03.13","2022.03.13-2022.06.13","2022.06.13-2022.09.13"]'),
    payingPeriod: parsePeriods('[]'),
    renewTimes: 1, ischeckout: 2,
    refund: 2 as number | null,
    checkoutTime: '1623485669185' as string | null,
    landlordDeleted: 1, userDeleted: 1,
    created: '1623485525726',
  },
  {
    id: 8,
    userId: 26, roomId: 12, landlordId: 18,
    tenancy: 15,
    onlineTime:  parseOldDate('2021.06.16'),
    offlineTime: parseOldDate('2022.09.16'),
    pledge: 4550, fee: 13650,
    paidPeriod: parsePeriods('["2021.06.16-2021.09.16","2021.09.16-2021.12.16","2021.12.16-2022.03.16","2022.03.16-2022.06.16","2022.06.16-2022.09.16"]'),
    payingPeriod: parsePeriods('[]'),
    renewTimes: 1, ischeckout: 2,
    refund: 2 as number | null,
    checkoutTime: '1623733624427' as string | null,
    landlordDeleted: 1, userDeleted: 1,
    created: '1623733480025',
  },
];

async function main() {
  console.log('开始迁移合同数据...\n');
  let successCount = 0;
  let skipCount = 0;

  for (const old of OLD_CONTRACTS) {
    // 校验关联数据是否存在于新库
    const [user, room, landlord] = await Promise.all([
      prisma.user.findUnique({ where: { id: old.userId },     select: { id: true, username: true, nickname: true } }),
      prisma.room.findUnique({ where: { id: old.roomId },     select: { id: true, name: true } }),
      prisma.user.findUnique({ where: { id: old.landlordId }, select: { id: true, username: true } }),
    ]);

    if (!user) {
      console.warn(`  [跳过] id=${old.id}：userId=${old.userId} 在新库中不存在`);
      skipCount++;
      continue;
    }
    if (!room) {
      console.warn(`  [跳过] id=${old.id}：roomId=${old.roomId} 在新库中不存在`);
      skipCount++;
      continue;
    }
    if (!landlord) {
      console.warn(`  [跳过] id=${old.id}：landlordId=${old.landlordId} 在新库中不存在`);
      skipCount++;
      continue;
    }

    const isCheckout   = parseIsCheckout(old.ischeckout);
    const refund       = parseRefund(old.refund);
    const checkoutTime = parseTs(old.checkoutTime);
    const createdAt    = parseTs(old.created)!;
    const status       = isCheckout ? 2 : 1;

    const paidPeriodJson   = JSON.stringify(old.paidPeriod);
    const payingPeriodJson = JSON.stringify(old.payingPeriod);

    // 使用 executeRaw 以保留指定主键
    await prisma.$executeRaw`
      INSERT INTO "contract" (
        "id", "userId", "roomId", "landlordId",
        "tenancy", "onlineTime", "offlineTime",
        "pledge", "fee", "paidPeriod", "payingPeriod",
        "renewTimes", "renewMonths", "status",
        "isCheckout", "checkoutTime", "refund",
        "landlordDeleted", "userDeleted",
        "createdAt", "updatedAt"
      ) VALUES (
        ${old.id}, ${old.userId}, ${old.roomId}, ${old.landlordId},
        ${old.tenancy}, ${old.onlineTime}, ${old.offlineTime},
        ${old.pledge}, ${old.fee}, ${paidPeriodJson}, ${payingPeriodJson},
        ${old.renewTimes}, ${0}, ${status},
        ${isCheckout}, ${checkoutTime}, ${refund},
        ${parseDeletedFlag(old.landlordDeleted)}, ${parseDeletedFlag(old.userDeleted)},
        ${createdAt}, ${createdAt}
      )
    `;

    const checkoutLabel = isCheckout
      ? `  已退房 refund=${refund}`
      : '  进行中';
    console.log(`  ✓ id=${old.id}  用户=${user.nickname ?? user.username}  房源=${room.name}${checkoutLabel}`);
    successCount++;
  }

  // 将未退房合同对应房源标记为已租出（isRented=2）
  const activeRoomIds = OLD_CONTRACTS
    .filter(c => c.ischeckout === 1)
    .map(c => c.roomId);

  if (activeRoomIds.length > 0) {
    await prisma.$executeRaw`
      UPDATE "room" SET "isRented" = 2, "updatedAt" = NOW()
      WHERE "id" = ANY(${activeRoomIds}::int[])
    `;
    console.log(`\n已将房源 [${activeRoomIds.join(', ')}] 标记为已租出（isRented=2）`);
  }

  // 重置自增序列，避免后续插入主键冲突
  await prisma.$executeRaw`
    SELECT setval(
      pg_get_serial_sequence('"contract"', 'id'),
      GREATEST((SELECT COALESCE(MAX("id"), 0) FROM "contract"), 1)
    )
  `;
  console.log('\n自增序列已重置');
  console.log(`\n迁移完成：成功 ${successCount} 条，跳过 ${skipCount} 条`);
}

main()
  .catch((e) => {
    console.error('\n迁移失败：', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
