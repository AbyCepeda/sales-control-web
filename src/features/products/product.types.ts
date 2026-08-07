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

export type CreateProductRequest = {
  sku: string;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
};

export type UpdateProductRequest = {
  id: number;
  data: {
    sku: string;
    name: string;
    description?: string | null;
    price: number;
    stock: number;
  };
};

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};