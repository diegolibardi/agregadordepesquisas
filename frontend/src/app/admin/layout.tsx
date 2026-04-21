"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("admin_auth");
    const isLogin = pathname === "/admin/login";
    if (stored === process.env.NEXT_PUBLIC_ADMIN_KEY) {
      setAuthed(true);
      setReady(true);
    } else if (isLogin) {
      setReady(true);
    } else {
      router.replace("/admin/login");
    }
  }, [pathname, router]);

  if (!ready) return null;
  if (!authed && pathname !== "/admin/login") return null;
  return <>{children}</>;
}
