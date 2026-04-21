"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LogOut, Shield } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [user, setUser] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("admin_auth");
    const storedUser = sessionStorage.getItem("admin_user") ?? "";
    const isLogin = pathname === "/admin/login";
    if (stored === (process.env.NEXT_PUBLIC_ADMIN_KEY ?? "")) {
      setAuthed(true);
      setUser(storedUser);
      setReady(true);
    } else if (isLogin) {
      setReady(true);
    } else {
      router.replace("/admin/login");
    }
  }, [pathname, router]);

  const logout = () => {
    sessionStorage.removeItem("admin_auth");
    sessionStorage.removeItem("admin_user");
    router.push("/admin/login");
  };

  if (!ready) return null;
  if (!authed && pathname !== "/admin/login") return null;

  return (
    <>
      {authed && (
        <div className="bg-gray-900 text-gray-100 text-xs px-4 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-blue-400" />
            <span className="text-gray-400">Modo Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-300">Logado como <strong>{user}</strong></span>
            <button
              onClick={logout}
              className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
            >
              <LogOut className="w-3 h-3" />
              Sair
            </button>
          </div>
        </div>
      )}
      {children}
    </>
  );
}
