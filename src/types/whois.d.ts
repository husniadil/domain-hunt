declare module 'whois' {
  interface WhoisCallback {
    (error: Error | null, data: string | null): void;
  }

  export function lookup(domain: string, callback: WhoisCallback): void;
}
