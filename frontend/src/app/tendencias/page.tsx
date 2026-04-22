"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAggregationHistory } from "@/lib/api";
import TrendLineChart from "@/components/charts/TrendLineChart";
import { ELECTION_TYPE_LABELS, formatDate } from "@/lib/utils";
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

      {/* Current values table */}
      {history && history.candidates.length > 0 && (
        <div className="mt-4 bg-white rounded-xl shadow-sm border p-5">
          <h3 className="font-semibold text-gray-900 mb-3 text-sm">Valor agregado atual</h3>
          <div className="flex flex-wrap gap-3">
            {history.candidates.map((cand) => {
              const last = cand.data_points[cand.data_points.length - 1];
              return last ? (
                <div key={cand.candidate_id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cand.color_hex ?? "#3b82f6" }}
                  />
                  <span className="text-sm font-medium text-gray-800">{cand.candidate_name}</span>
                  <span className="text-sm font-bold text-gray-900">{last.percentage.toFixed(1)}%</span>
                  <span className="text-xs text-gray-400">({formatDate(last.poll_date)})</span>
                </div>
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* Methodology explanation */}
      <div className="mt-4 bg-blue-50 rounded-xl border border-blue-100 p-5 text-sm text-blue-900 space-y-3">
        <h3 className="font-bold text-base text-blue-900">Como funciona o modelo de agregação (baseado no JOTA)</h3>
        <p>
          O gráfico acima não mostra os números brutos de cada pesquisa — ele mostra uma
          <strong> média ponderada</strong>, que combina todas as pesquisas disponíveis dando
          pesos diferentes a cada uma. Isso evita que uma única pesquisa distorça o resultado.
        </p>
        <div>
          <p className="font-semibold mb-1">Três fatores definem o peso de cada pesquisa:</p>
          <ol className="list-decimal list-inside space-y-1 ml-1">
            <li>
              <strong>Credibilidade do instituto</strong> — institutos com histórico de acertos e metodologia
              transparente recebem pontuação maior (ex.: Quaest = 90%, Real Time = 80%).
            </li>
            <li>
              <strong>Tamanho da amostra</strong> — pesquisas com mais entrevistados têm maior precisão
              estatística e recebem peso proporcional.
            </li>
            <li>
              <strong>Decaimento temporal</strong> — pesquisas mais antigas valem menos. O modelo usa
              uma fórmula exponencial com meia-vida de ~14 dias: uma pesquisa de 14 dias atrás
              vale metade de uma publicada hoje.
            </li>
          </ol>
        </div>
        <p>
          O <strong>resultado final</strong> é calculado como:
          <br />
          <code className="bg-blue-100 px-2 py-0.5 rounded text-xs mt-1 inline-block">
            % agregada = Σ(percentual × credibilidade × amostra × decaimento) ÷ Σ(credibilidade × amostra × decaimento)
          </code>
        </p>
        <p className="text-blue-700 text-xs">
          Este método é amplamente utilizado por agregadores internacionais (FiveThirtyEight, JOTA, Poder360)
          e produz estimativas mais estáveis e confiáveis do que qualquer pesquisa isolada.
        </p>
      </div>
    </div>
  );
}
