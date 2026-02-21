"use client";

import { useState, useRef, useEffect } from 'react';
import { TextBlock } from '../types';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { mmToPx } from '../utils/helpers';

interface EditableTextProps {
  block: TextBlock;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<TextBlock>) => void;
  onDelete: () => void;
}

export function EditableText({ block, isSelected, onSelect, onUpdate }: EditableTextProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Type here...',
      }),
    ],
    content: block.content,
    onUpdate: ({ editor }) => {
      onUpdate({ content: editor.getHTML() });
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm focus:outline-none min-h-[20px]',
      style: `
        font-size: ${block.style.fontSize}pt;
        font-family: ${block.style.fontFamily};
        font-weight: ${block.style.fontWeight};
        font-style: ${block.style.fontStyle};
        text-decoration: ${block.style.textDecoration};
        text-align: ${block.style.textAlign};
        color: ${block.style.color};
        line-height: ${block.style.lineHeight};
      `,
      },
    },
  });

  useEffect(() => {
    if (editor && editor.getHTML() !== block.content) {
      editor.commands.setContent(block.content);
    }
  }, [block.content, editor]);

  const x = mmToPx(block.position.x);
  const y = mmToPx(block.position.y);

  return (
    <div
      className={`absolute ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        minWidth: '100px',
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <EditorContent editor={editor} />
    </div>
  );
}
