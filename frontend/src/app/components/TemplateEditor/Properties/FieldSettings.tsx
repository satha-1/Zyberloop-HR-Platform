"use client";

import { useState } from 'react';
import { FieldBlock } from '../types';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Switch } from '../../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { DataSourceSelector } from './DataSourceSelector';
import { VARIABLE_GROUPS } from '../constants';

interface FieldSettingsProps {
  block: FieldBlock;
  onUpdate: (updates: Partial<FieldBlock>) => void;
}

export function FieldSettings({ block, onUpdate }: FieldSettingsProps) {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Field Properties</h3>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="data">Data Source</TabsTrigger>
          <TabsTrigger value="style">Style</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="field-label">Display Label *</Label>
            <Input
              id="field-label"
              value={block.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="field-key">Field Key</Label>
            <Input
              id="field-key"
              value={block.fieldKey}
              onChange={(e) => onUpdate({ fieldKey: e.target.value })}
              disabled
              className="bg-gray-50"
            />
            <p className="text-xs text-gray-500">Auto-generated unique identifier</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="field-type">Field Type</Label>
            <Select
              value={block.fieldType}
              onValueChange={(value) => onUpdate({ fieldType: value as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="paragraph">Paragraph</SelectItem>
                <SelectItem value="checkbox">Checkbox</SelectItem>
                <SelectItem value="dropdown">Dropdown</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="signature">Signature</SelectItem>
                <SelectItem value="initials">Initials</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="field-required">Required</Label>
            <Switch
              id="field-required"
              checked={block.settings.required}
              onCheckedChange={(checked) =>
                onUpdate({ settings: { ...block.settings, required: checked } })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="field-tooltip">Tooltip / Help Text</Label>
            <Textarea
              id="field-tooltip"
              value={block.settings.tooltip || ''}
              onChange={(e) =>
                onUpdate({ settings: { ...block.settings, tooltip: e.target.value } })
              }
              rows={2}
            />
          </div>

          {/* Type-specific settings */}
          {block.fieldType === 'text' || block.fieldType === 'paragraph' ? (
            <div className="space-y-2">
              <Label htmlFor="field-maxlength">Max Length</Label>
              <Input
                id="field-maxlength"
                type="number"
                value={block.settings.maxLength || ''}
                onChange={(e) =>
                  onUpdate({
                    settings: { ...block.settings, maxLength: parseInt(e.target.value) || undefined },
                  })
                }
              />
            </div>
          ) : null}

          {block.fieldType === 'number' ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="field-min">Min Value</Label>
                  <Input
                    id="field-min"
                    type="number"
                    value={block.settings.min || ''}
                    onChange={(e) =>
                      onUpdate({
                        settings: { ...block.settings, min: parseFloat(e.target.value) || undefined },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="field-max">Max Value</Label>
                  <Input
                    id="field-max"
                    type="number"
                    value={block.settings.max || ''}
                    onChange={(e) =>
                      onUpdate({
                        settings: { ...block.settings, max: parseFloat(e.target.value) || undefined },
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="field-format">Format</Label>
                <Select
                  value={block.settings.format || 'number'}
                  onValueChange={(value) =>
                    onUpdate({ settings: { ...block.settings, format: value as any } })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="currency">Currency</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : null}

          {block.fieldType === 'date' ? (
            <div className="space-y-2">
              <Label htmlFor="field-dateformat">Date Format</Label>
              <Select
                value={block.settings.dateFormat || 'DD MMM YYYY'}
                onValueChange={(value) =>
                  onUpdate({ settings: { ...block.settings, dateFormat: value } })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD MMM YYYY">DD MMM YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {block.fieldType === 'signature' || block.fieldType === 'initials' ? (
            <div className="space-y-2">
              <Label htmlFor="field-signer">Signer</Label>
              <Select
                value={block.settings.signer || 'employee'}
                onValueChange={(value) =>
                  onUpdate({ settings: { ...block.settings, signer: value as any } })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="data" className="mt-4">
          <DataSourceSelector
            block={block}
            onUpdate={(dataSource) => onUpdate({ dataSource })}
          />
        </TabsContent>

        <TabsContent value="style" className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="field-fontsize">Font Size (pt)</Label>
            <Input
              id="field-fontsize"
              type="number"
              value={block.style.fontSize || 12}
              onChange={(e) =>
                onUpdate({ style: { ...block.style, fontSize: parseInt(e.target.value) || 12 } })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="field-color">Text Color</Label>
            <Input
              id="field-color"
              type="color"
              value={block.style.color || '#0066cc'}
              onChange={(e) => onUpdate({ style: { ...block.style, color: e.target.value } })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="field-bgcolor">Background Color</Label>
            <Input
              id="field-bgcolor"
              type="color"
              value={block.style.backgroundColor || '#f0f8ff'}
              onChange={(e) =>
                onUpdate({ style: { ...block.style, backgroundColor: e.target.value } })
              }
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
