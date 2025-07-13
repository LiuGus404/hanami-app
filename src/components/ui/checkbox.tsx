// src/components/ui/checkbox.tsx
'use client';
import { FC, ChangeEvent } from 'react';

interface CheckboxProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

export const Checkbox: FC<CheckboxProps> = ({ checked, onCheckedChange }) => {
  return (
    <input
      checked={checked}
      className="w-4 h-4"
      type="checkbox"
      onChange={(e: ChangeEvent<HTMLInputElement>) => onCheckedChange(e.target.checked)}
    />
  );
};