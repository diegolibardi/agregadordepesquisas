"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BarChart2, BookOpen } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Placar", icon: BarChart2 },
  { href: "/pesquisas", label: "Pesquisas", icon: BookOpen },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 shadow-lg">
      {/* ES flag stripe: blue | pink | white */}
      <div className="flex h-1">
        <div className="flex-1 bg-es-blue" />
        <div className="flex-1 bg-es-pink" />
        <div className="flex-1 bg-white" />
      </div>

      <div className="bg-es-blue-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 bg-es-pink rounded-lg flex items-center justify-center shadow-md group-hover:bg-es-pink-light transition-colors">
                <BarChart2 className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-bold text-white text-sm hidden sm:block">Agregador Capixaba</span>
                <span className="font-bold text-es-pink-light text-xs hidden sm:block tracking-wider">ELEIÇÕES 2026</span>
                <span className="font-bold text-white text-sm sm:hidden">ES 2026</span>
              </div>
            </Link>

            <nav className="flex items-center gap-1">
              {navItems.map(({ href, label, icon: Icon }) => {
                const active = pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all",
                      active
                        ? "bg-es-pink text-white shadow-sm"
                        : "text-blue-100 hover:text-white hover:bg-white/10"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden md:inline">{label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
