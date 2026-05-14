type CollectionRecord = {
  id: number;
  userId: number;
  roomId: number;
  createdAt: Date;
  updatedAt: Date;
  user?: { id: number; username: string; nickname: string | null } | null;
  room?: { id: number; name: string; roomCode: string } | null;
};

export function serializeCollection(c: CollectionRecord) {
  return {
    id: c.id,
    userId: c.userId,
    roomId: c.roomId,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    user: c.user
      ? { id: c.user.id, username: c.user.username, nickname: c.user.nickname }
      : null,
    room: c.room
      ? { id: c.room.id, name: c.room.name, roomCode: c.room.roomCode }
      : null,
  };
}
