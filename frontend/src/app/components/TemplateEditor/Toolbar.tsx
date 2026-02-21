"use client";

import { Button } from '../ui/button';
import { VisualTemplate } from './types';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Undo, Redo, Save, X } from 'lucide-react';

interface ToolbarProps {
  template: VisualTemplate;
  onUpdate: (template: VisualTemplate) => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onCancel: () => void;
}

export function Toolbar({ onUndo, onRedo, onSave, onCancel }: ToolbarProps) {
  return (
    <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        {/* Formatting Tools */}
        <div className="flex items-center gap-1 border-r border-gray-200 pr-2 mr-2">
          <Button variant="ghost" size="sm" title="Bold">
            <Bold className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" title="Italic">
            <Italic className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" title="Underline">
            <Underline className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1 border-r border-gray-200 pr-2 mr-2">
          <Button variant="ghost" size="sm" title="Align Left">
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" title="Align Center">
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" title="Align Right">
            <AlignRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1 border-r border-gray-200 pr-2 mr-2">
          <Button variant="ghost" size="sm" onClick={onUndo} title="Undo">
            <Undo className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onRedo} title="Redo">
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button onClick={onSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Template
        </Button>
      </div>
    </div>
  );
}
