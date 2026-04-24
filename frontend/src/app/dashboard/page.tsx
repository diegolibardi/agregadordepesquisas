"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAggregation, getAggregationHistory } from "@/lib/api";
import AggregatedBarChart from "@/components/charts/AggregatedBarChart";
import TrendLineChart from "@/components/charts/TrendLineChart";
import { formatDate, ELECTION_TYPE_LABELS } from "@/lib/utils";
import { CalendarDays, RefreshCw, GitCompare, Info } from "lucide-react";
import type { AggregatedStanding } from "@/types/api";
import Link from "next/link";

const ELECTION_TYPES = ["governor"];

// Normalize: strip accents, lowercase
function norm(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

const EXCLUDE_KEYWORDS = [
  "indeciso", "branco", "nulo", "nao sabe", "nenhum", "opinou", "nao opinou", "ns/no", "ns/nr",
];

function filterStandings(standings: AggregatedStanding[], round: number): AggregatedStanding[] {
  if (round === 1) {
    return standings.filter(
      (s) => !EXCLUDE_KEYWORDS.some((kw) => norm(s.candidate_name).includes(kw))
    );
  }
  return standings.filter(
    (s) =>
      norm(s.candidate_name).includes("pazolini") ||
      norm(s.candidate_name).includes("ferraco")
  );
}

export default function DashboardPage() {
  const [electionType, setElectionType] = useState("governor");
  const [round, setRound] = useState(1);

  const { data: aggregation, isLoading: aggLoading } = useQuery({
    queryKey: ["aggregation", electionType, round],
    queryFn: () => getAggregation(electionType, round),
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: history, isLoading: histLoading } = useQuery({
    queryKey: ["history", electionType, round],
    queryFn: () => getAggregationHistory(electionType, round),
  });

  return (
    <div>
      {/* Hero banner */}
      <div className="bg-es-blue-dark relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-es-blue-dark via-es-blue to-es-blue-light opacity-90" />
        <div className="absolute bottom-0 left-0 right-0 h-1 flex">
          <div className="flex-1 bg-es-blue-light" />
          <div className="flex-1 bg-es-pink" />
          <div className="flex-1 bg-white opacity-80" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Placar Agregado</h1>
          <p className="text-blue-200 text-sm mt-1">Média ponderada das pesquisas eleitorais do Espírito Santo</p>
          <span className="inline-block mt-2 px-3 py-1 bg-es-pink/20 border border-es-pink/40 text-es-pink-light text-xs font-semibold rounded-full tracking-wide">
            Apenas cenários estimulados (lista de candidatos apresentada ao entrevistado)
          </span>
        </div>
      </div>

    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div />

        {/* Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex rounded-lg border overflow-hidden">
            {ELECTION_TYPES.map((et) => (
              <button
                key={et}
                onClick={() => setElectionType(et)}
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
          <div className="flex rounded-lg border overflow-hidden">
            {[1, 2].map((r) => (
              <button
                key={r}
                onClick={() => setRound(r)}
                className={`px-4 py-1.5 text-sm font-medium transition-colors ${
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

      {/* Aggregation chart */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">
            Intenção de voto — {ELECTION_TYPE_LABELS[electionType]} ({round}º turno)
          </h2>
          {aggregation?.last_poll_date && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <CalendarDays className="w-3.5 h-3.5" />
              Última pesquisa: {formatDate(aggregation.last_poll_date)}
            </span>
          )}
        </div>

        {aggLoading ? (
          <div className="flex items-center justify-center h-40 text-gray-400">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Carregando...
          </div>
        ) : aggregation?.standings.length === 0 ? (
          <p className="text-gray-400 text-center py-12">
            Nenhuma pesquisa disponível para esta categoria.
          </p>
        ) : (
          <AggregatedBarChart standings={filterStandings(aggregation?.standings ?? [], round)} />
        )}
      </div>

      {/* Standings detail cards */}
      {aggregation && aggregation.standings.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {filterStandings([...aggregation.standings], round)
            .sort((a, b) => b.aggregated_pct - a.aggregated_pct)
            .map((s, i) => (
              <div
                key={s.candidate_id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                  style={{ backgroundColor: s.color_hex ?? "#3b82f6" }}
                >
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-gray-900 truncate">
                    {s.candidate_name}
                  </div>
                  <div className="text-xs text-gray-500">{s.party}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {s.aggregated_pct.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-400">{s.poll_count} pesq.</div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Comparar button */}
      <div className="flex justify-end mb-4">
        <Link
          href="/comparar"
          className="inline-flex items-center gap-2 px-4 py-2 bg-es-pink text-white rounded-lg text-sm font-semibold hover:bg-es-pink-dark transition-colors shadow-sm"
        >
          <GitCompare className="w-4 h-4" /> Comparar candidatos
        </Link>
      </div>

      {/* Trend chart */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Evolução histórica</h2>
        {histLoading ? (
          <div className="flex items-center justify-center h-40 text-gray-400">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Carregando...
          </div>
        ) : history && history.candidates.length > 0 ? (
          <TrendLineChart history={history} />
        ) : (
          <p className="text-gray-400 text-center py-12">
            Dados históricos não disponíveis.
          </p>
        )}
      </div>

      {/* Metodologia */}
      <details className="group bg-gray-50 border border-gray-200 rounded-xl overflow-hidden mt-4">
        <summary className="flex items-center gap-2 px-5 py-4 cursor-pointer select-none list-none text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
          <Info className="w-4 h-4 text-es-blue flex-shrink-0" />
          Como calculamos a média?
          <span className="ml-auto text-xs text-gray-400 group-open:hidden">Ver explicação ▾</span>
          <span className="ml-auto text-xs text-gray-400 hidden group-open:inline">Fechar ▴</span>
        </summary>

        <div className="px-5 pb-5 pt-1 text-sm text-gray-600 space-y-4 border-t border-gray-200">
          <p>
            O placar exibido é uma <strong className="text-gray-800">média ponderada</strong> das pesquisas eleitorais disponíveis.
            Cada pesquisa recebe um peso composto por três fatores:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-lg border border-gray-100 p-3">
              <div className="text-xs font-semibold text-es-blue uppercase tracking-wide mb-1">Credibilidade</div>
              <p className="text-xs text-gray-500">
                Nota de <strong>0 a 1</strong> atribuída a cada instituto com base em histórico, transparência e metodologia declarada.
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-100 p-3">
              <div className="text-xs font-semibold text-es-blue uppercase tracking-wide mb-1">Tamanho da amostra</div>
              <p className="text-xs text-gray-500">
                <code className="bg-gray-100 px-1 rounded">min(n ÷ 1000, 1,0)</code> — pesquisas com 1.000+ entrevistados recebem peso máximo.
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-100 p-3">
              <div className="text-xs font-semibold text-es-blue uppercase tracking-wide mb-1">Recência</div>
              <p className="text-xs text-gray-500">
                <code className="bg-gray-100 px-1 rounded">e^(−0,02 × dias)</code> — pesquisas mais recentes pesam mais. Meia-vida de ~35 dias.
              </p>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-lg p-4 font-mono text-xs text-gray-700 space-y-1">
            <div><span className="text-gray-400">// peso de cada pesquisa</span></div>
            <div><strong>peso</strong> = credibilidade × (amostra ÷ 1000) × e^(−0,02 × dias)</div>
            <div className="pt-1"><span className="text-gray-400">// percentual agregado do candidato</span></div>
            <div><strong>média</strong> = Σ(% × peso) ÷ Σ(peso)</div>
          </div>

          <ul className="text-xs text-gray-500 space-y-1 list-disc list-inside">
            <li>Apenas cenários <strong>estimulados</strong> são considerados (lista de candidatos apresentada ao entrevistado).</li>
            <li>A contagem de "dias" é relativa à pesquisa mais recente, não à data de hoje.</li>
            <li>Os números são recalculados automaticamente sempre que uma nova pesquisa é inserida.</li>
          </ul>
        </div>
      </details>
    </div>
    </div>
  );
}
