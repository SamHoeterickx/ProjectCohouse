export interface IReceiptItem {
    name: string;
    amount: number;
    price_per_unit: number;
    discount_in_cents: number;
    price: number;
}

export interface IReceiptResponse {
    store_name: string;
    date: string;
    total_price: number;
    items: IReceiptItem[];
}
