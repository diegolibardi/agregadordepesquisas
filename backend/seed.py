#!/usr/bin/env python3
"""
Seed script — insere pesquisas eleitorais para o ES 2026.

Execute no diretorio backend/:
    python seed.py

Requer PostgreSQL rodando e as tabelas ja criadas (alembic upgrade head).

Fontes:
- Imagens fornecidas (Instituto Verita, pesquisa ES-06002/2026)
- https://pt.wikipedia.org/wiki/Pesquisas_eleitorais_para_a_eleicao_estadual_de_2026_no_Espirito_Santo
- https://www.agazeta.com.br/es/politica/pesquisa-quaest-ricardo-ferraco-lidera-disputa-pelo-governo-do-es-0326
- https://gazetadoespiritosanto.com.br/lideranca-confirmada-pazolini-aparece-a-frente-em-nova-rodada-de-pesquisa-no-es/...
- https://canalvoxnoticias.com.br/lorenzo-pazolini-lidera-com-383-na-disputa-pelo-governo-do-es-politica-capixaba/
"""

import os
import sys
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import date

DATABASE_URL = os.getenv(
    "DATABASE_URL_SYNC",
    "postgresql://agregador:password@localhost/agregador_pesquisas",
)


def get_conn():
    return psycopg2.connect(DATABASE_URL)


def upsert_institute(cur, name, slug, credibility_score, website_url=None):
    cur.execute(
        """
        INSERT INTO institutes (name, slug, credibility_score, website_url,
                                scraper_type, is_active)
        VALUES (%s, %s, %s, %s, 'manual', true)
        ON CONFLICT (slug) DO UPDATE
            SET name = EXCLUDED.name,
                credibility_score = EXCLUDED.credibility_score
        RETURNING id
        """,
        (name, slug, credibility_score, website_url),
    )
    return cur.fetchone()[0]


def upsert_candidate(cur, name, slug, party, election_type, color_hex,
                     party_number=None, photo_url=None):
    cur.execute(
        """
        INSERT INTO candidates (name, slug, party, party_number, election_type,
                                color_hex, photo_url, is_active)
        VALUES (%s, %s, %s, %s, %s, %s, %s, true)
        ON CONFLICT (slug) DO UPDATE
            SET name       = EXCLUDED.name,
                party      = EXCLUDED.party,
                color_hex  = EXCLUDED.color_hex
        RETURNING id
        """,
        (name, slug, party, party_number, election_type,
         color_hex, photo_url),
    )
    return cur.fetchone()[0]


def insert_poll(cur, institute_id, election_type, round_, poll_date,
                fieldwork_start=None, fieldwork_end=None,
                sample_size=None, margin_of_error=None,
                confidence_level=95.0, tse_registered=None,
                source_url=None, notes=None):
    """Insere ou ignora (idempotente pela unique constraint)."""
    cur.execute(
        """
        INSERT INTO polls (institute_id, election_type, round, poll_date,
                           fieldwork_start, fieldwork_end,
                           sample_size, margin_of_error, confidence_level,
                           tse_registered, source_url, notes, is_verified)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, true)
        ON CONFLICT (institute_id, poll_date, election_type, round)
        DO UPDATE SET notes = EXCLUDED.notes
        RETURNING id
        """,
        (institute_id, election_type, round_, poll_date,
         fieldwork_start, fieldwork_end,
         sample_size, margin_of_error, confidence_level,
         tse_registered, source_url, notes),
    )
    return cur.fetchone()[0]


def upsert_result(cur, poll_id, candidate_id, percentage,
                  margin_of_error=None, is_spontaneous=False):
    cur.execute(
        """
        INSERT INTO poll_results (poll_id, candidate_id, percentage,
                                  margin_of_error, is_spontaneous)
        VALUES (%s, %s, %s, %s, %s)
        ON CONFLICT (poll_id, candidate_id, is_spontaneous)
        DO UPDATE SET percentage = EXCLUDED.percentage
        """,
        (poll_id, candidate_id, percentage, margin_of_error, is_spontaneous),
    )


# ─────────────────────────────────────────────────────────────────────────────

