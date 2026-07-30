import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { TabName, CartItem, Order, MenuItem, ScreenName, CanteenWithId } from '@/types';
import { userProfile } from '@/data/mockData';
import { getStoredToken, removeToken, storeToken } from '@/services/api';
import { getMe } from '@/services/auth';
import { buildPath, screenToPath } from '@/routes/paths';

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

/** Decode the JWT payload to extract the user role without a library.
 *  Also checks the `exp` claim so an expired token is treated as unauthenticated
 *  rather than briefly restoring a stale role. */
function decodeTokenRole(token: string): 'user' | 'canteen_owner' | 'admin' {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));

    // If the token has an expiration claim and it's in the past, clear it immediately
    // so initialState does NOT set isLoggedIn=true for a token that cannot be validated.
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      removeToken();
      return 'user';
    }

    if (payload.role && ['user', 'canteen_owner', 'admin'].includes(payload.role)) {
      return payload.role;
    }
  } catch {
    // Invalid token — default to 'user'
  }
  return 'user';
}

const storedToken = getStoredToken();

/** Derive the initial role directly from the JWT, not from static mock data.
 *  NOTE: decodeTokenRole may call removeToken() for expired tokens,
 *  so we must re-check localStorage after calling it. */
const initialRole = storedToken ? decodeTokenRole(storedToken) : 'user';

// Re-check token presence AFTER decodeTokenRole, which may have cleared an expired token.
// This ensures isLoggedIn/isAuthLoading are NOT true when the token was removed.
const tokenAfterDecode = getStoredToken();
const hasValidToken = !!tokenAfterDecode;

