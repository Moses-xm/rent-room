import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 老数据来源：order 表
// 字段转换说明：
//   payer_id / room_id / payee_id → payerId / roomId / payeeId（驼峰）
//   paid_period：格式 "YYYY.MM.DD-YYYY.MM.DD" → "YYYY-MM-DD~YYYY-MM-DD"
//   created：13 位毫秒时间戳字符串 → DateTime（同时作为 updatedAt）
//   type：pledge != null → 1(首期款)；pledge == null → 2(续期房租)
//   contractId：按 (userId, roomId, landlordId) 从新库动态查询
//   deleted=1 的记录跳过（本批数据均为 0，可放心插入）
//   id：沿用老数据主键，插完后重置序列

interface OldOrder {
  id: number;
  payer_id: number;
  room_id: number;
  payee_id: number;
  fee: number | null;
  pledge: number | null;
  paid_period: string | null;
  created: string;
  deleted: number;
}

const OLD_ORDERS: OldOrder[] = [
  { id: 1,  payer_id: 2,  room_id: 2,  payee_id: 19, fee: 6000,  pledge: null, paid_period: '2022.11.07-2023.02.07', created: '1620030294769', deleted: 0 },
  { id: 2,  payer_id: 18, room_id: 1,  payee_id: 17, fee: 1500,  pledge: null, paid_period: '2021.08.08-2021.09.08', created: '1620031182874', deleted: 0 },
  { id: 3,  payer_id: 18, room_id: 1,  payee_id: 17, fee: 1500,  pledge: null, paid_period: '2021.09.08-2021.10.08', created: '1620031260866', deleted: 0 },
  { id: 4,  payer_id: 2,  room_id: 2,  payee_id: 19, fee: 6000,  pledge: null, paid_period: '2023.02.07-2023.05.07', created: '1620031312454', deleted: 0 },
  { id: 5,  payer_id: 2,  room_id: 2,  payee_id: 19, fee: 6000,  pledge: null, paid_period: '2023.05.07-2023.08.07', created: '1620031342718', deleted: 0 },
  { id: 6,  payer_id: 2,  room_id: 2,  payee_id: 19, fee: 6000,  pledge: null, paid_period: '2023.08.07-2023.11.07', created: '1620031623666', deleted: 0 },
  { id: 7,  payer_id: 2,  room_id: 2,  payee_id: 19, fee: 6000,  pledge: null, paid_period: '2023.11.07-2024.02.07', created: '1620031641368', deleted: 0 },
  { id: 8,  payer_id: 1,  room_id: 3,  payee_id: 17, fee: 9000,  pledge: 3000, paid_period: '2021.05.08-2021.08.08', created: '1620051761342', deleted: 0 },
  { id: 9,  payer_id: 1,  room_id: 3,  payee_id: 17, fee: 9000,  pledge: null, paid_period: '2021.08.08-2021.11.08', created: '1620051784142', deleted: 0 },
  { id: 10, payer_id: 18, room_id: 9,  payee_id: 19, fee: 11700, pledge: 3900, paid_period: '2021.05.14-2021.08.14', created: '1620876162900', deleted: 0 },
  { id: 11, payer_id: 18, room_id: 8,  payee_id: 20, fee: 3600,  pledge: 1200, paid_period: '2021.05.16-2021.08.16', created: '1620876579268', deleted: 0 },
  { id: 12, payer_id: 18, room_id: 8,  payee_id: 20, fee: 3600,  pledge: null, paid_period: '2021.08.16-2021.11.16', created: '1620885330950', deleted: 0 },
  { id: 13, payer_id: 18, room_id: 8,  payee_id: 20, fee: 3600,  pledge: null, paid_period: '2021.11.16-2022.02.16', created: '1620885354495', deleted: 0 },
  { id: 14, payer_id: 18, room_id: 8,  payee_id: 20, fee: 3600,  pledge: null, paid_period: '2022.02.16-2022.05.16', created: '1620886196738', deleted: 0 },
  { id: 15, payer_id: 18, room_id: 9,  payee_id: 19, fee: 11700, pledge: null, paid_period: '2021.08.14-2021.11.14', created: '1620886557331', deleted: 0 },
  { id: 16, payer_id: 18, room_id: 8,  payee_id: 20, fee: 3600,  pledge: null, paid_period: '2022.05.16-2022.08.16', created: '1620888296679', deleted: 0 },
  { id: 17, payer_id: 18, room_id: 8,  payee_id: 20, fee: 3600,  pledge: null, paid_period: '2022.08.16-2022.11.16', created: '1620888568573', deleted: 0 },
  { id: 18, payer_id: 18, room_id: 9,  payee_id: 19, fee: 11700, pledge: null, paid_period: '2021.11.14-2022.02.14', created: '1621236565028', deleted: 0 },
  { id: 19, payer_id: 18, room_id: 9,  payee_id: 19, fee: 11700, pledge: null, paid_period: '2022.02.14-2022.05.14', created: '1621236573058', deleted: 0 },
  { id: 20, payer_id: 18, room_id: 9,  payee_id: 19, fee: 11700, pledge: null, paid_period: '2022.05.14-2022.08.14', created: '1621236581890', deleted: 0 },
  { id: 21, payer_id: 18, room_id: 1,  payee_id: 17, fee: 1500,  pledge: null, paid_period: '2021.10.08-2021.11.08', created: '1621679940472', deleted: 0 },
  { id: 22, payer_id: 18, room_id: 9,  payee_id: 19, fee: 11700, pledge: null, paid_period: '2022.08.14-2022.11.14', created: '1621680133180', deleted: 0 },
  { id: 23, payer_id: 18, room_id: 9,  payee_id: 19, fee: 11700, pledge: null, paid_period: '2022.11.14-2023.02.14', created: '1621680143471', deleted: 0 },
  { id: 24, payer_id: 24, room_id: 12, payee_id: 18, fee: 13650, pledge: 4550, paid_period: '2021.06.13-2021.09.13', created: '1623485525726', deleted: 0 },
  { id: 25, payer_id: 24, room_id: 12, payee_id: 18, fee: 13650, pledge: null, paid_period: '2021.09.13-2021.12.13', created: '1623485578245', deleted: 0 },
  { id: 26, payer_id: 24, room_id: 12, payee_id: 18, fee: 13650, pledge: null, paid_period: '2021.12.13-2022.03.13', created: '1623485641908', deleted: 0 },
  { id: 27, payer_id: 24, room_id: 12, payee_id: 18, fee: 13650, pledge: null, paid_period: '2022.03.13-2022.06.13', created: '1623485649790', deleted: 0 },
  { id: 28, payer_id: 24, room_id: 12, payee_id: 18, fee: 13650, pledge: null, paid_period: '2022.06.13-2022.09.13', created: '1623485657736', deleted: 0 },
  { id: 29, payer_id: 26, room_id: 12, payee_id: 18, fee: 13650, pledge: 4550, paid_period: '2021.06.16-2021.09.16', created: '1623733480025', deleted: 0 },
  { id: 30, payer_id: 26, room_id: 12, payee_id: 18, fee: 13650, pledge: null, paid_period: '2021.09.16-2021.12.16', created: '1623733521514', deleted: 0 },
  { id: 31, payer_id: 26, room_id: 12, payee_id: 18, fee: 13650, pledge: null, paid_period: '2021.12.16-2022.03.16', created: '1623733533406', deleted: 0 },
  { id: 32, payer_id: 26, room_id: 12, payee_id: 18, fee: 13650, pledge: null, paid_period: '2022.03.16-2022.06.16', created: '1623733600109', deleted: 0 },
  { id: 33, payer_id: 26, room_id: 12, payee_id: 18, fee: 13650, pledge: null, paid_period: '2022.06.16-2022.09.16', created: '1623733607764', deleted: 0 },
];

