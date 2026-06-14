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
  total_spent: number;
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

export interface SupplierOrderItemRow {
  id: string;
  order_id: string;
  product_name: string;
  sku: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_id: string | null;
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
  items?: SupplierOrderItemRow[];
}

export interface PaginatedSupplierOrders {
  orders: SupplierOrderRow[];
  total: number;
}

export interface OrderLineItem {
  product_id?: string | null;
  product_name: string;
  sku?: string | null;
  quantity: number;
  unit_price: number;
}

export interface CreateOrderData {
  supplier_id: string;
  reference?: string;
  ordered_at?: string | null;
  expected_at?: string | null;
  notes?: string | null;
  items: OrderLineItem[];
}

export interface SupplierSpendRow {
  supplier_id: string;
  supplier_name: string;
  total: number;
  order_count: number;
}
