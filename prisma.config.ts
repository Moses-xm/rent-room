import { defineConfig } from '@prisma/config';
import 'dotenv/config';

export default defineConfig({
  // 获取 .env 文件中的连接字符串用于数据库的拉取与迁移
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
