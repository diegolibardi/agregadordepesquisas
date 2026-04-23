"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCandidates, adminCreateCandidate, adminUpdateCandidate } from "@/lib/api";
import type { CandidateOut } from "@/types/api";
import { ELECTION_TYPE_LABELS } from "@/lib/utils";
import { Plus, Edit2, Save, X } from "lucide-react";

const emptyForm = {
  name: "", slug: "", party: "", party_number: "",
  election_type: "governor", color_hex: "#3b82f6", is_active: true,
};

export default function AdminCandidatosPage() {
  const [editing, setEditing] = useState<(Partial<CandidateOut> & { id?: number }) | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [saveError, setSaveError] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: candidates, isLoading } = useQuery({
    queryKey: ["candidates-admin"],
    queryFn: () => getCandidates({ active_only: false }),
  });

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        party_number: form.party_number ? Number(form.party_number) : null,
      };
      return isNew
        ? adminCreateCandidate(payload)
        : adminUpdateCandidate(editing!.id!, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["candidates-admin"] });
      setEditing(null);
      setIsNew(false);
      setSaveError(null);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setSaveError(typeof msg === "string" ? msg : "Erro ao salvar. Verifique se o backend está ativo.");
    },
  });

  const startEdit = (c: CandidateOut) => {
    setIsNew(false);
    setEditing(c);
    setForm({
      name: c.name, slug: c.slug, party: c.party,
      party_number: String(c.party_number ?? ""),
      election_type: c.election_type,
      color_hex: c.color_hex ?? "#3b82f6",
      is_active: c.is_active,
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Candidatos</h1>
        <button
          onClick={() => { setIsNew(true); setEditing({}); setForm(emptyForm); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> Novo candidato
        </button>
      </div>

      {editing !== null && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            {isNew ? "Novo Candidato" : `Editando: ${editing.name}`}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: "name", label: "Nome completo" },
              { key: "slug", label: "Slug" },
              { key: "party", label: "Partido" },
              { key: "party_number", label: "Número" },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs text-gray-600 mb-1">{label}</label>
                <input
                  type="text"
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={(form as Record<string, unknown>)[key] as string}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                />
              </div>
            ))}
            <div>
              <label className="block text-xs text-gray-600 mb-1">Cargo</label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={form.election_type}
                onChange={(e) => setForm((f) => ({ ...f, election_type: e.target.value }))}
              >
                {Object.entries(ELECTION_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Cor</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="h-9 w-16 border rounded-md cursor-pointer"
                  value={form.color_hex}
                  onChange={(e) => setForm((f) => ({ ...f, color_hex: e.target.value }))}
                />
                <input
                  type="text"
                  className="flex-1 border rounded-md px-3 py-2 text-sm"
                  value={form.color_hex}
                  onChange={(e) => setForm((f) => ({ ...f, color_hex: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox" id="cand_active"
                checked={form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              />
              <label htmlFor="cand_active" className="text-sm text-gray-700">Ativo</label>
            </div>
          </div>
          {saveError && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
              {saveError}
            </div>
          )}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => save.mutate()}
              disabled={save.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {save.isPending ? "Salvando..." : "Salvar"}
            </button>
            <button
              onClick={() => { setEditing(null); setIsNew(false); }}
              className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              <X className="w-4 h-4" /> Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400">Carregando...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-gray-600">
                <th className="text-left px-4 py-3 font-medium">Nome</th>
                <th className="text-left px-4 py-3 font-medium">Partido</th>
                <th className="text-left px-4 py-3 font-medium">Cargo</th>
                <th className="text-left px-4 py-3 font-medium">Cor</th>
                <th className="text-center px-4 py-3 font-medium">Ativo</th>
                <th className="text-right px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {candidates?.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3 text-gray-600">{c.party}</td>
                  <td className="px-4 py-3 text-gray-600">{ELECTION_TYPE_LABELS[c.election_type] ?? c.election_type}</td>
                  <td className="px-4 py-3">
                    {c.color_hex && (
                      <span className="inline-flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full border" style={{ backgroundColor: c.color_hex }} />
                        <span className="text-xs font-mono text-gray-500">{c.color_hex}</span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`w-2 h-2 rounded-full inline-block ${c.is_active ? "bg-green-500" : "bg-gray-300"}`} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => startEdit(c)}
                      className="inline-flex items-center gap-1 text-blue-600 hover:underline text-xs"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
