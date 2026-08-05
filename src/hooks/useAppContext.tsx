import { createContext, useContext, type Dispatch } from 'react';
import type { TabName, CartItem, Order, ScreenName, CanteenWithId } from '@/types';
import type { userProfile } from '@/data/mockData';

interface GroupMemberData {
  name: string;
  avatar: string;
  color: string;
  itemCount: number;
  subtotal: number;
}

interface AppState {
  activeTab: TabName;
  selectedCanteenId: string | null;
  cart: CartItem[];
  orders: Order[];
  activeOrderId: string | null;
  tokenNumber: string;
  isOnboarded: boolean;
  isLoggedIn: boolean;
  isAuthLoading: boolean;
  token: string | null;
  toast: { message: string; type: 'success' | 'warning' | 'error' } | null;
  user: typeof userProfile;
  groupTotal: number;
  isGroupOrder: boolean;
  groupMembers: GroupMemberData[];
  canteen: CanteenWithId | null;
  canteenId: string | null;
}

type Action =
  | { type: 'SET_TAB'; tab: TabName }
  | { type: 'SELECT_CANTEEN'; id: string }
  | { type: 'ADD_TO_CART'; item: CartItem }
  | { type: 'REMOVE_FROM_CART'; itemId: string }
  | { type: 'UPDATE_QUANTITY'; itemId: string; quantity: number }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_ACTIVE_ORDER'; orderId: string; token: string }
  | { type: 'COMPLETE_ONBOARDING' }
  | { type: 'SET_TOKEN'; token: string | null }
  | { type: 'LOGIN'; name: string; phone: string; email: string; role?: 'user' | 'canteen_owner' | 'admin'; canteen?: CanteenWithId | null }
  | { type: 'LOGOUT' }
  | { type: 'SHOW_TOAST'; message: string; toastType: 'success' | 'warning' | 'error' }
  | { type: 'HIDE_TOAST' }
  | { type: 'REORDER'; order: Order }
  | { type: 'SET_ORDER_STATUS'; orderId: string; status: Order['status'] }
  | { type: 'UPDATE_WALLET'; amount: number }
  | { type: 'ADD_ORDER'; order: Order }
  | { type: 'SET_ORDERS'; orders: Order[] }
  | { type: 'SET_USER'; user: typeof userProfile }
  | { type: 'SET_GROUP_TOTAL'; total: number }
  | { type: 'SET_GROUP_DATA'; total: number; members: GroupMemberData[] }
  | { type: 'CLEAR_GROUP_DATA' }
  | { type: 'RESTORE_AUTH' }
  | { type: 'SET_CANTEEN'; canteen: CanteenWithId | null };

interface AppContextType {
  state: AppState;
  dispatch: Dispatch<Action>;
  navigate: (screen: ScreenName, direction?: 'push' | 'pop' | 'modal', params?: Record<string, string>) => void;
  goBack: () => void;
  addToCart: (itemId: string, preloadedItem?: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, qty: number) => void;
  showToast: (message: string, type?: 'success' | 'warning' | 'error') => void;
  cartTotal: number;
  cartCount: number;
  /** Perform a full login: store token, navigate to role-specific dashboard */
  loginWithToken: (token: string, user: { name: string; phone: string; email: string; role?: 'user' | 'canteen_owner' | 'admin' }, canteen?: CanteenWithId | null) => void;
  /** Clear all auth state and navigate to role selection */
  logout: () => void;
}

export const AppContext = createContext<AppContextType | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export type { AppState, Action, AppContextType, GroupMemberData };
