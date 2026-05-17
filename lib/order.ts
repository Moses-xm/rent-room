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
  payerDeleted: boolean;
  payeeDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  payer?: { id: number; username: string; nickname: string | null; avatar: string | null } | null;
  payee?: { id: number; username: string; nickname: string | null; avatar: string | null } | null;
  room?: { id: number; name: string; roomCode: string; cover: string } | null;
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
    payerDeleted: o.payerDeleted,
    payeeDeleted: o.payeeDeleted,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
    payer: o.payer ? { id: o.payer.id, username: o.payer.username, nickname: o.payer.nickname, avatar: o.payer.avatar } : null,
    payee: o.payee ? { id: o.payee.id, username: o.payee.username, nickname: o.payee.nickname, avatar: o.payee.avatar } : null,
    room: o.room ? { id: o.room.id, name: o.room.name, roomCode: o.room.roomCode, cover: o.room.cover } : null,
    contract: o.contract
      ? {
          id: o.contract.id,
          onlineTime: o.contract.onlineTime.toISOString(),
          offlineTime: o.contract.offlineTime.toISOString(),
        }
      : null,
  };
}
