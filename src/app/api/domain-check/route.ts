import { NextRequest, NextResponse } from 'next/server';
import { lookup } from 'dns';
import { whoisDomain } from 'whoiser';

interface WhoisResult {
  [key: string]: string | string[] | Record<string, unknown> | undefined;
}

interface DebugInfo {
  timestamp: string;
  step: string;
  data?: Record<string, unknown>;
  timing?: number;
  error?: string;
}

export async function POST(request: NextRequest) {
  const debugInfo: DebugInfo[] = [];
  const startTime = Date.now();

  // Check if debug mode is enabled via headers
  const isDebug = request.headers.get('x-debug') === 'true';

  const addDebugInfo = (
    step: string,
    data?: Record<string, unknown>,
    error?: string
  ) => {
    if (isDebug) {
      debugInfo.push({
        timestamp: new Date().toISOString(),
        step,
        data,
        timing: Date.now() - startTime,
        error,
      });
    }
  };

  try {
    const { domain, tld } = await request.json();
    addDebugInfo('request_parsed', { domain, tld });

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
    addDebugInfo('domain_formatted', { fullDomain });

    try {
      // Perform DNS lookup with timeout
      addDebugInfo('dns_lookup_start');
      await performDnsLookup(fullDomain, 5000);
      addDebugInfo('dns_lookup_success');

      // If we get here, DNS lookup succeeded - domain is taken
      return NextResponse.json({
        domain,
        tld,
        status: 'taken',
        checkedAt: new Date().toISOString(),
        ...(isDebug && { debugInfo }),
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      addDebugInfo('dns_lookup_failed', { errorMessage }, errorMessage);

      // Check if it's a DNS resolution failure (domain might be available)
      if (
        errorMessage.includes('NXDOMAIN') ||
        errorMessage.includes('NOTFOUND')
      ) {
        addDebugInfo('dns_indicates_available');
        return NextResponse.json({
          domain,
          tld,
          status: 'available',
          checkedAt: new Date().toISOString(),
          ...(isDebug && { debugInfo }),
        });
      }

      // Other errors (network, timeout, etc.) - try whois fallback
      try {
        addDebugInfo('whois_fallback_start', { reason: errorMessage });

        // Use structured logging for production environments
        console.info(
          `DNS lookup failed for domain: ${fullDomain}, attempting whois fallback`,
          {
            domain: fullDomain,
            fallback: 'whois',
            dnsError: errorMessage,
            timestamp: new Date().toISOString(),
          }
        );

        // Use shorter timeout for Vercel serverless environment
        const whoisTimeout = process.env.VERCEL ? 7000 : 10000;
        const whoisStartTime = Date.now();

        const whoisData = await performWhoisLookup(fullDomain, whoisTimeout);
        const whoisDuration = Date.now() - whoisStartTime;

        addDebugInfo('whois_lookup_completed', {
          duration: whoisDuration,
          dataKeys: Object.keys(whoisData || {}),
          dataSize: JSON.stringify(whoisData || {}).length,
        });

        // Log whois response for debugging (in production, consider sanitizing)
        console.info('Whois response received', {
          domain: fullDomain,
          duration: whoisDuration,
          dataKeys: Object.keys(whoisData || {}),
          dataSize: JSON.stringify(whoisData || {}).length,
          ...(isDebug && { whoisData }), // Only include full data in debug mode
        });

        const whoisStatus = parseWhoisAvailability(whoisData);
        addDebugInfo('whois_parsed', { whoisStatus });

        if (whoisStatus === 'unknown') {
          addDebugInfo('whois_status_unknown');
          console.warn('Whois parsing resulted in unknown status', {
            domain: fullDomain,
            whoisDataKeys: Object.keys(whoisData || {}),
            ...(isDebug && { whoisData }),
          });

          return NextResponse.json({
            domain,
            tld,
            status: 'error',
            error: 'Could not determine availability from DNS or whois',
            checkedAt: new Date().toISOString(),
            fallbackUsed: 'whois',
            ...(isDebug && { debugInfo }),
          });
        }

        console.info('Whois fallback successful', {
          domain: fullDomain,
          status: whoisStatus,
          duration: whoisDuration,
        });

        return NextResponse.json({
          domain,
          tld,
          status: whoisStatus,
          checkedAt: new Date().toISOString(),
          fallbackUsed: 'whois',
          ...(isDebug && { debugInfo }),
        });
      } catch (whoisError) {
        const whoisErrorMessage =
          whoisError instanceof Error
            ? whoisError.message
            : 'Unknown whois error';

        addDebugInfo(
          'whois_lookup_failed',
          { whoisErrorMessage },
          whoisErrorMessage
        );

        // Enhanced error logging for whois failures
        console.error('Whois fallback failed', {
          domain: fullDomain,
          dnsError: errorMessage,
          whoisError: whoisErrorMessage,
          timestamp: new Date().toISOString(),
          stack: whoisError instanceof Error ? whoisError.stack : undefined,
        });

        return NextResponse.json({
          domain,
          tld,
          status: 'error',
          error: `DNS failed: ${errorMessage}, Whois failed: ${whoisErrorMessage}`,
          checkedAt: new Date().toISOString(),
          fallbackUsed: 'whois',
          ...(isDebug && { debugInfo }),
        });
      }
    }
  } catch (error) {
    addDebugInfo(
      'api_error',
      undefined,
      error instanceof Error ? error.message : 'Unknown error'
    );
    console.error('API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        ...(isDebug && { debugInfo }),
      },
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
    console.info(
      `Starting whois lookup for ${domain} with timeout ${timeout}ms`
    );

    const result = await whoisDomain(domain, {
      timeout,
      // Additional options for better compatibility in serverless environments
      follow: 2, // Limit redirects
    });

    console.info(`Whois lookup completed for ${domain}`, {
      resultKeys: Object.keys(result || {}),
      hasData: !!result && Object.keys(result).length > 0,
    });

    return result;
  } catch (error) {
    // Enhanced error classification
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      if (errorMessage.includes('timeout')) {
        console.error(`Whois timeout for ${domain}`, {
          timeout,
          error: error.message,
        });
        throw new Error(`Whois lookup timeout after ${timeout}ms`);
      }

      if (errorMessage.includes('connection')) {
        console.error(`Whois connection error for ${domain}`, {
          error: error.message,
        });
        throw new Error(
          'Whois connection failed - possible network restriction'
        );
      }

      if (errorMessage.includes('refused') || errorMessage.includes('denied')) {
        console.error(`Whois access denied for ${domain}`, {
          error: error.message,
        });
        throw new Error(
          'Whois access denied - possible rate limiting or blocking'
        );
      }

      console.error(`Whois lookup failed for ${domain}`, {
        error: error.message,
        stack: error.stack,
      });
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
      console.warn('Whois data is empty or null');
      return 'unknown';
    }

    // Get the first (and usually only) server result
    const serverKeys = Object.keys(whoisData);
    const firstServerData = whoisData[serverKeys[0]];

    if (!firstServerData) {
      console.warn('First server data is null/undefined', { serverKeys });
      return 'unknown';
    }

    // Convert structured data to string for pattern matching
    const dataString = JSON.stringify(firstServerData).toLowerCase();

    // Log sample of the data for debugging (first 500 chars)
    console.info('Whois data sample for parsing', {
      serverKeys,
      dataProperties: Object.keys(firstServerData),
      dataSample: dataString.substring(0, 500),
      dataLength: dataString.length,
    });

    // Check for "No Match" or similar indicators that suggest availability
    const availabilityIndicators = [
      'no match',
      'not found',
      'no matching record',
      'available',
      'not registered',
      'status: free',
      'no data found',
      'domain not found',
    ];

    const foundAvailabilityIndicator = availabilityIndicators.find(indicator =>
      dataString.includes(indicator)
    );

    if (foundAvailabilityIndicator) {
      console.info('Domain appears available', {
        indicator: foundAvailabilityIndicator,
        matchedText: dataString.substring(
          dataString.indexOf(foundAvailabilityIndicator) - 50,
          dataString.indexOf(foundAvailabilityIndicator) + 100
        ),
      });
      return 'available';
    }

    // Check for registration indicators - both property names and string patterns
    const registrationProperties = [
      'domain',
      'registrar',
      'creation_date',
      'created_date',
      'registrant',
      'admin_contact',
      'name_servers',
      // Add title case versions that whoiser returns
      'Domain Name',
      'Created Date',
      'Registrar',
      'Registrant Name',
      'Admin Name',
      'Domain Status',
      'Name Server',
    ];

    const registrationStrings = [
      'registrar:',
      'creation date',
      'created on',
      'registration time',
      'registered',
      'domain status',
      'registrant name',
      'admin name',
      'created date',
    ];

    const foundRegistrationProperty = registrationProperties.find(prop =>
      firstServerData.hasOwnProperty(prop)
    );

    const foundRegistrationString = registrationStrings.find(str =>
      dataString.includes(str)
    );

    if (foundRegistrationProperty || foundRegistrationString) {
      console.info('Domain appears taken', {
        foundProperty: foundRegistrationProperty,
        foundString: foundRegistrationString,
        ...(foundRegistrationString && {
          matchedText: dataString.substring(
            dataString.indexOf(foundRegistrationString) - 50,
            dataString.indexOf(foundRegistrationString) + 100
          ),
        }),
      });
      return 'taken';
    }

    // If we can't determine, return unknown
    console.warn('Could not determine domain status from whois data', {
      dataKeys: Object.keys(firstServerData),
      dataSample: dataString.substring(0, 200),
    });
    return 'unknown';
  } catch (error) {
    console.error('Error parsing whois data:', error, {
      whoisDataKeys: whoisData ? Object.keys(whoisData) : 'null/undefined',
      errorStack: error instanceof Error ? error.stack : undefined,
    });
    return 'unknown';
  }
}
