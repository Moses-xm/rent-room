type AppointmentRecord = {
  id: number;
  userId: number;
  roomId: number;
  landlordId: number;
  appointmentTime: Date;
  status: number;
  cancelledBy: number | null;
  completedBy: number | null;
  remark: string | null;
  userDeleted: boolean;
  landlordDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: { id: number; username: string; nickname: string | null } | null;
  room?: { id: number; name: string; roomCode: string } | null;
  landlord?: { id: number; username: string; nickname: string | null } | null;
};

export function serializeAppointment(a: AppointmentRecord) {
  return {
    id: a.id,
    userId: a.userId,
    roomId: a.roomId,
    landlordId: a.landlordId,
    appointmentTime: a.appointmentTime.toISOString(),
    status: a.status,
    cancelledBy: a.cancelledBy,
    completedBy: a.completedBy,
    remark: a.remark,
    userDeleted: a.userDeleted,
    landlordDeleted: a.landlordDeleted,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
    user: a.user ?? null,
    room: a.room ?? null,
    landlord: a.landlord ?? null,
  };
}
