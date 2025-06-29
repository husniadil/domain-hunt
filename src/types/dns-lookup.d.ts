declare module 'dns-lookup' {
  export function lookup(
    hostname: string,
    callback: (error: Error | null, address: string) => void
  ): void;
}
