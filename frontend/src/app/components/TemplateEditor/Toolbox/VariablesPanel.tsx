"use client";

import { useState } from 'react';
import { VARIABLE_GROUPS } from '../constants';
import { Variable } from '../types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Search } from 'lucide-react';

interface VariablesPanelProps {
  onVariableInsert: (variable: Variable) => void;
}

export function VariablesPanel({ onVariableInsert }: VariablesPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGroups = VARIABLE_GROUPS.map((group) => ({
    ...group,
    variables: group.variables.filter(
      (v) =>
        v.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.description.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  })).filter((group) => group.variables.length > 0);

  return (
    <div className="h-96 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search variables..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Tabs defaultValue={filteredGroups[0]?.entity || 'employee'} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-4 mt-2">
          {filteredGroups.map((group) => (
            <TabsTrigger key={group.entity} value={group.entity}>
              {group.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="flex-1 overflow-y-auto p-4">
          {filteredGroups.map((group) => (
            <TabsContent key={group.entity} value={group.entity} className="mt-0">
              <div className="space-y-2">
                {group.variables.map((variable) => (
                  <Button
                    key={variable.key}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-2"
                    onClick={() => onVariableInsert(variable)}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">{variable.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{variable.description}</div>
                      <div className="text-xs text-gray-400 mt-1 font-mono">{variable.key}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
}
