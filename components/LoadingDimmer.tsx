'use client';

type LoadingDimmerProps = {
  loading: boolean;
  children: React.ReactNode;
};

export default function LoadingDimmer({
  loading,
  children,
}: LoadingDimmerProps) {
  return (
    <div
      className={`transition-opacity duration-200 ${
        loading ? 'opacity-45 pointer-events-none' : 'opacity-100'
      }`}
    >
      {children}
    </div>
  );
}
