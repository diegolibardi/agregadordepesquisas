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
        <title>Agregador de Pesquisas Eleitorais — ES</title>
        <meta
          name="description"
          content="Agregador de pesquisas eleitorais do Espírito Santo"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <Navbar />
          <main className="min-h-screen bg-gray-50">{children}</main>
          <footer className="bg-white border-t py-4 text-center text-sm text-gray-500">
            Governo do Estado do Espírito Santo — Agregador de Pesquisas Eleitorais
          </footer>
        </QueryClientProvider>
      </body>
    </html>
  );
}
