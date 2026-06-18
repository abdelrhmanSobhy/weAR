export const customerTheme = {
  // Page
  page: "bg-[#fef7f0] text-[#2F2925]",
  pageMuted: "bg-[#f5ede6]",

  // Typography
  primaryText: "text-[#954c2a]",
  accentText: "text-[#9c6b54]",
  darkText: "text-[#2F2925]",
  mutedText: "text-[#6F625B]",
  headingFont: "font-['Playfair_Display']",
  logoFont: "font-['Allura']",

  // Backgrounds
  primaryBg: "bg-[#954c2a]",
  primaryHover: "hover:bg-[#7d3e23]",
  accentBg: "bg-[#9c6b54]",
  accentHover: "hover:bg-[#7d5643]",
  navBg: "bg-[#fef7f0]",
  announcementBar: "bg-[#c9a07a] text-white",
  footerBg: "bg-[#f0e4d8]",

  // Cards
  card: "rounded-2xl border border-[#e8ddd5] bg-white shadow-sm",
  softCard: "rounded-xl border border-[#e8ddd5] bg-white/80",

  // Buttons
  btnPrimary: "bg-[#9c6b54] text-white hover:bg-[#7d5643] rounded-lg",
  btnOutline: "border border-[#954c2a] text-[#954c2a] hover:bg-[#fef7f0] rounded-lg",

  // Layout
  container: "mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-10",
  sectionY: "py-10 sm:py-14",

  // Focus
  focusRing:
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#954c2a] focus-visible:ring-offset-2",
} as const;
