"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getInstitutes, adminCreateInstitute, adminUpdateInstitute } from "@/lib/api";
import type { InstituteOut } from "@/types/api";
import { Plus, Edit2, Save, X } from "lucide-react";

const emptyForm = {
  name: "", slug: "", credibility_score: 1.0, website_url: "",
  scraper_type: "html", is_active: true,
};

export default function AdminInstitutosPage() {
  const [editing, setEditing] = useState<Partial<InstituteOut> & { id?: number } | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const qc = useQueryClient();

  const { data: institutes, isLoading } = useQuery({
    queryKey: ["institutes-all"],
    queryFn: () => getInstitutes(false),
  });

  const save = useMutation({
    mutationFn: () =>
      isNew
        ? adminCreateInstitute(form)
        : adminUpdateInstitute(editing!.id!, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["institutes-all"] });
      setEditing(null);
      setIsNew(false);
    },
  });

  const startEdit = (inst: InstituteOut) => {
    setIsNew(false);
    setEditing(inst);
    setForm({
      name: inst.name, slug: inst.slug,
      credibility_score: inst.credibility_score,
      website_url: inst.website_url ?? "",
      scraper_type: inst.scraper_type,
      is_active: inst.is_active,
    });
  };

  const startNew = () => {
    setIsNew(true);
    setEditing({});
    setForm(emptyForm);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Institutos</h1>
        <button
          onClick={startNew}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> Novo instituto
        </button>
      </div>

      {/* Form modal */}
      {editing !== null && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            {isNew ? "Novo Instituto" : `Editando: ${editing.name}`}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: "name", label: "Nome", type: "text" },
              { key: "slug", label: "Slug", type: "text" },
              { key: "website_url", label: "Site", type: "text" },
            ].map(({ key, label, type }) => (
              <div key={key}>
                <label className="block text-xs text-gray-600 mb-1">{label}</label>
                <input
                  type={type}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={(form as Record<string, unknown>)[key] as string}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                />
              </div>
            ))}
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Credibilidade ({Math.round(form.credibility_score * 100)}%)
              </label>
              <input
                type="range" min="0" max="1" step="0.01"
                className="w-full"
                value={form.credibility_score}
                onChange={(e) => setForm((f) => ({ ...f, credibility_score: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Tipo de scraper</label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={form.scraper_type}
                onChange={(e) => setForm((f) => ({ ...f, scraper_type: e.target.value }))}
              >
                {["html", "pdf", "dynamic", "manual"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox" id="is_active"
                checked={form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              />
              <label htmlFor="is_active" className="text-sm text-gray-700">Ativo</label>
            </div>
          </div>
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
                <th className="text-left px-4 py-3 font-medium">Slug</th>
                <th className="text-left px-4 py-3 font-medium">Credibilidade</th>
                <th className="text-left px-4 py-3 font-medium">Tipo</th>
                <th className="text-center px-4 py-3 font-medium">Ativo</th>
                <th className="text-right px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {institutes?.map((inst) => (
                <tr key={inst.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{inst.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{inst.slug}</td>
                  <td className="px-4 py-3 text-gray-600">{Math.round(inst.credibility_score * 100)}%</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-xs bg-gray-100 font-mono">{inst.scraper_type}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`w-2 h-2 rounded-full inline-block ${inst.is_active ? "bg-green-500" : "bg-gray-300"}`} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => startEdit(inst)}
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
