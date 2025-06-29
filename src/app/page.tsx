'use client';

import { DomainInput } from '@/components/domain-input';
import { TldSelector } from '@/components/tld-selector';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center justify-center space-y-8 text-center min-h-[calc(100vh-8rem)]">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">
            Domain Hunt
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Find and hunt for the perfect domain names for your next project
          </p>
        </div>

        <div className="w-full max-w-md space-y-6">
          <DomainInput
            onDomainsChange={domains =>
              console.log('Selected domains:', domains)
            }
            onValueChange={value => console.log('Current input:', value)}
            className="text-center"
          />

          <TldSelector
            onTldsChange={tlds => console.log('Selected TLDs:', tlds)}
          />
        </div>
      </div>
    </div>
  );
}
