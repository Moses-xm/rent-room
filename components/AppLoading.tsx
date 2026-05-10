'use client';

type AppLoadingProps = {
  rows?: number;
  columns?: number;
  actionCount?: number;
  variant?: 'auto' | 'table' | 'card';
};

function buildGridTemplate(columns: number): string {
  if (columns <= 1) return '1fr';
  const middle = Array(Math.max(0, columns - 2)).fill('1fr');
  return ['2fr', ...middle, '80px'].join(' ');
}

function TableSkeleton({ rows, columns }: { rows: number; columns: number }) {
  const skeletonRows = Array.from({ length: rows });
  const skeletonCols = Array.from({ length: columns });
  const gridTemplate = buildGridTemplate(columns);

  return (
    <div className="w-full bg-card border border-border rounded shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <div
          className="grid gap-x-6 border-b border-border-subtle bg-surface-2 px-4 py-2.5"
          style={{ gridTemplateColumns: gridTemplate }}
        >
          {skeletonCols.map((_, idx) => (
            <div
              key={idx}
              className={`h-2.5 rounded-full skeleton-shimmer ${
                idx === 0
                  ? 'w-20'
                  : idx === columns - 1
                    ? 'ml-auto w-10'
                    : 'w-14'
              }`}
            />
          ))}
        </div>

        <div className="divide-y divide-border-subtle">
          {skeletonRows.map((_, rowIdx) => (
            <div
              key={rowIdx}
              className="grid items-center gap-x-6 px-4 py-3.5"
              style={{ gridTemplateColumns: gridTemplate }}
            >
              {skeletonCols.map((_, colIdx) =>
                colIdx === 0 ? (
                  <div key={colIdx} className="flex items-center gap-3">
                    <div className="h-7.5 w-7.5 rounded-full skeleton-shimmer-warm shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-28 rounded-full skeleton-shimmer" />
                      <div className="h-2 w-16 rounded-full skeleton-shimmer opacity-60" />
                    </div>
                  </div>
                ) : colIdx === columns - 1 ? (
                  <div key={colIdx} className="flex items-center justify-end gap-1.5">
                    <div className="h-7.5 w-7.5 rounded-sm skeleton-shimmer" />
                    <div className="h-7.5 w-7.5 rounded-sm skeleton-shimmer" />
                  </div>
                ) : colIdx === 1 ? (
                  <div key={colIdx} className="flex items-center">
                    <div className="h-5 w-14 rounded-full skeleton-shimmer" />
                  </div>
                ) : (
                  <div key={colIdx} className="flex items-center">
                    <div
                      className={`h-3 rounded-full skeleton-shimmer ${
                        colIdx % 2 === 0 ? 'w-24' : 'w-20'
                      }`}
                    />
                  </div>
                ),
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CardSkeleton({ rows, actionCount }: { rows: number; actionCount: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="bg-card border border-border rounded shadow-sm p-4 flex items-center gap-3"
        >
          <div className="w-9.5 h-9.5 rounded-full skeleton-shimmer-warm shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-3.5 w-24 rounded-full skeleton-shimmer" />
              <div className="h-5 w-12 rounded-full skeleton-shimmer opacity-70" />
            </div>
            <div className="h-2.5 w-36 rounded-full skeleton-shimmer opacity-50" />
            <div className="h-2.5 w-28 rounded-full skeleton-shimmer opacity-40" />
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {Array.from({ length: actionCount }).map((_, j) => (
              <div key={j} className="h-8 w-8 rounded-sm skeleton-shimmer" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AppLoading({
  rows = 4,
  columns = 5,
  actionCount = 2,
  variant = 'auto',
}: AppLoadingProps) {
  if (variant === 'table') {
    return <TableSkeleton rows={rows} columns={columns} />;
  }
  if (variant === 'card') {
    return <CardSkeleton rows={rows} actionCount={actionCount} />;
  }
  return (
    <>
      <div className="hidden md:block">
        <TableSkeleton rows={rows} columns={columns} />
      </div>
      <div className="md:hidden">
        <CardSkeleton rows={rows} actionCount={actionCount} />
      </div>
    </>
  );
}
