export const CUSTOMER_ROUTES = {
  root: "/customer",
  home: "/customer/home",
  dashboard: "/customer/dashboard",
  shop: "/customer/shop",
  tryOn: "/customer/try-on",
  favorites: "/customer/favorites",
  account: "/customer/account",
  productDetails: (productId: string) => `/customer/products/${productId}`,
  login: "/login/customer",
  signup: "/signup/customer",
} as const;

export type CustomerRouteKey = keyof typeof CUSTOMER_ROUTES;
export type CustomerRoutePath = (typeof CUSTOMER_ROUTES)[CustomerRouteKey];
