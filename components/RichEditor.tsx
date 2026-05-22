'use client';

import dynamic from 'next/dynamic';

const QuillEditorInner = dynamic(() => import('./QuillEditor'), {
  ssr: false,
  loading: () => <div className="h-48 border border-gray-300 rounded skeleton-shimmer" />,
});

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  height?: number;
  error?: string;
};

export default function RichEditor({
  value,
  onChange,
  placeholder = '请输入房源描述…',
  height = 240,
  error,
}: Props) {
  return (
    <QuillEditorInner
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      height={height}
      error={error}
    />
  );
}
