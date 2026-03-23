"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

export function ClientSearch({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function applySearch(q: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (q.trim()) {
      params.set("q", q.trim());
    } else {
      params.delete("q");
    }
    router.push(`/admin/clients?${params.toString()}`);
  }

  function handleChange(q: string) {
    setValue(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      applySearch(q);
    }, 400);
  }

  function handleClear() {
    setValue("");
    applySearch("");
  }

  return (
    <div className="relative max-w-md">
      <Search
        size={16}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-admin-text-secondary"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Tìm kiếm theo tên, email, SĐT..."
        className="w-full pl-10 pr-9 py-2.5 bg-[#1A1A1A] border border-admin-border text-admin-text text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold placeholder:text-admin-text-secondary/50"
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-admin-text-secondary hover:text-admin-text"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
