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
              className={`h-3 rounded-full bg-border animate-pulse ${
                idx === 0
                  ? 'w-24'
                  : idx === columns - 1
                    ? 'ml-auto w-16'
                    : 'w-16'
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
                    <div className="h-7.5 w-7.5 rounded-full bg-surface-2 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-28 rounded-full bg-surface-2 animate-pulse" />
                      <div className="h-2.5 w-16 rounded-full bg-border animate-pulse" />
                    </div>
                  </div>
                ) : colIdx === columns - 1 ? (
                  <div key={colIdx} className="flex items-center justify-end gap-1.5">
                    <div className="h-7.5 w-7.5 rounded-sm bg-surface-2 animate-pulse" />
                    <div className="h-7.5 w-7.5 rounded-sm bg-surface-2 animate-pulse" />
                  </div>
                ) : colIdx === 1 ? (
                  <div key={colIdx} className="flex items-center">
                    <div className="h-5 w-14 rounded-full bg-surface-2 animate-pulse" />
                  </div>
                ) : (
                  <div key={colIdx} className="flex items-center">
                    <div
                      className={`h-3 rounded-full bg-surface-2 animate-pulse ${
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
