import type { carousel } from '@prisma/client';

export function serializeCarousel(item: carousel) {
  return {
    ...item,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}
