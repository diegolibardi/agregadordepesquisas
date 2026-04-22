"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart2, Lock } from "lucide-react";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const validUser = process.env.NEXT_PUBLIC_ADMIN_USER ?? "admin";
    const validPass = process.env.NEXT_PUBLIC_ADMIN_KEY ?? "";
    if (username === validUser && password === validPass) {
      sessionStorage.setItem("admin_auth", validPass);
      sessionStorage.setItem("admin_user", username);
      router.push("/admin");
    } else {
      setError(true);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-sm border w-full max-w-sm">
        <div className="flex items-center gap-2 mb-2">
          <BarChart2 className="w-6 h-6 text-blue-700" />
          <span className="font-bold text-blue-700 text-lg">Agregador Capixaba 2026</span>
        </div>
        <div className="flex items-center gap-2 mb-6 text-gray-500">
          <Lock className="w-4 h-4" />
          <span className="text-sm">Acesso Administrativo</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Usuário</label>
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(false); }}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="nome de usuário"
              autoFocus
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false); }}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          {error && (
            <p className="text-xs text-red-600">Usuário ou senha incorretos.</p>
          )}
          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
