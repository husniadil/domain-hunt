export interface TLD {
  extension: string;
  name: string;
  popular: boolean;
}

export interface TLDConfig {
  tlds: TLD[];
}
