# Agregador de Pesquisas Eleitorais — ES

Plataforma para agregação, visualização e monitoramento de pesquisas eleitorais do Espírito Santo.

## Estrutura do Projeto

```
Agregador de Pesquisas/
├── backend/     # API Python FastAPI
├── scraper/     # Importador automático de pesquisas
└── frontend/    # Interface Next.js 14
```

## Pré-requisitos

- Python 3.11+ com pip
- Node.js 18+ com npm
- PostgreSQL 16

## Setup — Backend

```bash
cd backend
python -m venv .venv

# Windows:
.venv\Scripts\activate

# Linux/Mac:
source .venv/bin/activate

pip install -r requirements.txt

# Configurar banco de dados
cp .env.example .env
# Editar .env com DATABASE_URL e ADMIN_API_KEY

# Criar as tabelas
alembic upgrade head

# Iniciar API
uvicorn app.main:app --reload --port 8000
```

API disponível em: `http://localhost:8000`
Documentação Swagger: `http://localhost:8000/docs`

## Setup — Scraper

```bash
cd scraper
pip install -r requirements.txt

cp .env.example .env
# Editar .env com API_BASE_URL e ADMIN_API_KEY

# Executar manualmente (uma vez):
python run_scraper.py

# Listar institutos configurados:
python run_scraper.py --list

# Executar apenas um instituto (ex: ID 1):
python run_scraper.py --id 1

# Iniciar agendador (06h BRT diariamente):
python scheduler.py
```

## Setup — Frontend

```bash
cd frontend
npm install

cp .env.local.example .env.local
# Editar .env.local com NEXT_PUBLIC_API_URL e NEXT_PUBLIC_ADMIN_KEY

npm run dev
```

Site disponível em: `http://localhost:3000`

## Fluxo de Uso

### Adicionando institutos e candidatos

1. Acessar `http://localhost:3000/admin/candidatos` → criar candidatos
2. Acessar `http://localhost:3000/admin/institutos` → criar institutos com `scraper_type` e `source_urls`
3. Acessar `http://localhost:3000/admin/scraper` → executar o scraper manualmente

### Adicionando pesquisas manualmente

Use a API diretamente (via Swagger em `/docs`):

```http
POST /api/v1/admin/polls
X-Admin-Key: {sua-chave}
Content-Type: application/json

{
  "institute_id": 1,
  "election_type": "governor",
  "round": 1,
  "poll_date": "2026-04-10",
  "sample_size": 1200,
  "margin_of_error": 2.8,
  "methodology": "telephone",
  "results": [
    {"candidate_id": 1, "percentage": 42.5},
    {"candidate_id": 2, "percentage": 35.0},
    {"candidate_id": 3, "percentage": 15.0}
  ]
}
```

## Metodologia de Agregação

A média ponderada utiliza três fatores:

| Fator | Fórmula |
|-------|---------|
| Credibilidade | Score configurável por instituto (0–100%) |
| Tamanho da amostra | `min(sample_size / 1000, 1.0)` |
| Recência | `e^(-λ × dias_antigos)` com λ=0.05 (~14 dias de meia-vida) |

**Fórmula final:**
```
agregado = Σ(percentagem_i × peso_i) / Σ(peso_i)
peso_i = credibilidade × fator_amostra × fator_recência
```

## Páginas

| URL | Descrição |
|-----|-----------|
| `/dashboard` | Placar agregado por cargo e turno |
| `/pesquisas` | Tabela de todas as pesquisas com filtros |
| `/pesquisas/{id}` | Detalhe de uma pesquisa |
| `/tendencias` | Gráficos de evolução temporal |
| `/institutos` | Lista de institutos e credibilidade |
| `/comparar` | Comparação entre candidatos |
| `/admin` | Painel administrativo |

## Deploy (Produção)

### Backend (Linux + systemd)

```ini
# /etc/systemd/system/agregador-backend.service
[Unit]
Description=Agregador Pesquisas — Backend API
After=network.target postgresql.service

[Service]
User=ubuntu
WorkingDirectory=/opt/agregador/backend
Environment="PATH=/opt/agregador/backend/.venv/bin"
EnvironmentFile=/opt/agregador/backend/.env
ExecStart=/opt/agregador/backend/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 2
Restart=always

[Install]
WantedBy=multi-user.target
```

### Frontend (Vercel)

1. Push o repositório para GitHub
2. Importar em vercel.com
3. Configurar `NEXT_PUBLIC_API_URL` e `NEXT_PUBLIC_ADMIN_KEY` nas variáveis de ambiente

### Nginx (reverse proxy)

```nginx
server {
    server_name agregador.es.gov.br;

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
    }
}
```

## Segurança

- `ADMIN_API_KEY` deve ter pelo menos 32 caracteres aleatórios
- Nunca commitar arquivos `.env` ou `.env.local`
- Em produção, configurar CORS apenas para o domínio oficial
- Nenhum dado pessoal de eleitores é armazenado (conformidade LGPD)
