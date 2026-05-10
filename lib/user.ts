type UserRecord = {
  id: number;
  username: string;
  password: string;
  phone: string | null;
  nickname: string | null;
  realname: string | null;
  gender: number;
  identity: number;
  isActive: boolean;
  avatar: string | null;
  email: string | null;
  province: string | null;
  city: string | null;
  district: string | null;
  address: string | null;
  wallet: number;
  payCode: string;
  createdAt: Date;
  updatedAt: Date;
};

export function serializeUser(user: UserRecord) {
  return {
    id: user.id,
    username: user.username,
    phone: user.phone,
    nickname: user.nickname,
    realname: user.realname,
    gender: user.gender,
    identity: user.identity,
    isActive: user.isActive,
    avatar: user.avatar,
    email: user.email,
    province: user.province,
    city: user.city,
    district: user.district,
    address: user.address,
    wallet: user.wallet,
    payCode: user.payCode,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