def main():
    print("[SEED] Iniciando seed de pesquisas ES 2026...")
    conn = get_conn()
    conn.autocommit = False
    cur = conn.cursor()

    try:
        # ── INSTITUTOS ────────────────────────────────────────────────────────
        print("  -> Institutos...")
        id_verita = upsert_institute(
            cur,
            name="Instituto Nacional Verita",
            slug="verita",
            credibility_score=0.90,
            website_url="https://institutoverita.com.br",
        )
        id_quaest = upsert_institute(
            cur,
            name="Quaest (Genial Investimentos)",
            slug="quaest",
            credibility_score=0.92,
            website_url="https://quaest.com.br",
        )
        id_realtime = upsert_institute(
            cur,
            name="Real Time Big Data",
            slug="real-time-big-data",
            credibility_score=0.85,
            website_url="https://realtimebigdata.com.br",
        )
        id_parana = upsert_institute(
            cur,
            name="Parana Pesquisas",
            slug="parana-pesquisas",
            credibility_score=0.88,
            website_url="https://paranapesquisas.com.br",
        )
        id_perfil = upsert_institute(
            cur,
            name="Instituto Perfil",
            slug="instituto-perfil",
            credibility_score=0.80,
        )

        # ── CANDIDATOS — GOVERNADOR ───────────────────────────────────────────
        print("  -> Candidatos (Governador)...")
        id_pazolini = upsert_candidate(
            cur,
            name="Lorenzo Pazolini",
            slug="lorenzo-pazolini",
            party="Republicanos",
            party_number=10,
            election_type="governor",
            color_hex="#F05A28",       # laranja Republicanos
        )
        id_ferraco = upsert_candidate(
            cur,
            name="Ricardo Ferraco",
            slug="ricardo-ferraco",
            party="MDB",
            party_number=15,
            election_type="governor",
            color_hex="#009B3A",       # verde MDB
        )
        id_malta = upsert_candidate(
            cur,
            name="Magno Malta",
            slug="magno-malta",
            party="PL",
            party_number=22,
            election_type="governor",
            color_hex="#FFD700",       # amarelo PL
        )
        id_salomao = upsert_candidate(
            cur,
            name="Helder Salomao",
            slug="helder-salomao",
            party="PT",
            party_number=13,
            election_type="governor",
            color_hex="#CC0000",       # vermelho PT
        )
        id_borgo = upsert_candidate(
            cur,
            name="Arnaldinho Borgo",
            slug="arnaldinho-borgo",
            party="Podemos",
            party_number=20,
            election_type="governor",
            color_hex="#0070C0",       # azul Podemos
        )

        # ── CANDIDATOS — SENADOR ──────────────────────────────────────────────
        print("  -> Candidatos (Senador)...")
        id_casagrande = upsert_candidate(
            cur,
            name="Renato Casagrande",
            slug="renato-casagrande",
            party="PSB",
            party_number=40,
            election_type="senator",
            color_hex="#FF8C00",       # laranja PSB
        )
        id_contarato = upsert_candidate(
            cur,
            name="Fabiano Contarato",
            slug="fabiano-contarato",
            party="PT",
            party_number=13,
            election_type="senator",
            color_hex="#CC0000",
        )
        id_evair = upsert_candidate(
            cur,
            name="Evair de Melo",
            slug="evair-de-melo",
            party="Republicanos",
            party_number=10,
            election_type="senator",
            color_hex="#F05A28",
        )
        id_hartung = upsert_candidate(
            cur,
            name="Paulo Hartung",
            slug="paulo-hartung",
            party="PSD",
            party_number=55,
            election_type="senator",
            color_hex="#1F4E79",
        )

        # ── PESQUISAS ─────────────────────────────────────────────────────────

        # 1. VERITÁ — Governador 1o turno
        # Campo: 18–24 mar 2026 | N=1220 | ±3,0 pp | IC 95%
        # TSE: BR-09554/2026 / TRE-ES: ES-06002/2026
        # Fonte: imagens + canalvoxnoticias.com.br
        # Percentuais: votos validos (estimulado)
        print("  -> Verita — Governador 1o turno...")
        p1 = insert_poll(
            cur,
            institute_id=id_verita,
            election_type="governor",
            round_=1,
            poll_date=date(2026, 3, 24),
            fieldwork_start=date(2026, 3, 18),
            fieldwork_end=date(2026, 3, 24),
            sample_size=1220,
            margin_of_error=3.0,
            confidence_level=95.0,
            tse_registered="ES-06002/2026",
            source_url="https://canalvoxnoticias.com.br/lorenzo-pazolini-lidera-com-383-na-disputa-pelo-governo-do-es-politica-capixaba/",
            notes="Intencao estimulada — votos validos. TSE federal: BR-09554/2026",
        )
        for cand_id, pct in [
            (id_pazolini, 32.0),
            (id_ferraco,  22.3),
            (id_malta,    19.6),
            (id_salomao,  19.0),
            (id_borgo,     7.1),
        ]:
            upsert_result(cur, p1, cand_id, pct, margin_of_error=3.0)

        # 2. VERITÁ — Senador 1o turno (mesma pesquisa)
        print("  -> Verita — Senador 1o turno...")
        p2 = insert_poll(
            cur,
            institute_id=id_verita,
            election_type="senator",
            round_=1,
            poll_date=date(2026, 3, 24),
            fieldwork_start=date(2026, 3, 18),
            fieldwork_end=date(2026, 3, 24),
            sample_size=1220,
            margin_of_error=3.0,
            confidence_level=95.0,
            tse_registered="ES-06002/2026",
            source_url="https://canalvoxnoticias.com.br/lorenzo-pazolini-lidera-com-383-na-disputa-pelo-governo-do-es-politica-capixaba/",
            notes="Intencao estimulada — votos validos. Outros: 39,5% | NS/NR: 32,7% | Branco/Nulo: 17,3%",
        )
        for cand_id, pct in [
            (id_casagrande, 29.1),
            (id_contarato,  19.2),
            (id_evair,      12.2),
        ]:
            upsert_result(cur, p2, cand_id, pct, margin_of_error=3.0)

        # 3. QUAEST — Governador 1o turno
        # Campo: 22–25 mar 2026 | N=1104 | ±3,0 pp | IC 95%
        # TSE: ES-09728/2026
        # Fonte: agazeta.com.br
        # Cenario 1 (4 candidatos) — intencao total (33% indecisos)
        print("  -> Quaest — Governador 1o turno...")
        p3 = insert_poll(
            cur,
            institute_id=id_quaest,
            election_type="governor",
            round_=1,
            poll_date=date(2026, 3, 25),
            fieldwork_start=date(2026, 3, 22),
            fieldwork_end=date(2026, 3, 25),
            sample_size=1104,
            margin_of_error=3.0,
            confidence_level=95.0,
            tse_registered="ES-09728/2026",
            source_url="https://www.agazeta.com.br/es/politica/pesquisa-quaest-ricardo-ferraco-lidera-disputa-pelo-governo-do-es-0326",
            notes="Cenario 1 (4 candidatos) — intencao total do eleitorado; 33% indecisos",
        )
        for cand_id, pct in [
            (id_ferraco,  26.0),
            (id_malta,    18.0),
            (id_pazolini, 17.0),
            (id_borgo,     6.0),
        ]:
            upsert_result(cur, p3, cand_id, pct, margin_of_error=3.0)

        # 4. QUAEST — Governador 2o turno (Pazolini × Ferraco)
        print("  -> Quaest — Governador 2o turno...")
        p4 = insert_poll(
            cur,
            institute_id=id_quaest,
            election_type="governor",
            round_=2,
            poll_date=date(2026, 3, 25),
            fieldwork_start=date(2026, 3, 22),
            fieldwork_end=date(2026, 3, 25),
            sample_size=1104,
            margin_of_error=3.0,
            confidence_level=95.0,
            tse_registered="ES-09728/2026",
            source_url="https://www.agazeta.com.br/es/politica/pesquisa-quaest-ricardo-ferraco-lidera-disputa-pelo-governo-do-es-0326",
            notes="Simulacao Pazolini × Ferraco — intencao total; 33% indecisos",
        )
        for cand_id, pct in [
            (id_pazolini, 34.0),
            (id_ferraco,  33.0),
        ]:
            upsert_result(cur, p4, cand_id, pct, margin_of_error=3.0)

        # 5. REAL TIME BIG DATA — Governador 1o turno (sem 2o turno)
        # Campo: 13–14 mar 2026 | N=2000 | ±2,0 pp
        # Fonte: Wikipedia
        # Cenario 1 — intencao total
        print("  -> Real Time Big Data — Governador 1o turno...")
        p5 = insert_poll(
            cur,
            institute_id=id_realtime,
            election_type="governor",
            round_=1,
            poll_date=date(2026, 3, 14),
            fieldwork_start=date(2026, 3, 13),
            fieldwork_end=date(2026, 3, 14),
            sample_size=2000,
            margin_of_error=2.0,
            confidence_level=95.0,
            notes="Cenario 1 — intencao total do eleitorado (2o turno nao simulado)",
        )
        for cand_id, pct in [
            (id_pazolini, 35.0),
            (id_ferraco,  35.0),
            (id_salomao,   8.0),
        ]:
            upsert_result(cur, p5, cand_id, pct, margin_of_error=2.0)

        # 6. PARANÁ PESQUISAS — Governador 1o turno
        # Campo: 8–11 mar 2026 | N=1500 | ±2,6 pp
        # Fonte: Wikipedia
        # Cenario 1 — votos validos
        print("  -> Parana Pesquisas — Governador 1o turno...")
        p6 = insert_poll(
            cur,
            institute_id=id_parana,
            election_type="governor",
            round_=1,
            poll_date=date(2026, 3, 11),
            fieldwork_start=date(2026, 3, 8),
            fieldwork_end=date(2026, 3, 11),
            sample_size=1500,
            margin_of_error=2.6,
            confidence_level=95.0,
            notes="Cenario 1 — votos validos",
        )
        for cand_id, pct in [
            (id_pazolini, 42.0),
            (id_ferraco,  36.1),
            (id_salomao,   9.1),
        ]:
            upsert_result(cur, p6, cand_id, pct, margin_of_error=2.6)

        # 7. PARANÁ PESQUISAS — Governador 2o turno
        print("  -> Parana Pesquisas — Governador 2o turno...")
        p7 = insert_poll(
            cur,
            institute_id=id_parana,
            election_type="governor",
            round_=2,
            poll_date=date(2026, 3, 11),
            fieldwork_start=date(2026, 3, 8),
            fieldwork_end=date(2026, 3, 11),
            sample_size=1500,
            margin_of_error=2.6,
            confidence_level=95.0,
            notes="Simulacao Pazolini × Ferraco — votos validos; 11,8% indecisos",
        )
        for cand_id, pct in [
            (id_pazolini, 47.3),
            (id_ferraco,  40.8),
        ]:
            upsert_result(cur, p7, cand_id, pct, margin_of_error=2.6)

        # 8. INSTITUTO PERFIL — Governador 1o turno
        # N=1800 | ±2,3 pp | IC 95% | TSE: ES-04143/2026
        # Fonte: gazetadoespiritosanto.com.br
        # Nota: data de campo nao informada; apenas Pazolini identificado na fonte
        print("  -> Instituto Perfil — Governador 1o turno...")
        p8 = insert_poll(
            cur,
            institute_id=id_perfil,
            election_type="governor",
            round_=1,
            poll_date=date(2026, 4, 10),   # data aproximada — confirmar
            sample_size=1800,
            margin_of_error=2.3,
            confidence_level=95.0,
            tse_registered="ES-04143/2026",
            source_url="https://gazetadoespiritosanto.com.br/lideranca-confirmada-pazolini-aparece-a-frente-em-nova-rodada-de-pesquisa-no-es/espirito-santo/noticias/politica/eleicoes/",
            notes="Data de campo nao divulgada — usando data aproximada. 2o colocado com 26,83% nao identificado na fonte.",
        )
        upsert_result(cur, p8, id_pazolini, 39.11, margin_of_error=2.3)

        conn.commit()
        print("\n[OK]  Seed concluido com sucesso!")
        print(f"   Institutos: 5 | Candidatos: 9 | Pesquisas: 8 | Resultados: 27+")

    except Exception as exc:
        conn.rollback()
        print(f"\n❌  Erro durante o seed: {exc}", file=sys.stderr)
        raise
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    main()
