"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { adminGetScraperRuns, getPolls } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { BookOpen, Building2, Users, Play, RefreshCw } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    success: "bg-green-100 text-green-800",
    error: "bg-red-100 text-red-800",
    running: "bg-blue-100 text-blue-800",
    pending: "bg-yellow-100 text-yellow-800",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] ?? "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
}

export default function AdminPage() {
  const { data: runs, isLoading: runsLoading } = useQuery({
    queryKey: ["scraper-runs"],
    queryFn: () => adminGetScraperRuns(10),
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>
        <p className="text-gray-500 text-sm mt-1">Gerenciamento de dados e configurações</p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { href: "/admin/pesquisas", label: "Pesquisas", icon: BookOpen, color: "blue" },
          { href: "/admin/candidatos", label: "Candidatos", icon: Users, color: "purple" },
          { href: "/admin/institutos", label: "Institutos", icon: Building2, color: "green" },
          { href: "/admin/scraper", label: "Scraper", icon: Play, color: "orange" },
        ].map(({ href, label, icon: Icon, color }) => (
          <Link
            key={href}
            href={href}
            className="bg-white rounded-xl shadow-sm border p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
          >
            <div className={`w-10 h-10 rounded-lg bg-${color}-100 flex items-center justify-center`}>
              <Icon className={`w-5 h-5 text-${color}-600`} />
            </div>
            <span className="font-semibold text-gray-900">{label}</span>
          </Link>
        ))}
      </div>

      {/* Recent scraper runs */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Execuções recentes do Scraper</h2>
          <Link href="/admin/scraper" className="text-sm text-blue-600 hover:underline">
            Ver tudo →
          </Link>
        </div>
        {runsLoading ? (
          <div className="p-8 text-center text-gray-400">
            <RefreshCw className="w-5 h-5 animate-spin inline-block mr-2" />
            Carregando...
          </div>
        ) : !runs?.length ? (
          <div className="p-8 text-center text-gray-400">Nenhuma execução registrada.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-gray-600">
                <th className="text-left px-4 py-3 font-medium">Instituto</th>
                <th className="text-left px-4 py-3 font-medium">Iniciado</th>
                <th className="text-right px-4 py-3 font-medium">Encontradas</th>
                <th className="text-right px-4 py-3 font-medium">Importadas</th>
                <th className="text-center px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {runs.map((run) => (
                <tr key={run.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900">{run.institute_name ?? "Todos"}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatDate(run.started_at.split("T")[0])}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">{run.polls_found}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{run.polls_imported}</td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={run.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
