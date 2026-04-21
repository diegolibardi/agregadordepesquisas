"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAggregationHistory } from "@/lib/api";
import TrendLineChart from "@/components/charts/TrendLineChart";
import { ELECTION_TYPE_LABELS } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

const ELECTION_TYPES = ["governor", "senator", "federal_deputy"];

export default function TendenciasPage() {
  const [electionType, setElectionType] = useState("governor");
  const [round, setRound] = useState(1);

  const { data: history, isLoading } = useQuery({
    queryKey: ["history", electionType, round],
    queryFn: () => getAggregationHistory(electionType, round),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tendências</h1>
          <p className="text-gray-500 text-sm mt-1">
            Evolução da intenção de voto ao longo do tempo
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex rounded-lg border overflow-hidden">
            {ELECTION_TYPES.map((et) => (
              <button
                key={et}
                onClick={() => setElectionType(et)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  electionType === et
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {ELECTION_TYPE_LABELS[et] ?? et}
              </button>
            ))}
          </div>
          <div className="flex rounded-lg border overflow-hidden">
            {[1, 2].map((r) => (
              <button
                key={r}
                onClick={() => setRound(r)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  round === r
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {r}º Turno
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="font-semibold text-gray-900 mb-6">
          {ELECTION_TYPE_LABELS[electionType]} — {round}º Turno
        </h2>
        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-gray-400">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Carregando dados...
          </div>
        ) : !history || history.candidates.length === 0 ? (
          <p className="text-center text-gray-400 py-16">
            Nenhum dado histórico disponível para esta categoria.
          </p>
        ) : (
          <TrendLineChart history={history} />
        )}
      </div>

      {/* Legend / methodology note */}
      <div className="mt-4 bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
        <strong>Metodologia de agregação:</strong> Média ponderada utilizando score de
        credibilidade do instituto, tamanho da amostra e fator de decaimento temporal
        (pesquisas mais recentes têm maior peso). Baseado no modelo utilizado pelo JOTA.
      </div>
    </div>
  );
}
