import { NextRequest, NextResponse } from 'next/server';
import { lookup } from 'dns';
import { whoisDomain } from 'whoiser';

interface WhoisResult {
  [key: string]: Record<string, unknown> | undefined;
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

// Helper function to classify whois errors
function classifyWhoisError(
  error: Error,
  domain: string,
  timeout: number
): Error {
  const errorMessage = error.message.toLowerCase();

  if (errorMessage.includes('timeout')) {
    console.error(`Whois timeout for ${domain}`, {
      timeout,
      error: error.message,
    });
    return new Error(`Whois lookup timeout after ${timeout}ms`);
  }

  if (errorMessage.includes('connection')) {
    console.error(`Whois connection error for ${domain}`, {
      error: error.message,
    });
    return new Error('Whois connection failed - possible network restriction');
  }

  if (errorMessage.includes('refused') || errorMessage.includes('denied')) {
    console.error(`Whois access denied for ${domain}`, {
      error: error.message,
    });
    return new Error(
      'Whois access denied - possible rate limiting or blocking'
    );
  }

  console.error(`Whois lookup failed for ${domain}`, {
    error: error.message,
    stack: error.stack,
  });
  return error;
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
    if (error instanceof Error) {
      throw classifyWhoisError(error, domain, timeout);
    }
    throw error;
  }
}

// Helper function to check if domain appears available based on string patterns
function checkAvailabilityPatterns(firstServerData: Record<string, unknown>): {
  isAvailable: boolean;
  indicator?: string;
  matchedText?: string;
} {
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

  // Only stringify specific fields that commonly contain availability status
  const statusFields = ['status', 'text', 'raw', 'result', 'response'];
  let searchText = '';

  for (const field of statusFields) {
    const fieldValue = firstServerData[field];
    if (fieldValue && typeof fieldValue === 'string') {
      searchText += fieldValue.toLowerCase() + ' ';
    }
  }

  // If no specific status fields found, fallback to limited JSON stringify
  if (!searchText.trim()) {
    // Only stringify up to 1000 chars to avoid performance issues
    const limitedString = JSON.stringify(firstServerData)
      .substring(0, 1000)
      .toLowerCase();
    searchText = limitedString;
  }

  const foundIndicator = availabilityIndicators.find(indicator =>
    searchText.includes(indicator)
  );

  if (foundIndicator) {
    const matchStart = Math.max(0, searchText.indexOf(foundIndicator) - 50);
    const matchEnd = Math.min(
      searchText.length,
      searchText.indexOf(foundIndicator) + 100
    );

    return {
      isAvailable: true,
      indicator: foundIndicator,
      matchedText: searchText.substring(matchStart, matchEnd),
    };
  }

  return { isAvailable: false };
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

    // Log sample of the data for debugging (avoid expensive JSON.stringify)
    console.info('Whois data sample for parsing', {
      serverKeys,
      dataProperties: Object.keys(firstServerData),
      hasStatus: !!firstServerData['status'],
      hasText: !!firstServerData['text'],
      hasRaw: !!firstServerData['raw'],
    });

    // Check for availability patterns first
    const availabilityCheck = checkAvailabilityPatterns(firstServerData);

    if (availabilityCheck.isAvailable) {
      console.info('Domain appears available', {
        indicator: availabilityCheck.indicator,
        matchedText: availabilityCheck.matchedText,
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

    // Check registration strings in a more efficient way
    let foundRegistrationString: string | undefined;

    // Check specific fields first before doing expensive string search
    const searchableFields = ['status', 'text', 'raw', 'result', 'response'];
    for (const field of searchableFields) {
      const fieldValue = firstServerData[field];
      if (fieldValue && typeof fieldValue === 'string') {
        const fieldContent = fieldValue.toLowerCase();
        foundRegistrationString = registrationStrings.find(str =>
          fieldContent.includes(str)
        );
        if (foundRegistrationString) break;
      }
    }

    if (foundRegistrationProperty || foundRegistrationString) {
      console.info('Domain appears taken', {
        foundProperty: foundRegistrationProperty,
        foundString: foundRegistrationString,
        ...(foundRegistrationString && {
          matchedText: `Found in whois response: ${foundRegistrationString}`,
        }),
      });
      return 'taken';
    }

    // If we can't determine, return unknown
    console.warn('Could not determine domain status from whois data', {
      dataKeys: Object.keys(firstServerData),
      hasCommonFields: {
        status: !!firstServerData['status'],
        text: !!firstServerData['text'],
        raw: !!firstServerData['raw'],
      },
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
