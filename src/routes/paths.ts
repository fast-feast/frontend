import type { ScreenName } from '@/types';

/**
 * URL path constants for every screen.
 * These are the canonical paths used throughout the app.
 */
export const ROUTES = {
  ROOT: '/',
  ONBOARDING: '/onboarding',
  LOGIN: '/login',
  LOGIN_CANTEEN: '/canteen/login',
  HOME: '/home',
  ALL_CANTEENS: '/all-canteens',
  CANTEEN_DETAIL: '/canteen/:canteenId',
  CART: '/cart',
  PAYMENT: '/payment',
  ORDER_SUCCESS: '/order-success',
  ORDER_TRACKING: '/order-tracking/:orderId',
  ORDERS: '/orders',
  GROUP_ORDER: '/group-order',
  OFFERS: '/offers',
  PROFILE: '/profile',
  CANTEEN_DASHBOARD: '/canteen/dashboard',
  MENU_MANAGEMENT: '/canteen/menu',
  CANTEEN_SETTINGS: '/canteen/settings',
  ADMIN_LOGIN: '/admin/login',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_USERS: '/admin/users',
  ADMIN_CANTEENS: '/admin/canteens',
  ADMIN_ORDERS: '/admin/orders',
} as const;

/**
 * Maps the legacy ScreenName enum to URL paths.
 * Used by the AppContext navigate() bridge so existing screens
 * that call navigate('home') still work after the React Router migration.
 */
export const screenToPath: Record<ScreenName, string> = {
  splash: ROUTES.ROOT,
  onboarding: ROUTES.ONBOARDING,
  login: ROUTES.LOGIN,
  home: ROUTES.HOME,
  allCanteens: ROUTES.ALL_CANTEENS,
  canteenDetail: ROUTES.CANTEEN_DETAIL,
  cart: ROUTES.CART,
  payment: ROUTES.PAYMENT,
  orderSuccess: ROUTES.ORDER_SUCCESS,
  orderTracking: ROUTES.ORDER_TRACKING,
  orders: ROUTES.ORDERS,
  groupOrder: ROUTES.GROUP_ORDER,
  offers: ROUTES.OFFERS,
  profile: ROUTES.PROFILE,
  canteenDashboard: ROUTES.CANTEEN_DASHBOARD,
  menuManagement: ROUTES.MENU_MANAGEMENT,
  canteenSettings: ROUTES.CANTEEN_SETTINGS,
  admin: ROUTES.ADMIN_DASHBOARD,
};

/**
 * Builds a dynamic path with params substituted.
 * e.g. path('/canteen/:canteenId', { canteenId: 'abc' }) → '/canteen/abc'
 */
export function buildPath(
  template: string,
  params?: Record<string, string>,
): string {
  if (!params) return template;
  let result = template;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(`:${key}`, encodeURIComponent(value));
  }
  return result;
}
