type AdminRecord = {
  id: number;
  username: string;
  password: string;
  avatar: string | null;
  isActive: boolean;
  modified: Date | null;
  created: Date | null;
};

export function serializeAdmin(admin: AdminRecord) {
  return {
    id: admin.id,
    username: admin.username,
    avatar: admin.avatar,
    isActive: admin.isActive,
    modified: admin.modified,
    created: admin.created,
  };
}
