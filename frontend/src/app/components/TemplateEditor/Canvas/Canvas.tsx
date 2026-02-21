"use client";

import { useRef, useState } from 'react';
import { Page, Block, FieldBlock, TextBlock } from '../types';
import { EditableText } from './EditableText';
import { FieldChip } from './FieldChip';
import { A4_DIMENSIONS } from '../constants';
import { useDrag, useDrop } from 'react-dnd';

interface CanvasProps {
  page: Page;
  selectedBlockId: string | null;
  onBlockSelect: (blockId: string | null) => void;
  onBlockUpdate: (blockId: string, updates: Partial<Block>) => void;
  onBlockDelete: (blockId: string) => void;
  onBlockAdd: (block: Block) => void;
}

export function Canvas({
  page,
  selectedBlockId,
  onBlockSelect,
  onBlockUpdate,
  onBlockDelete,
  onBlockAdd,
}: CanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [{ isOver }, drop] = useDrop({
    accept: 'field',
    drop: (item: { fieldType: string }, monitor) => {
      const offset = monitor.getClientOffset();
      if (offset && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = ((offset.x - rect.left) / rect.width) * page.width;
        const y = ((offset.y - rect.top) / rect.height) * page.height;
        
        // Create field at drop position
        // This will be handled by the parent component
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onBlockSelect(null);
    }
  };

  // Convert mm to pixels (assuming 96 DPI, 1mm ≈ 3.78px)
  const mmToPx = (mm: number) => mm * 3.779527559;
  const pageWidthPx = mmToPx(page.width);
  const pageHeightPx = mmToPx(page.height);

  return (
    <div className="flex justify-center items-start min-h-full py-8">
      <div
        ref={(node) => {
          canvasRef.current = node;
          drop(node);
        }}
        className="bg-white shadow-lg"
        style={{
          width: `${pageWidthPx}px`,
          height: `${pageHeightPx}px`,
          position: 'relative',
          cursor: 'text',
        }}
        onClick={handleCanvasClick}
      >
        {/* Page content area with margins */}
        <div
          className="absolute"
          style={{
            left: `${mmToPx(page.margins.left)}px`,
            top: `${mmToPx(page.margins.top)}px`,
            width: `${mmToPx(page.width - page.margins.left - page.margins.right)}px`,
            height: `${mmToPx(page.height - page.margins.top - page.margins.bottom)}px`,
          }}
        >
          {page.blocks.map((block) => {
            if (block.type === 'text') {
              return (
                <EditableText
                  key={block.id}
                  block={block}
                  isSelected={selectedBlockId === block.id}
                  onSelect={() => onBlockSelect(block.id)}
                  onUpdate={(updates) => onBlockUpdate(block.id, updates)}
                  onDelete={() => onBlockDelete(block.id)}
                />
              );
            } else if (block.type === 'field') {
              return (
                <FieldChip
                  key={block.id}
                  block={block}
                  isSelected={selectedBlockId === block.id}
                  onSelect={() => onBlockSelect(block.id)}
                  onUpdate={(updates) => onBlockUpdate(block.id, updates)}
                  onDelete={() => onBlockDelete(block.id)}
                />
              );
            }
            return null;
          })}
        </div>

        {isOver && (
          <div className="absolute inset-0 border-2 border-dashed border-blue-500 bg-blue-50 bg-opacity-20 pointer-events-none" />
        )}
      </div>
    </div>
  );
}
