type AdminRecord = {
  id: number;
  username: string;
  password: string;
  avatar: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export function serializeAdmin(admin: AdminRecord) {
  return {
    id: admin.id,
    username: admin.username,
    avatar: admin.avatar,
    isActive: admin.isActive,
    createdAt: admin.createdAt.toISOString(),
    updatedAt: admin.updatedAt.toISOString(),
  };
}
