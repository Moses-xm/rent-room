type NotificationRecord = {
  id: number;
  userId: number;
  type: number;
  title: string;
  content: string;
  relatedType: string | null;
  relatedId: number | null;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: { id: number; username: string; nickname: string | null; avatar: string | null } | null;
};

export function serializeNotification(n: NotificationRecord) {
  return {
    id: n.id,
    userId: n.userId,
    type: n.type,
    title: n.title,
    content: n.content,
    relatedType: n.relatedType,
    relatedId: n.relatedId,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
    user: n.user ?? null,
  };
}
