"use client";

import { useQuery } from "@tanstack/react-query";
import { getInstitutes } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { ExternalLink } from "lucide-react";

function CredibilityBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-medium text-gray-700">{pct}%</span>
    </div>
  );
}

export default function InstitutosPage() {
  const { data: institutes, isLoading } = useQuery({
    queryKey: ["institutes-all"],
    queryFn: () => getInstitutes(false),
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Institutos de Pesquisa</h1>
        <p className="text-gray-500 text-sm mt-1">
          Institutos e seus scores de credibilidade utilizados na ponderação
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400">Carregando...</div>
        ) : !institutes?.length ? (
          <div className="p-12 text-center text-gray-400">
            Nenhum instituto cadastrado.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600 border-b">
                <th className="text-left px-4 py-3 font-medium">Nome</th>
                <th className="text-left px-4 py-3 font-medium">Credibilidade</th>
                <th className="text-left px-4 py-3 font-medium">Tipo de scraper</th>
                <th className="text-center px-4 py-3 font-medium">Ativo</th>
                <th className="text-right px-4 py-3 font-medium">Site</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {institutes.map((inst) => (
                <tr key={inst.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{inst.name}</td>
                  <td className="px-4 py-3">
                    <CredibilityBar score={inst.credibility_score} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600 font-mono">
                      {inst.scraper_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        inst.is_active ? "bg-green-500" : "bg-gray-300"
                      }`}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {inst.website_url ? (
                      <a
                        href={inst.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline text-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Visitar
                      </a>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-4 bg-amber-50 rounded-lg p-4 text-sm text-amber-800">
        <strong>Sobre o score de credibilidade:</strong> O score (0–100%) pondera cada
        pesquisa na média agregada. Institutos com maior histórico de acurácia recebem
        peso maior. O score pode ser ajustado pelo administrador.
      </div>
    </div>
  );
}
