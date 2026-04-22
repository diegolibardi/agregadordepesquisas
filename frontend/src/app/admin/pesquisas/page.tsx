"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPolls, getInstitutes, getCandidates, adminDeletePoll, adminUpdatePoll } from "@/lib/api";
import { formatDate, ELECTION_TYPE_LABELS } from "@/lib/utils";
import { Trash2, CheckCircle, RefreshCw, Plus, Edit2 } from "lucide-react";
import Link from "next/link";

export default function AdminPesquisasPage() {
  const [page, setPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const qc = useQueryClient();

  const { data: polls, isLoading } = useQuery({
    queryKey: ["polls-admin", page],
    queryFn: () => getPolls({ page, page_size: 50 }),
  });

  const deletePoll = useMutation({
    mutationFn: (id: number) => adminDeletePoll(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["polls-admin"] });
      setConfirmDelete(null);
    },
  });

  const verify = useMutation({
    mutationFn: (id: number) => adminUpdatePoll(id, { is_verified: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["polls-admin"] }),
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gerenciar Pesquisas</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/pesquisas/nova"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" /> Nova Pesquisa
          </Link>
          <Link
            href="/pesquisas"
            className="text-sm text-blue-600 hover:underline"
          >
            Ver site público →
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400">
            <RefreshCw className="w-5 h-5 animate-spin inline-block mr-2" />
            Carregando...
          </div>
        ) : !polls?.length ? (
          <div className="p-12 text-center text-gray-400">Nenhuma pesquisa registrada.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b text-gray-600">
                  <th className="text-left px-4 py-3 font-medium">ID</th>
                  <th className="text-left px-4 py-3 font-medium">Instituto</th>
                  <th className="text-left px-4 py-3 font-medium">Data</th>
                  <th className="text-left px-4 py-3 font-medium">Cargo</th>
                  <th className="text-right px-4 py-3 font-medium">Amostra</th>
                  <th className="text-center px-4 py-3 font-medium">Verif.</th>
                  <th className="text-right px-4 py-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {polls.map((poll) => (
                  <tr key={poll.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">#{poll.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {poll.institute_name ?? `#${poll.institute_id}`}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(poll.poll_date)}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {ELECTION_TYPE_LABELS[poll.election_type] ?? poll.election_type} — {poll.round}º
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {poll.sample_size?.toLocaleString("pt-BR") ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {poll.is_verified ? (
                        <CheckCircle className="w-4 h-4 text-green-500 inline-block" />
                      ) : (
                        <button
                          onClick={() => verify.mutate(poll.id)}
                          className="text-xs text-gray-400 hover:text-green-600 hover:underline"
                        >
                          Verificar
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/pesquisas/${poll.id}`}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Ver
                        </Link>
                        <Link
                          href={`/admin/pesquisas/${poll.id}/editar`}
                          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 hover:underline"
                        >
                          <Edit2 className="w-3 h-3" /> Editar
                        </Link>
                        {confirmDelete === poll.id ? (
                          <span className="flex items-center gap-1">
                            <button
                              onClick={() => deletePoll.mutate(poll.id)}
                              className="text-xs text-red-600 font-medium hover:underline"
                            >
                              Confirmar
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="text-xs text-gray-400 hover:underline"
                            >
                              Cancelar
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(poll.id)}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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
