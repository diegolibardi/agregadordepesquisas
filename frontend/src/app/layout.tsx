"use client";

import "./globals.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import Navbar from "@/components/layout/Navbar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false },
        },
      })
  );

  return (
    <html lang="pt-BR">
      <head>
        <title>Agregador de Pesquisas Capixabas - 2026</title>
        <meta
          name="description"
          content="Agregador de Pesquisas Capixabas - 2026"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <Navbar />
          <main className="min-h-screen bg-slate-50">{children}</main>
          <footer className="bg-es-blue-dark border-t border-es-blue py-5 text-center">
            <div className="flex justify-center gap-1 mb-2">
              <div className="w-8 h-1 rounded-full bg-es-blue" />
              <div className="w-8 h-1 rounded-full bg-es-pink" />
              <div className="w-8 h-1 rounded-full bg-white opacity-60" />
            </div>
            <p className="text-blue-200 text-sm font-medium">Agregador de Pesquisas Capixabas — Eleições 2026</p>
          </footer>
        </QueryClientProvider>
      </body>
    </html>
  );
}
