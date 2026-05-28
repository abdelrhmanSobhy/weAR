import { useState, useRef, useEffect } from "react";
import { Search, Menu, ChevronDown, PlusCircle, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/features/auth/useAuthStore";
import { NotificationDropdown } from "./NotificationDropdown";

interface RetailerTopNavProps {
  onOpenSidebar: () => void;
}

export function RetailerTopNav({ onOpenSidebar }: RetailerTopNavProps) {
  const { user, logout } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="flex h-[80px] shrink-0 items-center justify-between border-b border-[#E4DCD1] bg-white px-4 md:px-8 z-40">
      <div className="flex flex-1 items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-[#949E96] hover:text-[#B6A092]"
          onClick={onOpenSidebar}
        >
          <Menu size={24} />
        </Button>

        <div className="relative hidden md:block w-full max-w-[800px]">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C9A390]"
            size={18}
          />
          <Input
            type="text"
            placeholder="Search for..."
            className="h-[42px] w-full rounded-[10px] border-[0.6px] border-[#B6A092] bg-white pl-11 pr-4 text-[14px] text-[#949E96] focus-visible:ring-1 focus-visible:ring-[#B6A092] placeholder:text-[#BFC7DE] shadow-none"
            style={{ fontFamily: '"Hanuman", sans-serif' }}
          />
        </div>
      </div>

      <div className="flex items-center gap-6 ml-4">
        <NotificationDropdown retailerId={user?.id || ""} />

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 p-1 pr-2 rounded-[10px] hover:bg-[#F5F1EF] transition-colors border border-transparent"
          >
            <div className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[#B6A092] text-white font-bold shadow-sm overflow-hidden">
              {user?.brandLogoUrl ? (
                <img
                  src={user.brandLogoUrl}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-[15px]">
                  {(user?.fullName || user?.brandName || "M")
                    .charAt(0)
                    .toUpperCase()}
                </span>
              )}
            </div>

            <div className="hidden md:flex items-center gap-2">
              <span className="text-[14px] font-bold text-[#949E96] font-sans">
                {user?.fullName || user?.brandName || "Mohamed Ahmed"}
              </span>
              <ChevronDown
                size={16}
                className={`text-[#949E96] transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
              />
            </div>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-[16px] border border-[#E4DCD1] bg-white p-2 shadow-lg animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-2 border-b border-[#F0EDEB] mb-1">
                <p className="text-[13px] font-bold text-[#B6A092]">
                  My Accounts
                </p>
              </div>

              <button className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-[14px] font-medium text-[#949E96] hover:bg-[#F5F1EF] hover:text-[#B6A092] transition-colors">
                <PlusCircle size={18} />
                Add Account
              </button>

              <button
                onClick={logout}
                className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-[14px] font-medium text-[#E57A7A] hover:bg-red-50 transition-colors mt-1"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
