type OrderRecord = {
  id: number;
  contractId: number;
  payerId: number;
  roomId: number;
  payeeId: number;
  type: number;
  fee: number | null;
  pledge: number | null;
  paidPeriod: string | null;
  createdAt: Date;
  updatedAt: Date;
  payer?: { id: number; username: string; nickname: string | null } | null;
  payee?: { id: number; username: string; nickname: string | null } | null;
  room?: { id: number; name: string; roomCode: string } | null;
  contract?: { id: number; onlineTime: Date; offlineTime: Date } | null;
};

export function serializeOrder(o: OrderRecord) {
  return {
    id: o.id,
    contractId: o.contractId,
    payerId: o.payerId,
    roomId: o.roomId,
    payeeId: o.payeeId,
    type: o.type,
    fee: o.fee,
    pledge: o.pledge,
    paidPeriod: o.paidPeriod,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
    payer: o.payer ?? null,
    payee: o.payee ?? null,
    room: o.room ?? null,
    contract: o.contract
      ? {
          id: o.contract.id,
          onlineTime: o.contract.onlineTime.toISOString(),
          offlineTime: o.contract.offlineTime.toISOString(),
        }
      : null,
  };
}
