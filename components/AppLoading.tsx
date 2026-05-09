'use client';

type AppLoadingProps = {
  rows?: number;
  columns?: number;
};

export default function AppLoading({
  rows = 4,
  columns = 5,
}: AppLoadingProps) {
  const skeletonRows = Array.from({ length: rows });
  const skeletonCols = Array.from({ length: columns });

  return (
    <div className="w-full bg-card border border-border rounded shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <div
          className="grid gap-x-4 border-b border-border-subtle bg-surface-2 px-4 py-2.5"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {skeletonCols.map((_, idx) => (
            <div
              key={idx}
              className={`h-2.5 rounded-full skeleton-shimmer ${
                idx === 0
                  ? 'w-20'
                  : idx === columns - 1
                    ? 'ml-auto w-14'
                    : 'w-14'
              }`}
            />
          ))}
        </div>

        <div className="divide-y divide-border-subtle">
          {skeletonRows.map((_, rowIdx) => (
            <div
              key={rowIdx}
              className="grid items-center gap-x-4 px-4 py-3.5"
              style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
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
