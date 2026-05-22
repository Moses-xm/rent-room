'use client';

import { useRef } from 'react';
import ReactQuill, { Quill } from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import {
  RICH_EDITOR_FONT_SIZE_LABELS,
  RICH_EDITOR_DEFAULT_SIZE,
  RICH_EDITOR_MODULES,
  RICH_EDITOR_FORMATS,
} from '@/utils/constants';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SizeStyle = Quill.import('attributors/style/size') as any;
SizeStyle.whitelist = Object.keys(RICH_EDITOR_FONT_SIZE_LABELS);
Quill.register('attributors/style/size', SizeStyle, true);

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder: string;
  height: number;
  error?: string;
};

export default function QuillEditorInner({ value, onChange, placeholder, height, error }: Props) {
  const quillRef = useRef<ReactQuill>(null);

  const applyPickerSize = (size: string | undefined) => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;
    const toolbar = quill.getModule('toolbar') as { container: HTMLElement } | null;
    const picker = toolbar?.container?.querySelector<HTMLElement>('.ql-size');
    if (!picker) return;

    // 未显式设置字号时回落到编辑器默认值（CSS .ql-container font-size: 14px）
    const effective = size ?? RICH_EDITOR_DEFAULT_SIZE;
    const label = picker.querySelector<HTMLElement>('.ql-picker-label');
    if (label) {
      label.dataset.value = effective;
      label.style.setProperty('--ql-size-label', `"${RICH_EDITOR_FONT_SIZE_LABELS[effective] ?? effective}"`);
    }
    picker.querySelectorAll<HTMLElement>('.ql-picker-item').forEach((item) => {
      item.classList.toggle('ql-selected', item.dataset.value === effective);
    });
  };

  // 光标移动时同步字号 picker 显示
  const handleSelectionChange = (range: { index: number; length: number } | null) => {
    const quill = quillRef.current?.getEditor();
    if (!quill || !range) return;
    const size = quill.getFormat(range).size as string | undefined;
    applyPickerSize(size);
  };

  // 文本变化时：回车后重置光标字号格式，避免继承上一行
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChange = (html: string, delta: any, source: any) => {
    onChange(html === '<p><br></p>' ? '' : html);
    if (source !== 'user') return;

    const hasNewline = delta.ops?.some(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (op: any) => typeof op.insert === 'string' && op.insert.includes('\n'),
    );
    if (!hasNewline) return;

    const quill = quillRef.current?.getEditor();
    if (!quill || !quill.getSelection()) return;
    // 'silent' 不触发 text-change，不会递归
    quill.format('size', false, 'silent');
    applyPickerSize(undefined);
  };

  return (
    <div
      className={`rich-editor-wrap ${error ? 'rich-editor-error' : ''}`}
      style={{ '--editor-height': `${height}px` } as React.CSSProperties}
    >
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={handleChange}
        onChangeSelection={handleSelectionChange}
        placeholder={placeholder}
        modules={RICH_EDITOR_MODULES}
        formats={RICH_EDITOR_FORMATS}
      />
    </div>
  );
}
