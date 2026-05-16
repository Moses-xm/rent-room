type WalletRecordRecord = {
  id: number;
  userId: number;
  amount: number;
  type: number;
  remark: string | null;
  orderId: number | null;
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
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}
