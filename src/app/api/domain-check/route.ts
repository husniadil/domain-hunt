import { NextRequest, NextResponse } from 'next/server';
import { lookup } from 'dns';

export async function POST(request: NextRequest) {
  try {
    const { domain, tld } = await request.json();

    if (!domain || !tld) {
      return NextResponse.json(
        { error: 'Domain and TLD are required' },
        { status: 400 }
      );
    }

    // Validate domain format
    if (!/^[a-zA-Z0-9-]+$/.test(domain)) {
      return NextResponse.json(
        { error: 'Invalid domain format' },
        { status: 400 }
      );
    }

    const fullDomain = `${domain}${tld}`;

    try {
      // Perform DNS lookup with timeout
      await performDnsLookup(fullDomain, 5000);

      // If we get here, DNS lookup succeeded - domain is taken
      return NextResponse.json({
        domain,
        tld,
        status: 'taken',
        checkedAt: new Date().toISOString(),
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      // Check if it's a DNS resolution failure (domain might be available)
      if (
        errorMessage.includes('NXDOMAIN') ||
        errorMessage.includes('NOTFOUND')
      ) {
        return NextResponse.json({
          domain,
          tld,
          status: 'available',
          checkedAt: new Date().toISOString(),
        });
      }

      // Other errors (network, timeout, etc.)
      return NextResponse.json({
        domain,
        tld,
        status: 'error',
        error: errorMessage,
        checkedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function performDnsLookup(hostname: string, timeout: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('DNS lookup timeout'));
    }, timeout);

    lookup(hostname, (error, address) => {
      clearTimeout(timeoutId);

      if (error) {
        reject(error);
      } else if (address) {
        resolve(address);
      } else {
        reject(new Error('No address returned'));
      }
    });
  });
}
