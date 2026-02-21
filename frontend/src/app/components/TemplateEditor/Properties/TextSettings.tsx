"use client";

import { TextBlock } from '../types';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';

interface TextSettingsProps {
  block: TextBlock;
  onUpdate: (updates: Partial<TextBlock>) => void;
}

export function TextSettings({ block, onUpdate }: TextSettingsProps) {
  return (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Text Properties</h3>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="text-fontsize">Font Size (pt)</Label>
          <Input
            id="text-fontsize"
            type="number"
            value={block.style.fontSize}
            onChange={(e) =>
              onUpdate({ style: { ...block.style, fontSize: parseInt(e.target.value) || 12 } })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="text-fontfamily">Font Family</Label>
          <Select
            value={block.style.fontFamily}
            onValueChange={(value) =>
              onUpdate({ style: { ...block.style, fontFamily: value } })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Arial, sans-serif">Arial</SelectItem>
              <SelectItem value="Times New Roman, serif">Times New Roman</SelectItem>
              <SelectItem value="Courier New, monospace">Courier New</SelectItem>
              <SelectItem value="Helvetica, sans-serif">Helvetica</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="text-align">Text Align</Label>
          <Select
            value={block.style.textAlign}
            onValueChange={(value) =>
              onUpdate({ style: { ...block.style, textAlign: value as any } })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Left</SelectItem>
              <SelectItem value="center">Center</SelectItem>
              <SelectItem value="right">Right</SelectItem>
              <SelectItem value="justify">Justify</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="text-color">Text Color</Label>
          <Input
            id="text-color"
            type="color"
            value={block.style.color}
            onChange={(e) => onUpdate({ style: { ...block.style, color: e.target.value } })}
          />
        </div>
      </div>
    </div>
  );
}
