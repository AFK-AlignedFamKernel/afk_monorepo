const DB_NAME = 'cashu-wallet';
const DB_VERSION = 1;

export interface StorageData {
  mints: MintData[];
  activeMint?: string;
  activeUnit?: string;
  balance: number;
  transactions: Transaction[];
  tokens: Token[];
}

export interface MintData {
  url: string;
  alias: string;
  units: string[];
  keys?: Record<string, any>;
}

export interface Transaction {
  /** Unique identifier for the transaction */
  id: string;
  /** Type of transaction */
  type: 'sent' | 'received';
  /** Amount in sats */
  amount: number;
  /** ISO date string */
  date: string;
  /** Optional memo for the transaction */
  memo?: string;
  /** Ecash token if applicable */
  token?: string;
  /** Lightning payment hash for tracking invoice status */
  paymentHash?: string;
  /** Mint URL associated with this transaction */
  mintUrl?: string;
  /** Status of the transaction */
  status?: 'pending' | 'paid' | 'failed';
  /** Human-readable description */
  description?: string;
  /** Type of invoice if applicable */
  invoiceType?: 'lightning';
  /** Full Lightning invoice if applicable */
  invoice?: string;
  /** Unit of currency (default: sat) */
  unit?: string;
}

export interface Token {
  id: string;
  token: string;
  amount: number;
  mintUrl: string;
  spendable: boolean;
  created: string;
}

export const initDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      reject('Error opening IndexDB');
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains('wallet')) {
        const store = db.createObjectStore('wallet', { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve();
    };
  });
};

export const getWalletData = async (): Promise<StorageData> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      reject('Error opening IndexDB');
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction(['wallet'], 'readonly');
      const store = transaction.objectStore('wallet');
      const getRequest = store.get('wallet-data');

      getRequest.onerror = (event) => {
        reject('Error getting wallet data');
      };

      getRequest.onsuccess = (event) => {
        const data = (event.target as IDBRequest).result;
        if (data) {
          resolve(data.data);
        } else {
          // Return default initial data
          resolve({
            mints: [],
            balance: 0,
            transactions: [],
            tokens: [],
          });
        }
      };
    };
  });
};

export const saveWalletData = async (data: StorageData): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      reject('Error opening IndexDB');
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction(['wallet'], 'readwrite');
      const store = transaction.objectStore('wallet');
      
      const saveData = {
        id: 'wallet-data',
        data: data,
      };
      const putRequest = store.put(saveData);

      putRequest.onerror = (event) => {
        reject('Error saving wallet data');
      };

      putRequest.onsuccess = (event) => {
        resolve();
      };
    };
  });
}; 