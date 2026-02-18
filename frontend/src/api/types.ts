/** API types matching backend schemas (camelCase). */

export interface RequestCreate {
  clientName: string;
  clientPhone: string;
  problemText: string;
  address?: string;
}

export interface RequestRead {
  id: number;
  clientName: string;
  clientPhone: string;
  problemText: string;
  address: string | null;
  status: string;
  assignedTo: number | null;
  assignedToUsername: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MasterOption {
  id: number;
  username: string;
}

export interface TokenResponse {
  accessToken: string;
  tokenType: string;
}

export interface UserRead {
  id: number;
  username: string;
  role: string;
  createdAt?: string;
}
