"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BarChart2, TrendingUp, BookOpen } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Placar", icon: BarChart2 },
  { href: "/pesquisas", label: "Pesquisas", icon: BookOpen },
  { href: "/tendencias", label: "Tendências", icon: TrendingUp },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-blue-700 text-lg">
            <BarChart2 className="w-5 h-5" />
            <span className="hidden sm:inline">Agregador Capixaba 2026</span>
            <span className="sm:hidden">ES26</span>
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  pathname.startsWith(href)
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden md:inline">{label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
