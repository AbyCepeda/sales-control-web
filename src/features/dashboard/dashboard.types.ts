export type OrderStatus = "PENDING" | "PAID" | "DELIVERED" | "CANCELLED";

export type DashboardCustomerOrder = {
  id: number;
  total: string;
  customer: {
    id: number;
    name: string;
    phone: string | null;
  };
  payments: {
    id: number;
    amount: string;
    method: string;
    notes: string | null;
    createdAt: string;
  }[];
};

export type DashboardRecentOrder = {
  id: number;
  total: string;
  status: OrderStatus;
  purchaseDate: string;
  deliveryDate: string | null;
  createdAt: string;
  seller: {
    id: number;
    name: string;
    email: string;
  };
  customerOrders: DashboardCustomerOrder[];
};

export type DashboardSummary = {
  totalOrders: number;
  pendingOrders: number;
  paidOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;

  activeProducts: number;
  activeCustomers: number;

  totalRevenue: string;
  totalPaid: string;
  totalPending: string;
  todayPayments: string;

  recentOrders: DashboardRecentOrder[];
};

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};