// "2021.05.08-2021.08.08" → "2021-05-08~2021-08-08"
function convertPaidPeriod(p: string | null): string | null {
  if (!p) return null;
  const m = p.match(/^(\d{4})\.(\d{2})\.(\d{2})-(\d{4})\.(\d{2})\.(\d{2})$/);
  if (!m) return p;
  return `${m[1]}-${m[2]}-${m[3]}~${m[4]}-${m[5]}-${m[6]}`;
}

async function main() {
  console.log('开始迁移订单数据...\n');

  // 预先查询所有涉及的合同，按 (userId, roomId, landlordId) 建立映射
  const contractMap = new Map<string, number>();
  const uniqueCombos = [
    ...new Set(OLD_ORDERS.map((o) => `${o.payer_id}-${o.room_id}-${o.payee_id}`)),
  ];

  console.log('查询关联合同...');
  for (const combo of uniqueCombos) {
    const [payerId, roomId, payeeId] = combo.split('-').map(Number);
    const contract = await prisma.contract.findFirst({
      where: { userId: payerId, roomId, landlordId: payeeId },
      orderBy: { id: 'asc' },
      select: { id: true },
    });
    if (contract) {
      contractMap.set(combo, contract.id);
      console.log(`  ✓ (payer=${payerId}, room=${roomId}, payee=${payeeId}) → contractId=${contract.id}`);
    } else {
      console.warn(`  ✗ 未找到合同：payer=${payerId}, room=${roomId}, payee=${payeeId}`);
    }
  }

  let successCount = 0;
  let skipCount = 0;
  console.log('\n插入订单...');

  for (const o of OLD_ORDERS) {
    if (o.deleted !== 0) {
      console.log(`  [跳过] id=${o.id}：已删除（deleted=${o.deleted}）`);
      skipCount++;
      continue;
    }

    const contractId = contractMap.get(`${o.payer_id}-${o.room_id}-${o.payee_id}`);
    if (!contractId) {
      console.warn(`  [跳过] id=${o.id}：无法找到对应合同`);
      skipCount++;
      continue;
    }

    const createdAt  = new Date(Number(o.created));
    const type       = o.pledge != null ? 1 : 2;
    const paidPeriod = convertPaidPeriod(o.paid_period);

    await prisma.$executeRaw`
      INSERT INTO "order" (
        "id", "contractId", "payerId", "roomId", "payeeId",
        "type", "fee", "pledge", "paidPeriod",
        "createdAt", "updatedAt"
      ) VALUES (
        ${o.id}, ${contractId}, ${o.payer_id}, ${o.room_id}, ${o.payee_id},
        ${type}, ${o.fee}, ${o.pledge}, ${paidPeriod},
        ${createdAt}, ${createdAt}
      )
      ON CONFLICT ("id") DO NOTHING
    `;

    console.log(
      `  ✓ id=${o.id}  type=${type}(${type === 1 ? '首期款' : '续期房租'})  contractId=${contractId}  period=${paidPeriod}`
    );
    successCount++;
  }

  // 重置自增序列，避免后续插入主键冲突
  await prisma.$executeRaw`
    SELECT setval(
      pg_get_serial_sequence('"order"', 'id'),
      GREATEST((SELECT COALESCE(MAX("id"), 0) FROM "order"), 1)
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
