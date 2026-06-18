import { Link } from "react-router-dom";
import { Heart, Shirt, Sparkles } from "lucide-react";
import { CUSTOMER_ROUTES } from "@/features/customer/routes/customerRoutes";
import { customerTheme } from "@/features/customer/styles/customerTheme";
import { cn } from "@/lib/utils";

const VALUES = [
  {
    icon: Sparkles,
    title: "Fit-First Technology",
    description: "Our AR try-on engine maps garments to your body so you can explore fashion with real confidence before you commit.",
  },
  {
    icon: Shirt,
    title: "Curated Selection",
    description: "Every retailer on weAR is vetted for quality and transparency. You browse less noise and discover more things you'll actually wear.",
  },
  {
    icon: Heart,
    title: "Style on Your Terms",
    description: "Save favourites, build wishlists, and come back to your shortlist whenever inspiration strikes. Your wardrobe, your pace.",
  },
];

const TEAM = [
  { name: "Amira Khalil", role: "Co-founder & CEO" },
  { name: "Karim Mansour", role: "Co-founder & CTO" },
  { name: "Nour El-Din", role: "Head of Product" },
  { name: "Yasmine Farouk", role: "Head of Retail Partnerships" },
];

export function CustomerAboutPage() {
  return (
    <div className="space-y-16">

      {/* Hero */}
      <section
        className="-mx-4 overflow-hidden sm:-mx-6 lg:-mx-10"
        aria-labelledby="about-heading"
      >
        <div
          className="px-6 py-20 text-center sm:px-12 sm:py-24"
          style={{ background: "linear-gradient(135deg, #fef7f0 0%, #f5ede6 50%, #edddd0 100%)" }}
        >
          <p className="mb-3 text-[13px] font-medium uppercase tracking-widest text-[#9c6b54]">
            Our story
          </p>
          <h1
            id="about-heading"
            className={cn("mb-6 text-[42px] font-normal leading-tight text-[#2F2925] sm:text-[52px]", customerTheme.headingFont)}
          >
            Fashion discovery,
            <br />
            <em>reinvented.</em>
          </h1>
          <p className="mx-auto max-w-2xl text-[17px] leading-relaxed text-[#6F625B]">
            weAR started from a simple frustration: online shopping asks you to imagine how clothes will look on you. We built the technology to show you instead.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="grid gap-12 lg:grid-cols-2 lg:items-center" aria-labelledby="mission-heading">
        <div>
          <p className="mb-2 text-[13px] font-medium uppercase tracking-widest text-[#9c6b54]">Mission</p>
          <h2 id="mission-heading" className={cn("mb-5 text-[32px] font-normal text-[#2F2925]", customerTheme.headingFont)}>
            What we&rsquo;re building
          </h2>
          <p className="mb-4 text-[16px] leading-relaxed text-[#6F625B]">
            We&rsquo;re creating a storefront where augmented reality closes the gap between inspiration and purchase. Customers should be able to see themselves in a garment — not a generic model — before they decide.
          </p>
          <p className="text-[16px] leading-relaxed text-[#6F625B]">
            By combining accurate fit data with a carefully curated retailer network, we aim to make returns the exception rather than the rule and help people build wardrobes they genuinely love.
          </p>
        </div>
        <div
          className="flex items-center justify-center rounded-3xl p-12"
          style={{ background: "linear-gradient(135deg, #f5ede6 0%, #edddd0 100%)" }}
          aria-hidden="true"
        >
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white/60">
            <Sparkles className="h-14 w-14 text-[#9c6b54]" />
          </div>
        </div>
      </section>

      {/* Values */}
      <section aria-labelledby="values-heading">
        <div className="mb-10 text-center">
          <p className="mb-2 text-[13px] font-medium uppercase tracking-widest text-[#9c6b54]">What we stand for</p>
          <h2 id="values-heading" className={cn("text-[32px] font-normal text-[#2F2925]", customerTheme.headingFont)}>
            Our values
          </h2>
        </div>
        <ul className="grid gap-6 sm:grid-cols-3" role="list">
          {VALUES.map((v) => (
            <li key={v.title} className="rounded-2xl border border-[#e8ddd5] bg-white p-6">
              <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#fef7f0]">
                <v.icon className="h-6 w-6 text-[#9c6b54]" aria-hidden="true" />
              </span>
              <h3 className={cn("mb-2 text-[16px] font-medium text-[#2F2925]", customerTheme.headingFont)}>{v.title}</h3>
              <p className="text-[14px] leading-relaxed text-[#6F625B]">{v.description}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Team */}
      <section aria-labelledby="team-heading">
        <div className="mb-10 text-center">
          <p className="mb-2 text-[13px] font-medium uppercase tracking-widest text-[#9c6b54]">The people</p>
          <h2 id="team-heading" className={cn("text-[32px] font-normal text-[#2F2925]", customerTheme.headingFont)}>
            Meet the team
          </h2>
        </div>
        <ul className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2" role="list">
          {TEAM.map((member) => (
            <li key={member.name} className="flex items-center gap-4 rounded-2xl border border-[#e8ddd5] bg-white p-5">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#fef7f0] text-[18px] font-semibold text-[#9c6b54]"
                aria-hidden="true"
              >
                {member.name.charAt(0)}
              </span>
              <div>
                <p className="font-semibold text-[#2F2925]">{member.name}</p>
                <p className="text-[13px] text-[#9c6b54]">{member.role}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* CTA */}
      <section
        className="rounded-3xl px-8 py-16 text-center"
        style={{ background: "linear-gradient(135deg, #3d2015 0%, #9c6b54 100%)" }}
        aria-labelledby="about-cta-heading"
      >
        <h2 id="about-cta-heading" className={cn("mb-3 text-[32px] font-normal text-white", customerTheme.headingFont)}>
          Ready to explore?
        </h2>
        <p className="mb-8 text-[16px] text-white/75">Browse the curated shop or try on something new.</p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to={CUSTOMER_ROUTES.shop}
            className={cn("inline-flex items-center rounded-full bg-white px-8 py-3 text-[15px] font-semibold text-[#6b3120] transition-opacity hover:opacity-90", customerTheme.focusRing)}
          >
            Browse Shop
          </Link>
          <Link
            to={CUSTOMER_ROUTES.tryOn}
            className={cn("inline-flex items-center rounded-full border border-white/50 px-8 py-3 text-[15px] font-medium text-white transition-colors hover:bg-white/10", customerTheme.focusRing)}
          >
            Try On Now
          </Link>
        </div>
      </section>

    </div>
  );
}
