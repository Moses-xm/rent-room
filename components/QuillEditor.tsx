'use client';

import ReactQuill, { Quill } from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

/* ── 注册像素字号（inline style 模式，输出 style="font-size:16px"） ────────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SizeStyle = Quill.import('attributors/style/size') as any;
SizeStyle.whitelist = ['12px', '13px', '14px', '15px', '16px', '18px', '20px', '24px', '28px', '32px'];
Quill.register('attributors/style/size', SizeStyle, true);

const FONT_SIZE_LABELS: Record<string, string> = {
  '12px': '12', '13px': '13', '14px': '14', '15px': '15', '16px': '16',
  '18px': '18', '20px': '20', '24px': '24', '28px': '28', '32px': '32',
};

const TOOLBAR = [
  [{ size: Object.keys(FONT_SIZE_LABELS) }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ color: [] }, { background: [] }],
  [{ align: [] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['blockquote', 'link'],
  ['clean'],
];

const MODULES = { toolbar: TOOLBAR };

const FORMATS = [
  'size', 'bold', 'italic', 'underline', 'strike',
  'color', 'background', 'align',
  'list', 'blockquote', 'link',
];

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder: string;
  height: number;
  error?: string;
};

export default function QuillEditorInner({ value, onChange, placeholder, height, error }: Props) {
  return (
    <div
      className={`rich-editor-wrap ${error ? 'rich-editor-error' : ''}`}
      style={{ '--editor-height': `${height}px` } as React.CSSProperties}
    >
      <ReactQuill
        theme="snow"
        value={value}
        onChange={(v) => onChange(v === '<p><br></p>' ? '' : v)}
        placeholder={placeholder}
        modules={MODULES}
        formats={FORMATS}
      />
    </div>
  );
}
