"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCandidates, getAggregationHistory } from "@/lib/api";
import TrendLineChart from "@/components/charts/TrendLineChart";
import { ELECTION_TYPE_LABELS } from "@/lib/utils";
import type { HistoryResponse } from "@/types/api";

export default function CompararPage() {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [electionType, setElectionType] = useState("governor");

  const { data: candidates } = useQuery({
    queryKey: ["candidates-all"],
    queryFn: () => getCandidates({ election_type: electionType }),
  });

  const { data: history } = useQuery({
    queryKey: ["history", electionType, 1],
    queryFn: () => getAggregationHistory(electionType, 1),
  });

  const toggleCandidate = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < 4
        ? [...prev, id]
        : prev
    );
  };

  // Filter history to selected candidates only
  const filteredHistory: HistoryResponse | undefined =
    history && selectedIds.length > 0
      ? {
          ...history,
          candidates: history.candidates.filter((c) =>
            selectedIds.includes(c.candidate_id)
          ),
        }
      : history;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Comparar Candidatos</h1>
        <p className="text-gray-500 text-sm mt-1">
          Selecione até 4 candidatos para comparar a evolução nas pesquisas
        </p>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex rounded-lg border overflow-hidden">
          {["governor", "senator"].map((et) => (
            <button
              key={et}
              onClick={() => { setElectionType(et); setSelectedIds([]); }}
              className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                electionType === et
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {ELECTION_TYPE_LABELS[et] ?? et}
            </button>
          ))}
        </div>
      </div>

      {/* Candidate selection */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <h2 className="text-sm font-medium text-gray-700 mb-3">
          Selecionar candidatos ({selectedIds.length}/4):
        </h2>
        <div className="flex flex-wrap gap-2">
          {candidates?.map((cand) => {
            const selected = selectedIds.includes(cand.id);
            return (
              <button
                key={cand.id}
                onClick={() => toggleCandidate(cand.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${
                  selected
                    ? "border-transparent text-white"
                    : "border-gray-200 text-gray-700 hover:border-gray-400 bg-white"
                }`}
                style={selected ? { backgroundColor: cand.color_hex ?? "#3b82f6" } : {}}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: selected ? "rgba(255,255,255,0.5)" : (cand.color_hex ?? "#3b82f6") }}
                />
                {cand.name}
                <span className="text-xs opacity-70">({cand.party})</span>
              </button>
            );
          })}
        </div>
        {candidates?.length === 0 && (
          <p className="text-gray-400 text-sm">Nenhum candidato cadastrado.</p>
        )}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="font-semibold text-gray-900 mb-4">
          Evolução comparativa — {ELECTION_TYPE_LABELS[electionType]}
        </h2>
        {filteredHistory && filteredHistory.candidates.length > 0 ? (
          <TrendLineChart history={filteredHistory} />
        ) : (
          <p className="text-gray-400 text-center py-16">
            {selectedIds.length === 0
              ? "Selecione ao menos um candidato acima."
              : "Dados históricos não disponíveis para os candidatos selecionados."}
          </p>
        )}
      </div>
    </div>
  );
}
