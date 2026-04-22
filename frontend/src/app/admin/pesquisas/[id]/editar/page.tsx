"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import { getPoll, getInstitutes, getCandidates, adminUpdatePoll, adminDeletePoll } from "@/lib/api";
import { ELECTION_TYPE_LABELS, METHODOLOGY_LABELS } from "@/lib/utils";
import { Plus, Trash2, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ResultRow {
  candidate_id: number;
  percentage: string;
  margin_of_error: string;
  is_spontaneous: boolean;
}

export default function EditarPesquisaPage() {
  const router = useRouter();
  const params = useParams();
  const pollId = Number(params.id);

  const [form, setForm] = useState({
    institute_id: "",
    election_type: "governor",
    round: "1",
    poll_date: "",
    fieldwork_start: "",
    fieldwork_end: "",
    published_date: "",
    sample_size: "",
    margin_of_error: "",
    methodology: "",
    source_url: "",
    raw_data_url: "",
    tse_registered: "",
    notes: "",
  });
  const [results, setResults] = useState<ResultRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: poll, isLoading: pollLoading } = useQuery({
    queryKey: ["poll", pollId],
    queryFn: () => getPoll(pollId),
    enabled: !!pollId,
  });

  const { data: institutes } = useQuery({
    queryKey: ["institutes-all"],
    queryFn: () => getInstitutes(false),
  });

  const { data: candidates } = useQuery({
    queryKey: ["candidates", form.election_type],
    queryFn: () => getCandidates({ election_type: form.election_type, active_only: false }),
    enabled: !!form.election_type,
  });

  useEffect(() => {
    if (!poll) return;
    setForm({
      institute_id: String(poll.institute_id),
      election_type: poll.election_type,
      round: String(poll.round),
      poll_date: poll.poll_date,
      fieldwork_start: poll.fieldwork_start ?? "",
      fieldwork_end: poll.fieldwork_end ?? "",
      published_date: poll.published_date ?? "",
      sample_size: poll.sample_size != null ? String(poll.sample_size) : "",
      margin_of_error: poll.margin_of_error != null ? String(poll.margin_of_error) : "",
      methodology: poll.methodology ?? "",
      source_url: poll.source_url ?? "",
      raw_data_url: poll.raw_data_url ?? "",
      tse_registered: poll.tse_registered ?? "",
      notes: poll.notes ?? "",
    });
    setResults(
      poll.results.map((r) => ({
        candidate_id: r.candidate_id,
        percentage: String(r.percentage),
        margin_of_error: r.margin_of_error != null ? String(r.margin_of_error) : "",
        is_spontaneous: r.is_spontaneous,
      }))
    );
  }, [poll]);

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        institute_id: Number(form.institute_id),
        election_type: form.election_type,
        round: Number(form.round),
        poll_date: form.poll_date,
        fieldwork_start: form.fieldwork_start || null,
        fieldwork_end: form.fieldwork_end || null,
        published_date: form.published_date || null,
        sample_size: form.sample_size ? Number(form.sample_size) : null,
        margin_of_error: form.margin_of_error ? Number(form.margin_of_error) : null,
        methodology: form.methodology || null,
        source_url: form.source_url || null,
        raw_data_url: form.raw_data_url || null,
        tse_registered: form.tse_registered || null,
        notes: form.notes || null,
        results: results
          .filter((r) => r.candidate_id > 0 && r.percentage !== "")
          .map((r) => ({
            candidate_id: r.candidate_id,
            percentage: Number(r.percentage),
            margin_of_error: r.margin_of_error ? Number(r.margin_of_error) : null,
            is_spontaneous: r.is_spontaneous,
          })),
      };
      return adminUpdatePoll(pollId, payload);
    },
    onSuccess: () => router.push("/admin/pesquisas"),
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Erro ao salvar pesquisa.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    },
  });

  const deletePoll = useMutation({
    mutationFn: () => adminDeletePoll(pollId),
    onSuccess: () => router.push("/admin/pesquisas"),
  });

  const setResult = (index: number, patch: Partial<ResultRow>) =>
    setResults((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  const addRow = () =>
    setResults((prev) => [
      ...prev,
      { candidate_id: 0, percentage: "", margin_of_error: "", is_spontaneous: false },
    ]);

  const removeRow = (index: number) =>
    setResults((prev) => prev.filter((_, i) => i !== index));

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const inputCls = "w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300";
  const labelCls = "block text-xs text-gray-600 mb-1";

  if (pollLoading) {
    return <div className="max-w-3xl mx-auto px-4 py-12 text-center text-gray-400">Carregando...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/pesquisas" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Editar Pesquisa #{pollId}</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      <div className="space-y-6">
        <section className="bg-white rounded-xl shadow-sm border p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Dados da Pesquisa</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Instituto *</label>
              <select className={inputCls} {...field("institute_id")}>
                <option value="">Selecione...</option>
                {institutes?.map((inst) => (
                  <option key={inst.id} value={inst.id}>{inst.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Tipo de Eleição *</label>
              <select className={inputCls} {...field("election_type")}>
                {Object.entries(ELECTION_TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Turno *</label>
              <select className={inputCls} {...field("round")}>
                <option value="1">1º Turno</option>
                <option value="2">2º Turno</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Data da Pesquisa *</label>
              <input type="date" className={inputCls} {...field("poll_date")} />
            </div>
            <div>
              <label className={labelCls}>Início do campo</label>
              <input type="date" className={inputCls} {...field("fieldwork_start")} />
            </div>
            <div>
              <label className={labelCls}>Fim do campo</label>
              <input type="date" className={inputCls} {...field("fieldwork_end")} />
            </div>
            <div>
              <label className={labelCls}>Data de publicação</label>
              <input type="date" className={inputCls} {...field("published_date")} />
            </div>
            <div>
              <label className={labelCls}>Tamanho da amostra</label>
              <input type="number" min="100" className={inputCls} placeholder="ex: 1200" {...field("sample_size")} />
            </div>
            <div>
              <label className={labelCls}>Margem de erro (%)</label>
              <input type="number" step="0.1" min="0" className={inputCls} placeholder="ex: 3.2" {...field("margin_of_error")} />
            </div>
            <div>
              <label className={labelCls}>Metodologia</label>
              <select className={inputCls} {...field("methodology")}>
                <option value="">Não informada</option>
                {Object.entries(METHODOLOGY_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Registro TSE</label>
              <input type="text" className={inputCls} {...field("tse_registered")} />
            </div>
            <div>
              <label className={labelCls}>URL da fonte</label>
              <input type="url" className={inputCls} {...field("source_url")} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Notas</label>
              <textarea rows={2} className={inputCls} {...field("notes")} />
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Resultados por Candidato</h2>
            <button type="button" onClick={addRow} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
              <Plus className="w-3.5 h-3.5" /> Adicionar candidato
            </button>
          </div>
          <div className="space-y-3">
            {results.map((row, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-5">
                  {i === 0 && <label className={labelCls}>Candidato</label>}
                  <select
                    className={inputCls}
                    value={row.candidate_id}
                    onChange={(e) => setResult(i, { candidate_id: Number(e.target.value) })}
                  >
                    <option value={0}>Selecione...</option>
                    {candidates?.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.party})</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-3">
                  {i === 0 && <label className={labelCls}>% intenção</label>}
                  <input type="number" step="0.1" min="0" max="100" className={inputCls} placeholder="0.0"
                    value={row.percentage} onChange={(e) => setResult(i, { percentage: e.target.value })} />
                </div>
                <div className="col-span-2">
                  {i === 0 && <label className={labelCls}>M. erro</label>}
                  <input type="number" step="0.1" min="0" className={inputCls} placeholder="—"
                    value={row.margin_of_error} onChange={(e) => setResult(i, { margin_of_error: e.target.value })} />
                </div>
                <div className="col-span-1 flex items-center justify-center pb-0.5">
                  {i === 0 && <label className={`${labelCls} text-center`}>Esp.</label>}
                  <input type="checkbox" checked={row.is_spontaneous}
                    onChange={(e) => setResult(i, { is_spontaneous: e.target.checked })} />
                </div>
                <div className="col-span-1 flex justify-end">
                  {results.length > 1 && (
                    <button type="button" onClick={() => removeRow(i)} className="text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => save.mutate()}
              disabled={save.isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40"
            >
              <Save className="w-4 h-4" />
              {save.isPending ? "Salvando..." : "Salvar alterações"}
            </button>
            <Link href="/admin/pesquisas" className="px-5 py-2.5 border rounded-lg text-sm font-medium hover:bg-gray-50">
              Cancelar
            </Link>
          </div>

          <div>
            {confirmDelete ? (
              <span className="flex items-center gap-2">
                <button
                  onClick={() => deletePoll.mutate()}
                  className="text-sm text-red-600 font-medium hover:underline"
                >
                  Confirmar exclusão
                </button>
                <button onClick={() => setConfirmDelete(false)} className="text-sm text-gray-400 hover:underline">
                  Cancelar
                </button>
              </span>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" /> Excluir pesquisa
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
