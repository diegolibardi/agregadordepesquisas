"use client";

import { useQuery } from "@tanstack/react-query";
import { getPoll, getCandidates } from "@/lib/api";
import { formatDate, ELECTION_TYPE_LABELS, METHODOLOGY_LABELS } from "@/lib/utils";
import { ExternalLink, CheckCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList,
} from "recharts";

export default function PollDetailPage({ params }: { params: { id: string } }) {
  const pollId = Number(params.id);

  const { data: poll, isLoading } = useQuery({
    queryKey: ["poll", pollId],
    queryFn: () => getPoll(pollId),
  });

  const { data: candidates } = useQuery({
    queryKey: ["candidates"],
    queryFn: () => getCandidates({ active_only: false }),
  });

  const candidateMap = Object.fromEntries(
    (candidates ?? []).map((c) => [c.id, c])
  );

  if (isLoading) {
    return <div className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-400">Carregando...</div>;
  }

  if (!poll) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-500">
        Pesquisa não encontrada.{" "}
        <Link href="/pesquisas" className="text-blue-600 hover:underline">Voltar</Link>
      </div>
    );
  }

  const stimulated = poll.results.filter((r) => !r.is_spontaneous);
  const chartData = stimulated
    .sort((a, b) => b.percentage - a.percentage)
    .map((r) => {
      const cand = candidateMap[r.candidate_id];
      return {
        name: cand?.name ?? `Candidato #${r.candidate_id}`,
        pct: r.percentage,
        color: cand?.color_hex ?? "#3b82f6",
        moe: r.margin_of_error,
      };
    });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <Link
        href="/pesquisas"
        className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar às pesquisas
      </Link>

      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Pesquisa #{poll.id} — {poll.institute_name ?? `Instituto #${poll.institute_id}`}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {ELECTION_TYPE_LABELS[poll.election_type] ?? poll.election_type} — {poll.round}º Turno
            </p>
          </div>
          {poll.is_verified && (
            <span className="inline-flex items-center gap-1 text-sm text-green-700 bg-green-50 px-3 py-1 rounded-full">
              <CheckCircle className="w-4 h-4" /> Verificado
            </span>
          )}
        </div>

        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            ["Data da pesquisa", formatDate(poll.poll_date)],
            ["Início do campo", poll.fieldwork_start ? formatDate(poll.fieldwork_start) : "—"],
            ["Fim do campo", poll.fieldwork_end ? formatDate(poll.fieldwork_end) : "—"],
            ["Publicação", poll.published_date ? formatDate(poll.published_date) : "—"],
            ["Tamanho da amostra", poll.sample_size?.toLocaleString("pt-BR") ?? "—"],
            ["Margem de erro", poll.margin_of_error ? `±${poll.margin_of_error}%` : "—"],
            ["Nível de confiança", poll.confidence_level ? `${poll.confidence_level}%` : "—"],
            ["Metodologia", poll.methodology ? METHODOLOGY_LABELS[poll.methodology] ?? poll.methodology : "—"],
            ["Registro TSE", poll.tse_registered ?? "—"],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-gray-500">{label}</dt>
              <dd className="text-sm font-medium text-gray-900">{value}</dd>
            </div>
          ))}
        </dl>

        {poll.source_url && (
          <a
            href={poll.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-4 text-sm text-blue-600 hover:underline"
          >
            <ExternalLink className="w-4 h-4" /> Fonte original
          </a>
        )}
        {poll.notes && (
          <p className="mt-4 text-sm text-gray-600 border-t pt-4">{poll.notes}</p>
        )}
      </div>

      {/* Results chart */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Resultados (estimulada)</h2>
        {chartData.length === 0 ? (
          <p className="text-gray-400 text-center py-8">Sem resultados registrados.</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(180, chartData.length * 60)}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 4, right: 48, left: 130, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" width={122} tick={{ fontSize: 13 }} />
              <Tooltip formatter={(v: number) => [`${v.toFixed(1)}%`]} />
              <Bar dataKey="pct" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
                <LabelList dataKey="pct" position="right" formatter={(v: number) => `${v.toFixed(1)}%`} style={{ fontSize: 13, fontWeight: 700 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
