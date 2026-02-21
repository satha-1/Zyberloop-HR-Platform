"use client";

import { useState } from 'react';
import { FieldBlock, DataSource } from '../types';
import { Label } from '../../ui/label';
import { RadioGroup, RadioGroupItem } from '../../ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { VARIABLE_GROUPS } from '../constants';
import { Input } from '../../ui/input';

interface DataSourceSelectorProps {
  block: FieldBlock;
  onUpdate: (dataSource: DataSource) => void;
}

export function DataSourceSelector({ block, onUpdate }: DataSourceSelectorProps) {
  const [dataSourceType, setDataSourceType] = useState<'auto' | 'manual'>(block.dataSource.type);

  const handleTypeChange = (type: 'auto' | 'manual') => {
    setDataSourceType(type);
    if (type === 'auto') {
      onUpdate({
        type: 'auto',
        entity: 'employee',
        field: undefined,
        handlebarsExpression: undefined,
      });
    } else {
      onUpdate({
        type: 'manual',
        prompt: `Enter ${block.label}`,
      });
    }
  };

  const selectedGroup = VARIABLE_GROUPS.find((g) => g.entity === block.dataSource.entity);

  return (
    <div className="space-y-4">
      <div>
        <Label>Data Source</Label>
        <RadioGroup
          value={dataSourceType}
          onValueChange={handleTypeChange}
          className="mt-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="auto" id="auto" />
            <Label htmlFor="auto" className="font-normal cursor-pointer">
              Auto-fill from system data
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="manual" id="manual" />
            <Label htmlFor="manual" className="font-normal cursor-pointer">
              Fill in at generation time
            </Label>
          </div>
        </RadioGroup>
      </div>

      {dataSourceType === 'auto' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="entity">Entity</Label>
            <Select
              value={block.dataSource.entity || 'employee'}
              onValueChange={(value) => {
                onUpdate({
                  ...block.dataSource,
                  entity: value as any,
                  field: undefined,
                });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="company">Company</SelectItem>
                <SelectItem value="payroll">Payroll</SelectItem>
                <SelectItem value="termination">Termination</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedGroup && (
            <div className="space-y-2">
              <Label htmlFor="field">Field</Label>
              <Select
                value={block.dataSource.field || ''}
                onValueChange={(value) => {
                  const variable = selectedGroup.variables.find((v) => v.key === value);
                  onUpdate({
                    ...block.dataSource,
                    field: variable?.key.split('.').pop(),
                    handlebarsExpression: variable ? `{{${variable.key}}}` : undefined,
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  {selectedGroup.variables.map((variable) => (
                    <SelectItem key={variable.key} value={variable.key}>
                      {variable.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {block.dataSource.field && (
                <p className="text-xs text-gray-500 mt-1">
                  Handlebars: {block.dataSource.handlebarsExpression || `{{${block.dataSource.entity}.${block.dataSource.field}}}`}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {dataSourceType === 'manual' && (
        <div className="space-y-2">
          <Label htmlFor="prompt">Prompt Text</Label>
          <Input
            id="prompt"
            value={block.dataSource.prompt || ''}
            onChange={(e) =>
              onUpdate({
                ...block.dataSource,
                prompt: e.target.value,
              })
            }
            placeholder="Enter prompt shown during document generation"
          />
          <p className="text-xs text-gray-500 mt-1">
            This field will be shown as an input when generating the document.
          </p>
        </div>
      )}
    </div>
  );
}
