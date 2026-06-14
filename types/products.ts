export interface ProductRow {
  id: string;
  business_id: string;
  supplier_id: string | null;
  supplier_name: string | null;
  name: string;
  sku: string | null;
  category: string | null;
  unit: string;
  unit_cost: number | null;
  current_stock: number;
  min_stock_alert: number | null;
  is_active: boolean;
  is_low_stock: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaginatedProducts {
  products: ProductRow[];
  total: number;
}

export interface CreateProductData {
  name: string;
  supplier_id?: string | null;
  sku?: string | null;
  category?: string | null;
  unit?: string;
  unit_cost?: number | null;
  current_stock?: number;
  min_stock_alert?: number | null;
}

export interface StockMovementRow {
  id: string;
  business_id: string;
  product_id: string;
  movement_type: "purchase" | "service_use" | "manual_in" | "manual_out" | "wastage";
  quantity: number;
  unit_cost: number | null;
  reference_id: string | null;
  reference_type: string | null;
  notes: string | null;
  created_at: string;
}

export interface ProductDetail extends ProductRow {
  movements: StockMovementRow[];
}

export interface AdjustStockData {
  movement_type: "manual_in" | "manual_out" | "wastage" | "service_use";
  quantity: number;
  unit_cost?: number | null;
  notes?: string | null;
}
