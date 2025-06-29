import { NextRequest, NextResponse } from 'next/server';
import { lookup } from 'dns';
import whois from 'whois';

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

      // Other errors (network, timeout, etc.) - try whois fallback
      try {
        // Use structured logging for production environments
        console.info(
          `DNS lookup failed for domain: ${fullDomain}, attempting whois fallback`,
          {
            domain: fullDomain,
            fallback: 'whois',
            timestamp: new Date().toISOString(),
          }
        );
        const whoisData = await performWhoisLookup(fullDomain, 10000);
        const whoisStatus = parseWhoisAvailability(whoisData);

        if (whoisStatus === 'unknown') {
          return NextResponse.json({
            domain,
            tld,
            status: 'error',
            error: 'Could not determine availability from DNS or whois',
            checkedAt: new Date().toISOString(),
          });
        }

        return NextResponse.json({
          domain,
          tld,
          status: whoisStatus,
          checkedAt: new Date().toISOString(),
          fallbackUsed: 'whois',
        });
      } catch (whoisError) {
        const whoisErrorMessage =
          whoisError instanceof Error
            ? whoisError.message
            : 'Unknown whois error';

        return NextResponse.json({
          domain,
          tld,
          status: 'error',
          error: `DNS failed: ${errorMessage}, Whois failed: ${whoisErrorMessage}`,
          checkedAt: new Date().toISOString(),
        });
      }
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

function performWhoisLookup(
  domain: string,
  timeout: number = 10000
): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Whois lookup timeout'));
    }, timeout);

    whois.lookup(domain, (error, data) => {
      clearTimeout(timeoutId);

      if (error) {
        reject(error);
      } else if (data) {
        resolve(data);
      } else {
        reject(new Error('No whois data returned'));
      }
    });
  });
}

function parseWhoisAvailability(
  whoisData: string
): 'available' | 'taken' | 'unknown' {
  const lowerData = whoisData.toLowerCase();

  // Common availability indicators
  const availabilityIndicators = [
    'no matching record',
    'not found',
    'no match',
    'available',
    'not registered',
    'free',
    'status: free',
    'no data found',
    'domain not found',
  ];

  // Common unavailability indicators
  const unavailabilityIndicators = [
    'creation date',
    'created on',
    'registration time',
    'registered',
    'domain status: clienttransferprohibited',
    'registration-status: registeredandoperational',
    'registrar:',
    'registrant',
    'admin contact',
    'name server',
  ];

  // Check for availability indicators first
  for (const indicator of availabilityIndicators) {
    if (lowerData.includes(indicator)) {
      return 'available';
    }
  }

  // Check for unavailability indicators
  for (const indicator of unavailabilityIndicators) {
    if (lowerData.includes(indicator)) {
      return 'taken';
    }
  }

  // If we can't determine, return unknown
  return 'unknown';
}
