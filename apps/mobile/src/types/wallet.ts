export interface ICashuInvoice {
  bolt11?: string;
  quote?: string;
  amount?: string;
  date?: number;
  mint?: string;
  unit?: string;
  state?:string;
}