const initialState: AppState = {
  activeTab: 'home',
  selectedCanteenId: null,
  cart: [],
  orders: [],
  activeOrderId: null,
  tokenNumber: '',
  isOnboarded: false,
  isLoggedIn: hasValidToken,
  isAuthLoading: hasValidToken,
  token: tokenAfterDecode,
  toast: null,
  user: { ...userProfile, role: initialRole },
  groupTotal: 0,
  isGroupOrder: false,
  groupMembers: [],
  canteen: null,
  canteenId: null,
};

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_TAB': {
      return {
        ...state,
        activeTab: action.tab,
      };
    }
    case 'SELECT_CANTEEN':
      return { ...state, selectedCanteenId: action.id };
    case 'ADD_TO_CART': {
      const existing = state.cart.find(i => i.id === action.item.id);
      if (existing) {
        return {
          ...state,
          cart: state.cart.map(i =>
            i.id === action.item.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return { ...state, cart: [...state.cart, { ...action.item, quantity: 1 }] };
    }
    case 'REMOVE_FROM_CART':
      return { ...state, cart: state.cart.filter(i => i.id !== action.itemId) };
    case 'UPDATE_QUANTITY': {
      if (action.quantity <= 0) {
        return { ...state, cart: state.cart.filter(i => i.id !== action.itemId) };
      }
      return {
        ...state,
        cart: state.cart.map(i =>
          i.id === action.itemId ? { ...i, quantity: action.quantity } : i
        ),
      };
    }
    case 'CLEAR_CART':
      return { ...state, cart: [], groupTotal: 0, isGroupOrder: false, groupMembers: [] };
    case 'SET_ACTIVE_ORDER':
      return { ...state, activeOrderId: action.orderId, tokenNumber: action.token };
    case 'COMPLETE_ONBOARDING':
      return { ...state, isOnboarded: true };
    case 'SET_TOKEN':
      return { ...state, token: action.token, isLoggedIn: !!action.token };
    case 'LOGIN':
      return {
        ...state,
        isLoggedIn: true,
        activeTab: 'home',
        user: {
          ...state.user,
          name: action.name,
          phone: action.phone,
          email: action.email,
          role: action.role || 'user',
        },
        canteen: action.canteen ?? null,
        canteenId: action.canteen?._id ?? null,
      };
    case 'LOGOUT':
      return {
        ...state,
        isLoggedIn: false,
        token: null,
        tokenNumber: '',
        activeOrderId: null,
        cart: [],
        orders: [],
        activeTab: 'home',
        user: { ...userProfile },
        groupTotal: 0,
        isGroupOrder: false,
        groupMembers: [],
        canteen: null,
        canteenId: null,
      };
    case 'SHOW_TOAST':
      return { ...state, toast: { message: action.message, type: action.toastType } };
    case 'HIDE_TOAST':
      return { ...state, toast: null };
    case 'REORDER':
      return { ...state, cart: [...state.cart, ...action.order.items] };
    case 'SET_ORDER_STATUS':
      return {
        ...state,
        orders: state.orders.map(o =>
          o.id === action.orderId ? { ...o, status: action.status } : o
        ),
      };
    case 'UPDATE_WALLET':
      return { ...state, user: { ...state.user, walletBalance: state.user.walletBalance + action.amount } };
    case 'ADD_ORDER':
      return { ...state, orders: [action.order, ...state.orders] };
    case 'SET_ORDERS':
      return { ...state, orders: action.orders };
    case 'SET_GROUP_TOTAL':
      return { ...state, groupTotal: action.total };
    case 'SET_GROUP_DATA':
      return { ...state, groupTotal: action.total, isGroupOrder: true, groupMembers: action.members };
    case 'CLEAR_GROUP_DATA':
      return { ...state, groupTotal: 0, isGroupOrder: false, groupMembers: [] };
    case 'SET_USER':
      return { ...state, user: action.user };
    case 'RESTORE_AUTH':
      return { ...state, isAuthLoading: false };
    case 'SET_CANTEEN':
      return {
        ...state,
        canteen: action.canteen,
        canteenId: action.canteen?._id || null,
      };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
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

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const routerNavigate = useNavigate();

  // ─── Navigation bridge ──────────────────────────────
  // Maps legacy ScreenName values to URL paths so existing
  // screens that call navigate('home') still work.

  const navigate = useCallback(
    (screen: ScreenName, _direction?: 'push' | 'pop' | 'modal', params?: Record<string, string>) => {
      const path = screenToPath[screen];
      if (!path) return;
      routerNavigate(buildPath(path, params));
    },
    [routerNavigate],
  );

  const goBack = useCallback(() => {
    routerNavigate(-1);
  }, [routerNavigate]);

  const addToCart = useCallback((itemId: string, preloadedItem?: CartItem) => {
    const handleAdd = (item: MenuItem) => {
      if (state.cart.length > 0 && state.cart[0].canteenId !== item.canteenId) {
        dispatch({ type: 'SHOW_TOAST', message: 'Cart cleared for new canteen order', toastType: 'warning' });
        setTimeout(() => dispatch({ type: 'HIDE_TOAST' }), 3000);
        dispatch({ type: 'CLEAR_CART' });
        dispatch({ type: 'ADD_TO_CART', item: { ...item, quantity: 1 } });
      } else {
        dispatch({ type: 'ADD_TO_CART', item: { ...item, quantity: 1 } });
      }
    };

    if (preloadedItem) {
      handleAdd(preloadedItem);
      return;
    }
    // Fallback: fetch item from API
    import('@/services/menu').then(async ({ getMenuItemById, normalizeMenuItem }) => {
      try {
        const res = await getMenuItemById(itemId);
        const item = normalizeMenuItem(res.data);
        handleAdd(item);
      } catch {
        // Item not found via API; silently fail
      }
    });
  }, [state.cart]);

  const removeFromCart = useCallback((itemId: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', itemId });
  }, []);

  const updateQuantity = useCallback((itemId: string, qty: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', itemId, quantity: qty });
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'warning' | 'error' = 'success') => {
    dispatch({ type: 'SHOW_TOAST', message, toastType: type });
    setTimeout(() => dispatch({ type: 'HIDE_TOAST' }), 3000);
  }, []);

 const loginWithToken = useCallback(
  (
    token: string,
    user: {
      name: string;
      phone: string;
      email: string;
      role?: 'user' | 'canteen_owner' | 'admin';
    },
    canteen?: CanteenWithId | null
  ) => {
    storeToken(token);

    dispatch({ type: 'SET_TOKEN', token });

    dispatch({
      type: 'LOGIN',
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      canteen,
    });

    dispatch({ type: 'RESTORE_AUTH' });

    const role = user.role;

    if (role === 'admin') {
      routerNavigate('/admin/dashboard', { replace: true });
    } else if (role === 'canteen_owner') {
      routerNavigate('/canteen/dashboard', { replace: true });
    } else {
      routerNavigate('/home', { replace: true });
    }
  },
  [routerNavigate]
);
  const logout = useCallback(() => {
    removeToken();
    dispatch({ type: 'LOGOUT' });
    dispatch({ type: 'RESTORE_AUTH' });
    routerNavigate('/login', { replace: true });
  }, [routerNavigate]);

  // ─── Auth Restoration ─────────────────────────────
  // Runs once on mount to validate the stored token and hydrate
  // the full user profile (name, phone, email, role, canteen).
  // This is the SINGLE auth bootstrap for the entire application.

  useEffect(() => {
    if (!hasValidToken) {
      dispatch({ type: 'RESTORE_AUTH' });
      return;
    }

    getMe()
      .then((res) => {
        const { user: apiUser, canteen } = res.data;

        dispatch({
          type: 'SET_USER',
          user: {
            name: apiUser.name ?? '',
            phone: apiUser.phone ?? '',
            email: apiUser.email ?? '',
            walletBalance: apiUser.walletBalance ?? 0,
            streakDays: apiUser.streakDays ?? 0,
            totalOrders: apiUser.totalOrders ?? 0,
            totalSaved: apiUser.totalSaved ?? 0,
            role: apiUser.role ?? 'user',
          },
        });

        if (canteen) {
          dispatch({ type: 'SET_CANTEEN', canteen });
        }
      })
      .catch(() => {
        removeToken();
        dispatch({ type: 'LOGOUT' });
      })
      .finally(() => {
        dispatch({ type: 'RESTORE_AUTH' });
      });
  }, []);

  // ─── Global 401 (Unauthorized) Handler ───────────────
  // When the Axios interceptor detects a 401, this listener
  // forces a clean logout.

  useEffect(() => {
    const handleUnauthorized = () => {
      removeToken();
      dispatch({ type: 'LOGOUT' });
      dispatch({ type: 'RESTORE_AUTH' });
      routerNavigate('/login', { replace: true });
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [routerNavigate]);

  const cartTotal = state.cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const cartCount = state.cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <AppContext.Provider
      value={{
        state, dispatch, navigate, goBack, addToCart, removeFromCart,
        updateQuantity, showToast, cartTotal, cartCount,
        loginWithToken, logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
