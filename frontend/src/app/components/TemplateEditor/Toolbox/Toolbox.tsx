"use client";

import { useState } from 'react';
import { FieldType, Block, FieldBlock, Page } from '../types';
import { FieldButton } from './FieldButton';
import { VariablesPanel } from './VariablesPanel';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { FIELD_TYPE_CONFIG, DEFAULT_FIELD_STYLE, DEFAULT_TEXT_STYLE } from '../constants';
import { Type, AlignLeft, Square, ChevronDown, Calendar, Hash, Image, PenTool, FileSignature, Database } from 'lucide-react';

interface ToolboxProps {
  onFieldAdd: (block: Block) => void;
  currentPage: Page;
}

export function Toolbox({ onFieldAdd, currentPage }: ToolboxProps) {
  const [showVariables, setShowVariables] = useState(false);

  const handleFieldDrag = (fieldType: FieldType) => {
    const fieldId = `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fieldKey = `field_${fieldType}_${Date.now()}`;

    const newField: FieldBlock = {
      id: fieldId,
      type: 'field',
      fieldKey,
      fieldType,
      position: {
        x: 20, // Default position
        y: 50,
        width: 100,
        height: 30,
      },
      label: FIELD_TYPE_CONFIG[fieldType].label,
      dataSource: {
        type: 'manual',
      },
      settings: {
        required: false,
      },
      style: DEFAULT_FIELD_STYLE,
    };

    onFieldAdd(newField);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Fields</h3>
        <p className="text-xs text-gray-500 mt-1">Drag fields onto the page</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <FieldButton
          icon={Type}
          label="Text"
          description="Single-line text"
          onClick={() => handleFieldDrag('text')}
        />
        <FieldButton
          icon={AlignLeft}
          label="Paragraph"
          description="Multi-line text"
          onClick={() => handleFieldDrag('paragraph')}
        />
        <FieldButton
          icon={Square}
          label="Checkbox"
          description="Checkbox option"
          onClick={() => handleFieldDrag('checkbox')}
        />
        <FieldButton
          icon={ChevronDown}
          label="Dropdown"
          description="Select from options"
          onClick={() => handleFieldDrag('dropdown')}
        />
        <FieldButton
          icon={Calendar}
          label="Date"
          description="Date picker"
          onClick={() => handleFieldDrag('date')}
        />
        <FieldButton
          icon={Hash}
          label="Number"
          description="Numeric input"
          onClick={() => handleFieldDrag('number')}
        />
        <FieldButton
          icon={Image}
          label="Image"
          description="Image placeholder"
          onClick={() => handleFieldDrag('image')}
        />
        <FieldButton
          icon={PenTool}
          label="Signature"
          description="Signature field"
          onClick={() => handleFieldDrag('signature')}
        />
        <FieldButton
          icon={FileSignature}
          label="Initials"
          description="Initials field"
          onClick={() => handleFieldDrag('initials')}
        />
      </div>

      <div className="border-t border-gray-200 p-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowVariables(!showVariables)}
        >
          <Database className="h-4 w-4 mr-2" />
          Variables
        </Button>
      </div>

      {showVariables && (
        <div className="border-t border-gray-200">
          <VariablesPanel
            onVariableInsert={(variable) => {
              // Insert variable as text block or field
              const textId = `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              onFieldAdd({
                id: textId,
                type: 'text',
                content: `{{${variable.key}}}`,
                position: { x: 20, y: 50 },
                style: DEFAULT_TEXT_STYLE,
              });
            }}
          />
        </div>
      )}
    </div>
  );
}
