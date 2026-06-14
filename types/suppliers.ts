export type SupplierOrderStatus = "draft" | "ordered" | "received" | "cancelled";

export interface SupplierRow {
  id: string;
  business_id: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupplierWithStats extends SupplierRow {
  total_spent: number;
  open_orders: number;
}

export interface SupplierFilters {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedSuppliers {
  suppliers: SupplierWithStats[];
  total: number;
}

export interface CreateSupplierData {
  name: string;
  contact_name?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  notes?: string | null;
}

export interface SupplierDetail extends SupplierRow {
  recent_expenses: {
    id: string;
    description: string;
    amount: number;
    date: string;
    category: string;
  }[];
  open_orders: {
    id: string;
    reference: string;
    status: SupplierOrderStatus;
    total_amount: number;
    ordered_at: string | null;
    expected_at: string | null;
  }[];
  monthly_spend: { month: string; amount: number }[];
}

export interface SupplierOrderRow {
  id: string;
  business_id: string;
  supplier_id: string;
  reference: string;
  status: SupplierOrderStatus;
  total_amount: number;
  ordered_at: string | null;
  expected_at: string | null;
  notes: string | null;
  created_at: string;
  supplier?: { id: string; name: string };
}

export interface PaginatedSupplierOrders {
  orders: SupplierOrderRow[];
  total: number;
}

export interface CreateOrderItemData {
  product_name: string;
  sku?: string | null;
  quantity: number;
  unit_price: number;
}

export interface CreateOrderData {
  supplier_id: string;
  reference?: string;
  notes?: string | null;
  ordered_at?: string | null;
  expected_at?: string | null;
  items: CreateOrderItemData[];
}

export interface SupplierOrderFilters {
  supplierId?: string;
  status?: SupplierOrderStatus[];
  page?: number;
  limit?: number;
}

export interface ScanInvoiceResult {
  supplier_hint: string | null;
  supplier_type_hint?: string;
  items: CreateOrderItemData[];
  raw_total: number | null;
  matched_supplier: { id: string; name: string } | null;
}

export interface SupplierSpendRow {
  supplier_id: string;
  supplier_name: string;
  total: number;
  order_count: number;
}
