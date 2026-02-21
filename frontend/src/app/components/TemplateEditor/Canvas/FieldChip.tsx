"use client";

import { useState } from 'react';
import { FieldBlock } from '../types';
import { Rnd } from 'react-rnd';
import { X } from 'lucide-react';
import { Button } from '../../ui/button';
import { mmToPx } from '../utils/helpers';

interface FieldChipProps {
  block: FieldBlock;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<FieldBlock>) => void;
  onDelete: () => void;
}

export function FieldChip({ block, isSelected, onSelect, onUpdate, onDelete }: FieldChipProps) {
  const [isHovered, setIsHovered] = useState(false);

  const x = mmToPx(block.position.x);
  const y = mmToPx(block.position.y);
  const width = mmToPx(block.position.width);
  const height = mmToPx(block.position.height);

  return (
    <Rnd
      size={{ width, height }}
      position={{ x, y }}
      onDragStop={(e, d) => {
        onUpdate({
          position: {
            x: (d.x / 3.779527559),
            y: (d.y / 3.779527559),
            width: block.position.width,
            height: block.position.height,
          },
        });
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        onUpdate({
          position: {
            x: (position.x / 3.779527559),
            y: (position.y / 3.779527559),
            width: (parseInt(ref.style.width) / 3.779527559),
            height: (parseInt(ref.style.height) / 3.779527559),
          },
        });
      }}
      bounds="parent"
      className={`
        ${isSelected ? 'ring-2 ring-blue-500' : ''}
        ${isHovered ? 'ring-1 ring-gray-300' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <div
        className="w-full h-full flex items-center justify-center relative"
        style={{
          fontSize: `${block.style.fontSize || 12}pt`,
          fontFamily: block.style.fontFamily || 'Arial',
          color: block.style.color || '#0066cc',
          backgroundColor: block.style.backgroundColor || '#f0f8ff',
          border: `${block.style.border?.width || 1}px ${block.style.border?.style || 'dashed'} ${block.style.border?.color || '#0066cc'}`,
          padding: `${block.style.padding?.top || 4}px ${block.style.padding?.right || 8}px ${block.style.padding?.bottom || 4}px ${block.style.padding?.left || 8}px`,
          cursor: 'move',
        }}
      >
        <span className="text-sm font-medium">[{block.label}]</span>
        {isSelected && (
          <Button
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </Rnd>
  );
}
