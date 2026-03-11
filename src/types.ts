export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  currency: string;
  theme: 'light' | 'dark';
}

export interface Transaction {
  id?: string;
  uid: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  type: 'income' | 'expense';
  paymentMethod?: string;
  observation?: string;
}

export interface FixedExpense {
  id?: string;
  uid: string;
  name: string;
  amount: number;
  category: string;
  dueDay: number;
  status: 'paid' | 'pending';
}

export interface CreditCard {
  id?: string;
  uid: string;
  name: string;
  brand: string;
  limit: number;
  closingDay: number;
  dueDay: number;
}

export interface CardPurchase {
  id?: string;
  uid: string;
  cardId: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  installments?: number;
  isInstallment?: boolean;
}

export interface Category {
  id?: string;
  uid: string;
  name: string;
  type: 'income' | 'expense' | 'card';
  color?: string;
  icon?: string;
}
