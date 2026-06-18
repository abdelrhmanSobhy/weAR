import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import logoImage from "@/assets/auth/logo.webp";
import {
  Facebook,
  Heart,
  Instagram,
  Layers,
  Linkedin,
  LogOut,
  MapPin,
  Menu,
  Search,
  ShoppingCart,
  Shirt,
  Sparkles,
  Twitter,
  User,
  X,
  Youtube,
} from "lucide-react";
import { useAuthStore } from "@/features/auth/useAuthStore";
import { useCartStore } from "@/features/customer/cart/useCartStore";
import { computeItemCount } from "@/features/customer/cart/types/cart";
import { CUSTOMER_ROUTES } from "@/features/customer/routes/customerRoutes";
import { customerTheme } from "@/features/customer/styles/customerTheme";
import { customerAuthApi } from "@/features/customer/api/customerAuth.api";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Home", to: CUSTOMER_ROUTES.home },
  { label: "Shop", to: CUSTOMER_ROUTES.shop },
  { label: "Try On AR", to: CUSTOMER_ROUTES.tryOn },
  { label: "About", to: CUSTOMER_ROUTES.about },
  { label: "Blog", to: CUSTOMER_ROUTES.blog },
] as const;

const USER_MENU = [
  { label: "My Profile", to: CUSTOMER_ROUTES.account, icon: User },
  { label: "My Avatar", to: CUSTOMER_ROUTES.avatar, icon: Shirt },
  { label: "Wardrobe", to: CUSTOMER_ROUTES.wardrobeCollections, icon: Layers },
  { label: "My Outfits", to: CUSTOMER_ROUTES.outfits, icon: Layers },
  { label: "AI Suggestions", to: CUSTOMER_ROUTES.aiSuggestions, icon: Sparkles },
  { label: "Try-On History", to: CUSTOMER_ROUTES.tryOnHistory, icon: Shirt },
  { label: "Addresses", to: CUSTOMER_ROUTES.addresses, icon: MapPin },
] as const;

const FOOTER_SHOP = ["Women", "Men", "Gen-Z", "All"];
const FOOTER_CARE = ["Shipping & Returns", "FAQ", "Track Order", "Exchange Policy"];
const FOOTER_COMPANY = ["About Us", "Brand Value", "Blogs", "Careers"];

function WeArLogo({ onClick, size = "md" }: { onClick?: () => void; size?: "sm" | "md" }) {
  const imgClass = size === "sm" ? "h-[50px] w-[55px]" : "h-[60px] w-[65px]";
  const textSize = size === "sm" ? "text-[28px]" : "text-[32px]";
  return (
    <Link
      to={CUSTOMER_ROUTES.home}
      onClick={onClick}
      className={cn("flex shrink-0 items-center gap-1", customerTheme.focusRing)}
      aria-label="weAR home"
    >
      <div className={cn("overflow-hidden", imgClass)}>
        <img src={logoImage} alt="weAR logo" className="h-full w-full object-contain" />
      </div>
      <span
        className={cn(textSize, "leading-none tracking-wide", customerTheme.logoFont)}
        style={{ color: "#9f8062" }}
      >
        weAR
      </span>
    </Link>
  );
}

