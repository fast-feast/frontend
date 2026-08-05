import { useReducer, useCallback, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CartItem, MenuItem, ScreenName, CanteenWithId } from '@/types';
import { userProfile } from '@/data/mockData';
import { getStoredToken, removeToken, storeToken } from '@/services/api';
import { getMe } from '@/services/auth';
import { buildPath, screenToPath, ROUTES } from '@/routes/paths';
import { AppContext, type Action, type AppState } from '@/hooks/useAppContext';

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

export function AppProvider({ children }: { children: ReactNode }) {
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
  /**
   * Clear all auth state and return to the login screen of the app the
   * current session belonged to (student → /login, canteen → /canteen/login,
   * admin → /admin/login). The role is captured BEFORE the logout dispatch
   * clears the user state.
   */
  const logout = useCallback(() => {
    const role = state.user.role;
    removeToken();
    dispatch({ type: 'LOGOUT' });
    dispatch({ type: 'RESTORE_AUTH' });
    const target =
      role === 'admin' ? ROUTES.ADMIN_LOGIN
      : role === 'canteen_owner' ? ROUTES.LOGIN_CANTEEN
      : ROUTES.LOGIN;
    routerNavigate(target, { replace: true });
  }, [routerNavigate, state.user.role]);

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
      // logout() clears the token/state and routes to the login screen of
      // the current session's app (role is captured before state is cleared).
      logout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [logout]);

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
