import { prisma } from "@/lib/prisma";
import { resolveUploadedFileUrl } from "@/lib/upload-path";
import { PortalShell } from "@/components/portal/PortalShell";
import { HomeCard } from "@/components/portal/HomeCard";
import { HeroCarousel } from "@/components/portal/HeroCarousel";

const communitySelect = {
  id: true,
  district: true,
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center h-10 mb-4">
      <span className="w-0.75 h-4.5 bg-primary shrink-0" />
      <span className="pl-3 text-lg font-semibold text-text">{children}</span>
    </div>
  );
}

export default async function PortalHomePage() {
  const [carousels, latestRooms, communities, hotRooms] = await Promise.all([
    prisma.carousel.findMany({
      where: { published: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.room.findMany({
      where: { isPublished: 2 },
      take: 4,
      orderBy: { createdAt: "desc" },
      include: { community: { select: communitySelect } },
    }),
    prisma.community.findMany({
      take: 4,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { rooms: { where: { isPublished: 2 } } } },
      },
    }),
    prisma.room.findMany({
      where: { isPublished: 2 },
      take: 4,
      orderBy: { views: "desc" },
      include: { community: { select: communitySelect } },
    }),
  ]);

  const carouselItems = carousels.map((c) => ({
    id: c.id,
    imageUrl: resolveUploadedFileUrl(c.image),
    path: c.path,
  }));

  return (
    <PortalShell>
      <div className="max-w-295 mx-auto px-4">

        {/* Hero 轮播图 */}
        <HeroCarousel items={carouselItems} />

        {/* 最新上架 */}
        <section className="mt-7 mb-2">
          <SectionTitle>最新上架</SectionTitle>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
            {latestRooms.map((r) => (
              <HomeCard
                key={r.id}
                href={`/portal/room/${r.id}`}
                name={r.name}
                imageUrl={resolveUploadedFileUrl(r.cover)}
                leftText={`${r.community?.district ?? ""}·${r.bedroom}室${r.parlour}厅`}
                rightText={`¥${r.price}/月`}
              />
            ))}
          </div>
        </section>

        {/* 小区精选 */}
        <section className="mt-7 mb-2">
          <SectionTitle>小区精选</SectionTitle>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
            {communities.map((c) => (
              <HomeCard
                key={c.id}
                href={`/portal/cmyRoom/${c.id}`}
                name={c.name}
                imageUrl={resolveUploadedFileUrl(c.cover)}
                leftText={c.district}
                rightText={`${c._count.rooms}套房源`}
              />
            ))}
          </div>
        </section>

        {/* 热门推荐 */}
        <section className="mt-7 mb-10">
          <SectionTitle>热门推荐</SectionTitle>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
            {hotRooms.map((r) => (
              <HomeCard
                key={r.id}
                href={`/portal/room/${r.id}`}
                name={r.name}
                imageUrl={resolveUploadedFileUrl(r.cover)}
                leftText={`${r.community?.district ?? ""}·${r.bedroom}室${r.parlour}厅`}
                rightText={`¥${r.price}/月`}
              />
            ))}
          </div>
        </section>

      </div>
    </PortalShell>
  );
}
