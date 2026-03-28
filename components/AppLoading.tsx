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
    <div className="w-full">
      <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <div
            className="grid gap-x-4 border-b border-slate-100 bg-slate-50/70 px-5 py-4"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {skeletonCols.map((_, idx) => (
              <div
                key={idx}
                className={`h-3 rounded-full bg-slate-200/80 animate-pulse ${
                  idx === 0
                    ? 'w-24'
                    : idx === columns - 1
                      ? 'ml-auto w-16'
                      : 'w-16'
                }`}
              />
            ))}
          </div>

          <div className="divide-y divide-slate-100">
            {skeletonRows.map((_, rowIdx) => (
              <div
                key={rowIdx}
                className="grid items-center gap-x-4 px-5 py-4"
                style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
              >
                {skeletonCols.map((_, colIdx) =>
                  colIdx === 0 ? (
                    <div key={colIdx} className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-slate-200 animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 w-28 rounded-full bg-slate-200 animate-pulse" />
                        <div className="h-3 w-16 rounded-full bg-slate-100 animate-pulse" />
                      </div>
                    </div>
                  ) : colIdx === columns - 1 ? (
                    <div key={colIdx} className="flex items-center justify-end gap-2">
                      <div className="h-8 w-8 rounded-lg bg-slate-200 animate-pulse" />
                      <div className="h-8 w-8 rounded-lg bg-slate-100 animate-pulse" />
                    </div>
                  ) : colIdx === 1 ? (
                    <div key={colIdx} className="flex items-center">
                      <div className="h-6 w-[4.5rem] rounded-full bg-slate-200 animate-pulse" />
                    </div>
                  ) : (
                    <div key={colIdx} className="flex items-center">
                      <div
                        className={`h-3.5 rounded-full bg-slate-200 animate-pulse ${
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
    </div>
  );
}
