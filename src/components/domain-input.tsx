'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';

interface DomainInputProps {
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function DomainInput({
  onValueChange,
  placeholder = 'Enter domain name...',
  className,
}: DomainInputProps) {
  const [value, setValue] = useState('');
  const [isValid, setIsValid] = useState(true);

  // Domain validation: only letters, numbers, and hyphens
  const validateDomain = (input: string): boolean => {
    if (input === '') return true; // Empty is valid
    return /^[a-zA-Z0-9-]+$/.test(input);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const valid = validateDomain(newValue);

    // Always update the displayed value so users can see what they typed
    setValue(newValue);
    setIsValid(valid);

    // Only call onValueChange for valid inputs
    if (valid) {
      onValueChange?.(newValue);
    }
  };

  return (
    <div className="space-y-2">
      <Input
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={`${className} ${!isValid ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
      />
      {!isValid && (
        <p className="text-sm text-red-500">
          Only letters, numbers, and hyphens are allowed
        </p>
      )}
      {value && isValid && (
        <p className="text-sm text-muted-foreground">Domain: {value}</p>
      )}
    </div>
  );
}
