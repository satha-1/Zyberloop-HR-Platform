"use client";

import { Button } from '../../ui/button';
import { LucideIcon } from 'lucide-react';

interface FieldButtonProps {
  icon: LucideIcon;
  label: string;
  description: string;
  onClick: () => void;
}

export function FieldButton({ icon: Icon, label, description, onClick }: FieldButtonProps) {
  return (
    <Button
      variant="outline"
      className="w-full justify-start h-auto py-3 flex-col items-start"
      onClick={onClick}
    >
      <div className="flex items-center gap-2 w-full">
        <Icon className="h-5 w-5 text-gray-600" />
        <div className="flex-1 text-left">
          <div className="font-medium text-sm">{label}</div>
          <div className="text-xs text-gray-500">{description}</div>
        </div>
      </div>
    </Button>
  );
}
