"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminGetScraperRuns, adminTriggerScraper, getInstitutes } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Play, RefreshCw, AlertCircle } from "lucide-react";

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

export default function ScraperPage() {
  const [selectedInstituteId, setSelectedInstituteId] = useState<number | undefined>();
  const [expandedRun, setExpandedRun] = useState<number | null>(null);
  const qc = useQueryClient();

  const { data: runs, isLoading } = useQuery({
    queryKey: ["scraper-runs-all"],
    queryFn: () => adminGetScraperRuns(50),
    refetchInterval: 10000,
  });

  const { data: institutes } = useQuery({
    queryKey: ["institutes"],
    queryFn: () => getInstitutes(),
  });

  const trigger = useMutation({
    mutationFn: () => adminTriggerScraper(selectedInstituteId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scraper-runs-all"] }),
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Controle do Scraper</h1>
        <p className="text-gray-500 text-sm mt-1">
          Disparo manual e histórico de execuções do importador de pesquisas
        </p>
      </div>

      {/* Trigger panel */}
      <div className="bg-white rounded-xl shadow-sm border p-5 mb-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Instituto (opcional)</label>
          <select
            className="border rounded-md px-3 py-2 text-sm"
            value={selectedInstituteId ?? ""}
            onChange={(e) => setSelectedInstituteId(e.target.value ? Number(e.target.value) : undefined)}
          >
            <option value="">Todos os institutos</option>
            {institutes?.map((i) => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => trigger.mutate()}
          disabled={trigger.isPending}
          className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {trigger.isPending ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {trigger.isPending ? "Enfileirando..." : "Executar agora"}
        </button>
        {trigger.isSuccess && (
          <span className="text-sm text-green-700 bg-green-50 px-3 py-1.5 rounded-lg">
            Execução enfileirada com sucesso!
          </span>
        )}
        {trigger.isError && (
          <span className="text-sm text-red-700 bg-red-50 px-3 py-1.5 rounded-lg flex items-center gap-1">
            <AlertCircle className="w-4 h-4" /> Erro ao enfileirar
          </span>
        )}
      </div>

      <div className="text-xs text-gray-500 mb-3 flex items-center gap-1">
        <RefreshCw className="w-3 h-3" />
        Atualiza automaticamente a cada 10 segundos
      </div>

      {/* Run history */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400">Carregando histórico...</div>
        ) : !runs?.length ? (
          <div className="p-12 text-center text-gray-400">Nenhuma execução registrada.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-gray-600">
                <th className="text-left px-4 py-3 font-medium">ID</th>
                <th className="text-left px-4 py-3 font-medium">Instituto</th>
                <th className="text-left px-4 py-3 font-medium">Iniciado</th>
                <th className="text-left px-4 py-3 font-medium">Encerrado</th>
                <th className="text-right px-4 py-3 font-medium">Encontradas</th>
                <th className="text-right px-4 py-3 font-medium">Importadas</th>
                <th className="text-center px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {runs.map((run) => (
                <>
                  <tr
                    key={run.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)}
                  >
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">#{run.id}</td>
                    <td className="px-4 py-3 text-gray-900">{run.institute_name ?? "Todos"}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {run.started_at ? formatDate(run.started_at.split("T")[0]) : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {run.finished_at ? formatDate(run.finished_at.split("T")[0]) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{run.polls_found}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{run.polls_imported}</td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={run.status} />
                    </td>
                  </tr>
                  {expandedRun === run.id && run.error_message && (
                    <tr key={`${run.id}-error`} className="bg-red-50">
                      <td colSpan={7} className="px-4 py-3">
                        <p className="text-xs text-red-700 font-mono whitespace-pre-wrap">
                          {run.error_message}
                        </p>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
