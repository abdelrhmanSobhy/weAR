import React from "react";
import { cn } from "@/lib/utils";
import { customerTheme } from "@/features/customer/styles/customerTheme";
import logoImage from "@/assets/auth/logo.webp";

interface CustomerAuthLayoutProps {
  children: React.ReactNode;
  imageSrc: string;
  imageAlt: string;
}

function WeArLogoAuth() {
  return (
    <div className="flex items-center gap-1">
      <div className="h-15 w-16.25 overflow-hidden">
        <img src={logoImage} alt="weAR logo" className="h-full w-full object-contain" />
      </div>
      <span
        className={cn("text-[28px] leading-none", customerTheme.logoFont)}
        style={{ color: "#9f8062" }}
      >
        weAR
      </span>
    </div>
  );
}

export function CustomerAuthLayout({ children, imageSrc, imageAlt }: CustomerAuthLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-white flex flex-col">
      {/* Logo */}
      <div className="px-8 pt-6">
        <WeArLogoAuth />
      </div>

      {/* Content */}
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="flex w-full max-w-275 gap-8 md:gap-12 items-stretch">

          {/* Form card */}
          <section
            className="w-full shrink-0 rounded-2xl border border-[#e8ddd5] bg-white px-8 py-10 md:w-120 md:px-10"
            style={{ boxShadow: "0 4px 24px rgba(156,107,84,0.10)" }}
          >
            {children}
          </section>

          {/* Illustration */}
          <section className="hidden flex-1 overflow-hidden rounded-2xl bg-[#f5ede6] md:block">
            <img
              src={imageSrc}
              alt={imageAlt}
              className="h-full w-full object-cover"
            />
          </section>
        </div>
      </div>

      {/* Bottom */}
      <div className="pb-6 text-center text-[12px] text-[#9c6b54]">
        © 2025 ALL RIGHTS RESERVED
      </div>
    </div>
  );
}