export function CustomerLayout() {
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const cartItems = useCartStore((s) => s.items);
  const cartCount = computeItemCount(cartItems);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  /* Close mobile menu on Escape */
  useEffect(() => {
    if (!mobileOpen && !userMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setUserMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen, userMenuOpen]);

  /* Close user dropdown on outside click */
  useEffect(() => {
    if (!userMenuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [userMenuOpen]);

  const signOut = async () => {
    setUserMenuOpen(false);
    setMobileOpen(false);
    try { await customerAuthApi.logout(); } catch { /* continue */ }
    finally { logout(); navigate(CUSTOMER_ROUTES.login, { replace: true }); }
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "font-['Playfair_Display'] text-[17px] font-normal tracking-wide transition-colors px-2 py-1",
      customerTheme.focusRing,
      isActive
        ? "text-[#954c2a] border-b-2 border-[#954c2a]"
        : "text-[#954c2a] hover:text-[#7d3e23]",
    );

  return (
    <div className={cn("flex min-h-screen flex-col", customerTheme.page)}>

      {/* Announcement bar */}
      <div className={cn("py-1.5 text-center text-[13px] font-medium", customerTheme.announcementBar)}>
        Enjoy Free Shipping In Your Order
      </div>

      {/* ── Header ── */}
      <header className={cn(
        "sticky top-0 z-40 border-b border-[#e8ddd5] shadow-[0_1px_3px_rgba(0,0,0,0.07)]",
        customerTheme.navBg,
      )}>
        <div className={cn("flex h-18 items-center justify-between gap-4", customerTheme.container)}>

          {/* Logo */}
          <WeArLogo onClick={() => setMobileOpen(false)} />

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
            {NAV_LINKS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === CUSTOMER_ROUTES.home}
                className={navLinkClass}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <button
              type="button"
              aria-label="Search"
              className={cn("hidden text-[#954c2a] transition-colors hover:text-[#7d3e23] sm:block", customerTheme.focusRing)}
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Favorites */}
            <button
              type="button"
              aria-label="Favorites"
              onClick={() => navigate(CUSTOMER_ROUTES.favorites)}
              className={cn("text-[#954c2a] transition-colors hover:text-[#7d3e23]", customerTheme.focusRing)}
            >
              <Heart className="h-5 w-5" />
            </button>

            {/* Cart */}
            <button
              type="button"
              aria-label={cartCount > 0 ? `Cart (${cartCount} items)` : "Cart"}
              onClick={() => navigate(CUSTOMER_ROUTES.cart)}
              className={cn("relative text-[#954c2a] transition-colors hover:text-[#7d3e23]", customerTheme.focusRing)}
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span
                  className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#954c2a] text-[10px] font-bold text-white"
                  aria-hidden="true"
                >
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </button>

            {/* User dropdown */}
            <div className="relative hidden sm:block" ref={userMenuRef}>
              <button
                type="button"
                aria-label="Account menu"
                aria-expanded={userMenuOpen}
                onClick={() => setUserMenuOpen((o) => !o)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border border-transparent px-2 py-1 text-[#954c2a] transition-colors hover:border-[#e8ddd5] hover:bg-[#fef7f0]",
                  userMenuOpen && "border-[#e8ddd5] bg-[#fef7f0]",
                  customerTheme.focusRing,
                )}
              >
                <User className="h-5 w-5" />
                {user?.fullName && (
                  <span className="max-w-20 truncate text-[13px] font-medium">
                    {user.fullName.split(" ")[0]}
                  </span>
                )}
              </button>

              {/* Dropdown panel */}
              {userMenuOpen && (
                <div
                  className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-[#e8ddd5] bg-white shadow-xl"
                  role="menu"
                  aria-label="User menu"
                >
                  {user && (
                    <div className="border-b border-[#e8ddd5] px-4 py-3">
                      <p className="truncate text-[13px] font-semibold text-[#2F2925]">{user.fullName}</p>
                      <p className="truncate text-[12px] text-[#9c6b54]">{user.email}</p>
                    </div>
                  )}
                  <div className="py-1">
                    {USER_MENU.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        role="menuitem"
                        onClick={() => setUserMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2.5 text-[14px] text-[#2F2925] transition-colors hover:bg-[#fef7f0] hover:text-[#954c2a]",
                          customerTheme.focusRing,
                        )}
                      >
                        <item.icon className="h-4 w-4 shrink-0 text-[#9c6b54]" />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                  <div className="border-t border-[#e8ddd5] py-1">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => void signOut()}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-2.5 text-[14px] text-red-600 transition-colors hover:bg-red-50",
                        customerTheme.focusRing,
                      )}
                    >
                      <LogOut className="h-4 w-4 shrink-0" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              type="button"
              className={cn("text-[#954c2a] hover:text-[#7d3e23] lg:hidden", customerTheme.focusRing)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((o) => !o)}
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className={cn("border-t border-[#e8ddd5] lg:hidden", customerTheme.navBg)}>
            <nav aria-label="Mobile navigation" className={cn("flex flex-col gap-0.5 py-4", customerTheme.container)}>
              {/* Main nav links */}
              {NAV_LINKS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === CUSTOMER_ROUTES.home}
                  className={navLinkClass}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}

              {/* Divider */}
              <div className="my-2 h-px bg-[#e8ddd5]" />

              {/* User pages */}
              {USER_MENU.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-2 py-2.5 text-[15px] text-[#6F625B] transition-colors hover:bg-[#fef7f0] hover:text-[#954c2a]",
                    customerTheme.focusRing,
                  )}
                >
                  <item.icon className="h-4 w-4 text-[#9c6b54]" />
                  {item.label}
                </Link>
              ))}

              <Link
                to={CUSTOMER_ROUTES.favorites}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-2 py-2.5 text-[15px] text-[#6F625B] transition-colors hover:bg-[#fef7f0] hover:text-[#954c2a]",
                  customerTheme.focusRing,
                )}
              >
                <Heart className="h-4 w-4 text-[#9c6b54]" />
                Favorites
              </Link>

              {/* Sign out */}
              <button
                type="button"
                onClick={() => void signOut()}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-2 py-2.5 text-left text-[15px] text-red-600 transition-colors hover:bg-red-50",
                  customerTheme.focusRing,
                )}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* ── Main content ── */}
      <main className={cn("flex-1", customerTheme.container, "py-8 sm:py-10")}>
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <footer className={cn("mt-auto", customerTheme.footerBg)} aria-label="Footer">
        <div className={cn("grid gap-8 py-12 md:grid-cols-[1.6fr_1fr_1fr_1fr_1.2fr]", customerTheme.container)}>

          {/* Brand */}
          <div className="space-y-4">
            <WeArLogo size="sm" />
            <p className="max-w-50 text-[13px] leading-relaxed text-[#6F625B]">
              Where Every Find Fits Perfectly and Every Style Tells Your Story
            </p>
            <div className="flex gap-3" aria-label="Social media">
              {[Facebook, Twitter, Instagram, Linkedin, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className={cn("text-[#9c6b54] transition-colors hover:text-[#954c2a]", customerTheme.focusRing)}
                  aria-label={["Facebook", "Twitter", "Instagram", "LinkedIn", "YouTube"][i]}
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div>
            <p className="mb-3 font-['Playfair_Display'] text-[15px] font-semibold text-[#2F2925]">Shop</p>
            <ul className="space-y-2">
              {FOOTER_SHOP.map((item) => (
                <li key={item}>
                  <Link to={CUSTOMER_ROUTES.shop} className={cn("text-[13px] text-[#6F625B] transition-colors hover:text-[#954c2a]", customerTheme.focusRing)}>
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Care */}
          <div>
            <p className="mb-3 font-['Playfair_Display'] text-[15px] font-semibold text-[#2F2925]">Care</p>
            <ul className="space-y-2">
              {FOOTER_CARE.map((item) => (
                <li key={item}>
                  <Link to={CUSTOMER_ROUTES.shippingReturns} className={cn("text-[13px] text-[#6F625B] transition-colors hover:text-[#954c2a]", customerTheme.focusRing)}>
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="mb-3 font-['Playfair_Display'] text-[15px] font-semibold text-[#2F2925]">Our Company</p>
            <ul className="space-y-2">
              {FOOTER_COMPANY.map((item) => (
                <li key={item}>
                  <Link to={CUSTOMER_ROUTES.about} className={cn("text-[13px] text-[#6F625B] transition-colors hover:text-[#954c2a]", customerTheme.focusRing)}>
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacts */}
          <div>
            <p className="mb-3 font-['Playfair_Display'] text-[15px] font-semibold text-[#2F2925]">Contact us</p>
            <ul className="space-y-2 text-[13px] text-[#6F625B]">
              <li>✉ contact@company.com</li>
              <li>✆ (414) 687 – 5892</li>
              <li>⊙ 794 Mcallister St<br />San Francisco, 94102</li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className={cn("border-t border-[#e0d4cb] py-4", customerTheme.container)}>
          <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] text-[#9c6b54]">
            <span>© 2026 ALL RIGHTS RESERVED</span>
            <span className="flex gap-3">
              <a href="#" className={cn("hover:text-[#954c2a]", customerTheme.focusRing)}>Terms and Conditions</a>
              <a href="#" className={cn("hover:text-[#954c2a]", customerTheme.focusRing)}>Privacy Policy</a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
