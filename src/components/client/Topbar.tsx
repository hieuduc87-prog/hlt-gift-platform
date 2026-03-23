"use client";

import Link from "next/link";
import { Wallet, LogOut, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/formatters";

interface TopbarProps {
  userName: string;
  walletBalance: number;
}

export function Topbar({ userName, walletBalance }: TopbarProps) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-6">
      <div className="lg:hidden w-10" /> {/* spacer for mobile menu button */}

      <div className="flex-1" />

      <div className="flex items-center gap-4">
        {/* Wallet balance */}
        <Link
          href="/hoadinhky/wallet"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gold-bg text-gold hover:bg-gold-bg/80 transition-colors"
        >
          <Wallet size={16} />
          <span className="text-sm font-semibold">
            {formatPrice(walletBalance)}
          </span>
        </Link>

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 text-sm text-text-secondary hover:text-foreground transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold font-semibold text-xs">
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:inline">{userName}</span>
            <ChevronDown size={14} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-lg shadow-lg py-1 z-50">
              <Link
                href="/hoadinhky/settings"
                className="block px-4 py-2 text-sm text-text-secondary hover:bg-surface-hover"
                onClick={() => setDropdownOpen(false)}
              >
                Cài đặt
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-error hover:bg-surface-hover flex items-center gap-2"
              >
                <LogOut size={14} />
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
