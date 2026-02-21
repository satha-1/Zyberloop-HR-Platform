"use client";

import { Block, FieldBlock, TextBlock } from '../types';
import { FieldSettings } from './FieldSettings';
import { TextSettings } from './TextSettings';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';

interface PropertiesPanelProps {
  block: Block;
  onUpdate: (updates: Partial<Block>) => void;
}

export function PropertiesPanel({ block, onUpdate }: PropertiesPanelProps) {
  if (block.type === 'field') {
    return <FieldSettings block={block} onUpdate={onUpdate} />;
  } else if (block.type === 'text') {
    return <TextSettings block={block} onUpdate={onUpdate} />;
  }

  return null;
}
