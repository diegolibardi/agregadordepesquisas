"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPolls, getInstitutes, getCandidates, getExportUrl } from "@/lib/api";
import { formatDate, formatPct, ELECTION_TYPE_LABELS, METHODOLOGY_LABELS } from "@/lib/utils";
import { Download, ExternalLink, CheckCircle, Filter } from "lucide-react";
import Link from "next/link";

export default function PesquisasPage() {
  const [electionType, setElectionType] = useState<string>("");
  const [round, setRound] = useState<number | undefined>();
  const [instituteId, setInstituteId] = useState<number | undefined>();
  const [page, setPage] = useState(1);

  const { data: polls, isLoading } = useQuery({
    queryKey: ["polls", electionType, round, instituteId, page],
    queryFn: () =>
      getPolls({
        election_type: electionType || undefined,
        round,
        institute_id: instituteId,
        page,
        page_size: 50,
      }),
  });

  const { data: institutes } = useQuery({
    queryKey: ["institutes"],
    queryFn: () => getInstitutes(),
  });

  const exportUrl = getExportUrl("csv", {
    election_type: electionType || undefined,
    round,
    institute_id: instituteId,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pesquisas Eleitorais</h1>
          <p className="text-gray-500 text-sm mt-1">
            Todas as pesquisas registradas
          </p>
        </div>
        <a
          href={exportUrl}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </a>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div className="flex items-center gap-1 text-gray-500">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filtros:</span>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Cargo</label>
          <select
            className="border rounded-md px-2 py-1 text-sm"
            value={electionType}
            onChange={(e) => { setElectionType(e.target.value); setPage(1); }}
          >
            <option value="">Todos</option>
            <option value="governor">Governador</option>
            <option value="senator">Senador</option>
            <option value="federal_deputy">Dep. Federal</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Turno</label>
          <select
            className="border rounded-md px-2 py-1 text-sm"
            value={round ?? ""}
            onChange={(e) => { setRound(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
          >
            <option value="">Todos</option>
            <option value="1">1º Turno</option>
            <option value="2">2º Turno</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Instituto</label>
          <select
            className="border rounded-md px-2 py-1 text-sm"
            value={instituteId ?? ""}
            onChange={(e) => { setInstituteId(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
          >
            <option value="">Todos</option>
            {institutes?.map((i) => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => { setElectionType(""); setRound(undefined); setInstituteId(undefined); setPage(1); }}
          className="text-xs text-blue-600 hover:underline"
        >
          Limpar filtros
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400">Carregando pesquisas...</div>
        ) : !polls?.length ? (
          <div className="p-12 text-center text-gray-400">Nenhuma pesquisa encontrada.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600 border-b">
                  <th className="text-left px-4 py-3 font-medium">Instituto</th>
                  <th className="text-left px-4 py-3 font-medium">Data</th>
                  <th className="text-left px-4 py-3 font-medium">Cargo</th>
                  <th className="text-left px-4 py-3 font-medium">Turno</th>
                  <th className="text-right px-4 py-3 font-medium">Amostra</th>
                  <th className="text-left px-4 py-3 font-medium">Metodologia</th>
                  <th className="text-center px-4 py-3 font-medium">Verificado</th>
                  <th className="text-right px-4 py-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {polls.map((poll) => (
                  <tr key={poll.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {poll.institute_name ?? `#${poll.institute_id}`}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatDate(poll.poll_date)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {ELECTION_TYPE_LABELS[poll.election_type] ?? poll.election_type}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{poll.round}º</td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {poll.sample_size?.toLocaleString("pt-BR") ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {poll.methodology
                        ? METHODOLOGY_LABELS[poll.methodology] ?? poll.methodology
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {poll.is_verified ? (
                        <CheckCircle className="w-4 h-4 text-green-500 inline-block" />
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/pesquisas/${poll.id}`}
                          className="text-blue-600 hover:underline text-xs"
                        >
                          Ver detalhes
                        </Link>
                        {poll.source_url && (
                          <a
                            href={poll.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-2 mt-4">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-50"
        >
          Anterior
        </button>
        <span className="px-4 py-2 text-sm text-gray-600">Página {page}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={!polls || polls.length < 50}
          className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-50"
        >
          Próxima
        </button>
      </div>
    </div>
  );
}
