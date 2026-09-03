export type Customer = {
  id: number;
  name: string;
  phone: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateCustomerRequest = {
  name: string;
  phone?: string | null;
  notes?: string | null;
};

export type UpdateCustomerRequest = {
  id: number;
  data: {
    name: string;
    phone?: string | null;
    notes?: string | null;
  };
};

export type UpdateCustomerStatusRequest = {
  id: number;
  isActive: boolean;
};

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};