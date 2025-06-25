export interface SocialAccount {
  platform: 'twitter' | 'discord' | 'telegram' | 'instagram';
  username?: string;
  status: 'connected' | 'coming_soon' | 'disconnected';
}

export interface WalletOption {
  id: string;
  name: string;
  icon: any; // Will be required from assets
}

export interface Transaction {
  type: 'send' | 'receive' | 'top_up';
  age: string;
  address: string;
  amount: string;
  hash: string;
}
