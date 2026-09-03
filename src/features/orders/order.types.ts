export type OrderStatus = "PENDING" | "PAID" | "DELIVERED" | "CANCELLED";

export type PaymentMethod = "CASH" | "TRANSFER" | "CARD" | "OTHER";

export type Seller = {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "SELLER";
};

export type Customer = {
  id: number;
  name: string;
  phone: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Product = {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  price: string;
  stock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type OrderItem = {
  id: number;
  customerOrderId: number;
  productId: number | null;
  skuSnapshot: string;
  nameSnapshot: string;
  descriptionSnapshot: string | null;
  unitPriceSnapshot: string;
  quantity: number;
  subtotal: string;
  isPaid: boolean;
  product: Product | null;
};

export type CustomerOrderPayment = {
  id: number;
  customerOrderId: number;
  amount: string;
  method: PaymentMethod;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CustomerOrder = {
  id: number;
  orderId: number;
  customerId: number;
  total: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  customer: Customer;
  items: OrderItem[];
  payments: CustomerOrderPayment[];
};

export type Order = {
  id: number;
  sellerId: number;
  total: string;
  status: OrderStatus;
  purchaseDate: string;
  deliveryDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  seller: Seller;
  customerOrders: CustomerOrder[];
};

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type CreateCustomerOrderPaymentRequest = {
  amount: number;
  method: PaymentMethod;
  notes?: string | null;
};