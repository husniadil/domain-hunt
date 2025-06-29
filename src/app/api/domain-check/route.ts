import { NextRequest, NextResponse } from 'next/server';
import { lookup } from 'dns';
import { whoisDomain } from 'whoiser';

interface WhoisResult {
  [key: string]: string | string[] | Record<string, unknown> | undefined;
}

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

async function performWhoisLookup(
  domain: string,
  timeout: number = 10000
): Promise<WhoisResult> {
  try {
    const result = await whoisDomain(domain, {
      timeout,
    });
    return result;
  } catch (error) {
    if (error instanceof Error && error.message.includes('timeout')) {
      throw new Error('Whois lookup timeout');
    }
    throw error;
  }
}

function parseWhoisAvailability(
  whoisData: WhoisResult
): 'available' | 'taken' | 'unknown' {
  try {
    // Check if whois data is empty or null
    if (!whoisData || Object.keys(whoisData).length === 0) {
      return 'unknown';
    }

    // Get the first (and usually only) server result
    const serverKeys = Object.keys(whoisData);
    const firstServerData = whoisData[serverKeys[0]];

    if (!firstServerData) {
      return 'unknown';
    }

    // Convert structured data to string for pattern matching
    const dataString = JSON.stringify(firstServerData).toLowerCase();

    // Check for "No Match" or similar indicators that suggest availability
    if (
      dataString.includes('no match') ||
      dataString.includes('not found') ||
      dataString.includes('no matching record') ||
      dataString.includes('available') ||
      dataString.includes('not registered') ||
      dataString.includes('status: free') ||
      dataString.includes('no data found') ||
      dataString.includes('domain not found')
    ) {
      return 'available';
    }

    // Check for registration indicators
    if (
      firstServerData.hasOwnProperty('domain') ||
      firstServerData.hasOwnProperty('registrar') ||
      firstServerData.hasOwnProperty('creation_date') ||
      firstServerData.hasOwnProperty('created_date') ||
      firstServerData.hasOwnProperty('registrant') ||
      firstServerData.hasOwnProperty('admin_contact') ||
      firstServerData.hasOwnProperty('name_servers') ||
      dataString.includes('registrar:') ||
      dataString.includes('creation date') ||
      dataString.includes('created on') ||
      dataString.includes('registration time') ||
      dataString.includes('registered')
    ) {
      return 'taken';
    }

    // If we can't determine, return unknown
    return 'unknown';
  } catch (error) {
    console.error('Error parsing whois data:', error);
    return 'unknown';
  }
}
