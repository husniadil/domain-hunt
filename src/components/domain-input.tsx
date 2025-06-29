'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface DomainInputProps {
  onDomainsChange?: (domains: string[]) => void;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function DomainInput({
  onDomainsChange,
  onValueChange,
  placeholder = 'Enter domain name...',
  className,
}: DomainInputProps) {
  const [value, setValue] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [domains, setDomains] = useState<string[]>([]);

  // Domain validation: only letters, numbers, and hyphens
  const validateDomain = (input: string): boolean => {
    if (input === '') return true; // Empty is valid
    return /^[a-zA-Z0-9-]+$/.test(input);
  };

  // Helper functions for domain management
  const isDuplicate = (domain: string): boolean => {
    return domains.includes(domain.toLowerCase());
  };

  const addDomain = (domain: string) => {
    if (domain.trim() && !isDuplicate(domain) && validateDomain(domain)) {
      const newDomains = [...domains, domain.toLowerCase()];
      setDomains(newDomains);
      onDomainsChange?.(newDomains);
      return true;
    }
    return false;
  };

  const removeDomain = (domainToRemove: string) => {
    const newDomains = domains.filter(domain => domain !== domainToRemove);
    setDomains(newDomains);
    onDomainsChange?.(newDomains);
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ' && value.trim()) {
      e.preventDefault(); // Prevent space from being added to input

      if (addDomain(value.trim())) {
        setValue(''); // Clear input after successful pill creation
        setIsValid(true);
      }
    }
  };

  return (
    <div className="space-y-3">
      <Input
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`${className} ${!isValid ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
      />

      {!isValid && (
        <p className="text-sm text-red-500">
          Only letters, numbers, and hyphens are allowed
        </p>
      )}

      {value && isValid && isDuplicate(value) && (
        <p className="text-sm text-yellow-600">Domain already added</p>
      )}

      {value && isValid && !isDuplicate(value) && (
        <p className="text-sm text-muted-foreground">
          Press space to add &ldquo;{value}&rdquo; as a pill
        </p>
      )}

      {/* Display created pills */}
      {domains.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {domains.map((domain, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="flex items-center gap-1 pl-3 pr-1 py-1"
            >
              <span>{domain}</span>
              <button
                onClick={() => removeDomain(domain)}
                className="ml-1 p-0.5 hover:bg-secondary-foreground/20 rounded-sm transition-colors"
                aria-label={`Remove ${domain}`}
              >
                <X size={12} />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
