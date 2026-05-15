type ContractRecord = {
  id: number;
  userId: number;
  roomId: number;
  landlordId: number;
  tenancy: number;
  onlineTime: Date;
  offlineTime: Date;
  pledge: number;
  fee: number;
  paidPeriod: string;
  payingPeriod: string;
  renewTimes: number;
  renewMonths: number;
  status: number;
  isCheckout: boolean;
  checkoutTime: Date | null;
  refund: boolean | null;
  landlordDeleted: boolean;
  userDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: { id: number; username: string; nickname: string | null; avatar: string | null } | null;
  room?: { id: number; name: string; roomCode: string; cover: string; price: number; pledge: number; pay: number; minTenancy: number } | null;
  landlord?: { id: number; username: string; nickname: string | null; avatar: string | null } | null;
};

export function serializeContract(c: ContractRecord) {
  return {
    id: c.id,
    userId: c.userId,
    roomId: c.roomId,
    landlordId: c.landlordId,
    tenancy: c.tenancy,
    onlineTime: c.onlineTime.toISOString(),
    offlineTime: c.offlineTime.toISOString(),
    pledge: c.pledge,
    fee: c.fee,
    paidPeriod: c.paidPeriod,
    payingPeriod: c.payingPeriod,
    renewTimes: c.renewTimes,
    renewMonths: c.renewMonths,
    status: c.status,
    isCheckout: c.isCheckout,
    checkoutTime: c.checkoutTime?.toISOString() ?? null,
    refund: c.refund,
    landlordDeleted: c.landlordDeleted,
    userDeleted: c.userDeleted,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    user: c.user ?? null,
    room: c.room ?? null,
    landlord: c.landlord ?? null,
  };
}

// 根据开始时间、结束时间、每期付月数生成所有期限数组
export function generatePeriods(
  onlineTime: Date,
  offlineTime: Date,
  payMonths: number,
): { start: string; end: string }[] {
  const periods: { start: string; end: string }[] = [];
  let current = new Date(onlineTime);
  while (current < offlineTime) {
    const end = addMonths(current, payMonths);
    periods.push({ start: current.toISOString(), end: end.toISOString() });
    current = end;
  }
  return periods;
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}
