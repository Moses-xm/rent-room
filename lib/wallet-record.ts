type WalletRecordRecord = {
  id: number;
  userId: number;
  amount: number;
  type: number;
  remark: string | null;
  orderId: number | null;
  balanceAfter: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export function serializeWalletRecord(r: WalletRecordRecord) {
  return {
    id: r.id,
    userId: r.userId,
    amount: r.amount,
    type: r.type,
    remark: r.remark,
    orderId: r.orderId,
    balanceAfter: r.balanceAfter,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}
