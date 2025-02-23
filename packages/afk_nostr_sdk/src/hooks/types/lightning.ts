export interface LightningState {
  nostrWebLN: any;
  connectionStatus: string;
  balance: number | undefined;
  nwcUrl: string;
  nwcAuthUrl: string;
  generatedInvoice: string;
  preimage: string;
  connectionData: any;
  isExtensionAvailable: boolean;
}
