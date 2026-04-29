export type Auth = {
  username: string;
  fullname: string;
  email: string;
  avatar: string;
  bio?: string;
  phoneNumber?: string;
}

export type User = {
  id: string;
  email: string;
  role: 'ADMIN' | 'USER';
  isSeller: boolean;
  status: 'ACTIVE' | 'BAN';
  createdAt: string;
  // Optional profile fields if available
  fullName?: string;
  contactPhone?: string;
  contactEmail?: string;
  gender?: string;
  birthdate?: string;
  avatarUrl?: string;
  bio?: string;
  address?: string;
  updatedAt?: string;
}

export type Contribute = {
  date: string;
  count?: number;
  color: string;
  intensity: number;
}

export type ContributeYear = {
  year: string;
  total: number;
  range: {
    start: string;
    end: string;
  }
}

export type TaskCols = "data-structures" | "algorithms" | "techniques";

export type TaskType = {
  id: string;
  title: string;
  column: TaskCols;
}

export type Product = {
  id: string;
  productNumber: string;
  cost: number;
  profit: number;
  revenue: number;
  customerEmail: string;
  merchantName: string;
  receiptStatus: 'not_received' | 'received';
  paymentStatus: 'not_paid' | 'paid';
  orderTime: string;
}

export type Team = {
  id: string;
  name: string;
  description: string | null;
  thumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export type Member = {
  id: string;
  teamId: string;
  name: string;
  description: string | null;
  thumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export type Policy = {
  id: string;
  title: string;
  description: string;
  isActive: "TRUE" | "FALSE";
  createdAt: string;
  updatedAt: string;
}

export type FAQ = {
  id: string;
  question: string;
  answer: string;
  isActive: "TRUE" | "FALSE";
  createdAt: string;
  updatedAt: string;
}

export type Setting = {
  key: string;
  value: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}
