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
  console.log('Initializing IndexDB database:', DB_NAME);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Error opening IndexDB:', event);
      reject('Error opening IndexDB');
    };

    request.onupgradeneeded = (event) => {
      console.log('Upgrading IndexDB database to version', DB_VERSION);
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains('wallet')) {
        console.log('Creating wallet object store');
        const store = db.createObjectStore('wallet', { keyPath: 'id' });
        console.log('Wallet object store created');
      }
    };

    request.onsuccess = (event) => {
      console.log('IndexDB database initialized successfully');
      resolve();
    };
  });
};

export const getWalletData = async (): Promise<StorageData> => {
  console.log('Retrieving wallet data from IndexDB');
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Error opening IndexDB for read:', event);
      reject('Error opening IndexDB');
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction(['wallet'], 'readonly');
      const store = transaction.objectStore('wallet');
      const getRequest = store.get('wallet-data');

      getRequest.onerror = (event) => {
        console.error('Error getting wallet data from store:', event);
        reject('Error getting wallet data');
      };

      getRequest.onsuccess = (event) => {
        const data = (event.target as IDBRequest).result;
        if (data) {
          console.log('Retrieved wallet data from IndexDB');
          console.log('Tokens in retrieved data:', data.data.tokens?.length || 0);
          resolve(data.data);
        } else {
          console.log('No wallet data found in IndexDB, returning default data');
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
  console.log('Saving wallet data to IndexDB');
  console.log('Tokens count to save:', data.tokens?.length || 0);
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Error opening IndexDB for write:', event);
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
      
      console.log('Putting data into wallet store with ID wallet-data');
      const putRequest = store.put(saveData);

      putRequest.onerror = (event) => {
        console.error('Error saving wallet data to store:', event);
        reject('Error saving wallet data');
      };

      putRequest.onsuccess = (event) => {
        console.log('Successfully saved wallet data to IndexDB');
        console.log('Saved tokens count:', data.tokens?.length || 0);
        resolve();
      };
      
      transaction.oncomplete = () => {
        console.log('IndexDB transaction completed successfully');
      };
      
      transaction.onerror = (event) => {
        console.error('IndexDB transaction error:', event);
      };
    };
  });
}; 