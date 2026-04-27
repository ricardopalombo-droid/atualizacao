import argparse
import importlib.util
import json
import sys
from pathlib import Path

import requests


def load_legacy_module(script_path: Path):
    spec = importlib.util.spec_from_file_location("phoenix_legacy", script_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Nao foi possivel carregar o script legado: {script_path}")

    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def login(session: requests.Session, base_url: str, email: str, password: str):
    response = session.post(
        f"{base_url.rstrip('/')}/api/auth/login",
        json={"email": email, "password": password},
        timeout=30,
    )

    if response.status_code >= 400:
        raise RuntimeError(f"Falha no login: {response.text}")


def fetch_payload(session: requests.Session, base_url: str, employee_id: str):
    response = session.get(
        f"{base_url.rstrip('/')}/api/cadastros/phoenix",
        params={"id": employee_id},
        timeout=30,
    )

    if response.status_code >= 400:
        raise RuntimeError(f"Falha ao buscar payload do Phoenix: {response.text}")

    data = response.json()
    if not data.get("ok") or "payload" not in data:
        raise RuntimeError(f"Resposta invalida ao buscar payload do Phoenix: {data}")

    return data["payload"]


def load_overrides(path: str | None):
    if not path:
        return {}

    file_path = Path(path)
    if not file_path.exists():
        raise RuntimeError(f"Arquivo de overrides nao encontrado: {file_path}")

    with file_path.open("r", encoding="utf-8") as handle:
        data = json.load(handle)

    return {str(key): "" if value is None else str(value) for key, value in data.items()}


def print_preview(payload: dict, legacy_columns: dict):
    print("")
    print("Preview do mapeamento atual para o script legado")
    print("-" * 60)
    preview_fields = [
        ("A", "Registro", legacy_columns.get("A", "")),
        ("B", "Nome completo", legacy_columns.get("B", "")),
        ("C", "Endereco composto", legacy_columns.get("C", "")),
        ("D", "Telefone", legacy_columns.get("D", "")),
        ("E", "Celular", legacy_columns.get("E", "")),
        ("F", "Nome da mae", legacy_columns.get("F", "")),
        ("G", "Nome do pai", legacy_columns.get("G", "")),
        ("H", "E-mail", legacy_columns.get("H", "")),
        ("I", "Data nascimento", legacy_columns.get("I", "")),
        ("J", "Pais origem", legacy_columns.get("J", "")),
        ("K", "Naturalidade", legacy_columns.get("K", "")),
        ("U", "Data admissao", legacy_columns.get("U", "")),
        ("Y", "Sindicato", legacy_columns.get("Y", "")),
        ("Z", "Categoria normativa", legacy_columns.get("Z", "")),
        ("AA", "Tipo contrato", legacy_columns.get("AA", "")),
        ("AB", "Salario", legacy_columns.get("AB", "")),
        ("EXTRA_HORAS_SEMANAIS", "Horas semanais", legacy_columns.get("EXTRA_HORAS_SEMANAIS", "")),
        ("EXTRA_HORAS_MENSAIS", "Horas mensais", legacy_columns.get("EXTRA_HORAS_MENSAIS", "")),
        ("EXTRA_FORMA_PAGAMENTO", "Forma pagamento", legacy_columns.get("EXTRA_FORMA_PAGAMENTO", "")),
        ("EXTRA_TIPO_PAGAMENTO", "Tipo pagamento", legacy_columns.get("EXTRA_TIPO_PAGAMENTO", "")),
        ("EXTRA_REGIME_JORNADA", "Regime jornada", legacy_columns.get("EXTRA_REGIME_JORNADA", "")),
        ("AC", "Funcao/Cargo", legacy_columns.get("AC", "")),
        ("AD", "CBO", legacy_columns.get("AD", "")),
        ("AF", "Horario", legacy_columns.get("AF", "")),
        ("AQ", "CPF", legacy_columns.get("AQ", "")),
        ("DN", "Grau risco", legacy_columns.get("DN", "")),
        ("DO", "Vinculo empregaticio", legacy_columns.get("DO", "")),
        ("DP", "Indicativo admissao", legacy_columns.get("DP", "")),
        ("DQ", "CAGED", legacy_columns.get("DQ", "")),
    ]

    for key, label, value in preview_fields:
        print(f"{key:>3} | {label:<24} | {value}")

    print("-" * 60)
    print(f"Funcionario: {payload['employeeId']}")
    print("")


def main():
    parser = argparse.ArgumentParser(
        description="Usa o cadastros_final.py legado, mas alimentando as colunas A/B/C... com os dados do site em vez da planilha."
    )
    parser.add_argument("--base-url", required=True, help="Ex.: https://www.palsys.com.br")
    parser.add_argument("--email", required=True, help="Login do cliente no sistema")
    parser.add_argument("--password", required=True, help="Senha do cliente no sistema")
    parser.add_argument("--employee-id", required=True, help="ID do funcionario finalizado")
    parser.add_argument("--legacy-script", required=True, help=r"Caminho do cadastros_final.py")
    parser.add_argument("--empresa-habilitada", default="S", choices=["S", "N"])
    parser.add_argument("--empresa-rateio", default="N", choices=["S", "N"])
    parser.add_argument("--overrides-file")
    parser.add_argument("--preview-only", action="store_true", help="Mostra as colunas montadas e nao dispara o Phoenix")
    parser.add_argument("--dump-legacy-json", help="Salva o dicionario de colunas legado em um JSON local")
    args = parser.parse_args()

    session = requests.Session()
    login(session, args.base_url, args.email, args.password)
    payload = fetch_payload(session, args.base_url, args.employee_id)
    legacy_columns = payload["legacyColumns"]
    form_data = payload.get("formData", {})
    legacy_columns.update(
        {
            "EXTRA_HORAS_SEMANAIS": "" if form_data.get("horas_semanais") is None else str(form_data.get("horas_semanais")),
            "EXTRA_HORAS_MENSAIS": "" if form_data.get("horas_mensais") is None else str(form_data.get("horas_mensais")),
            "EXTRA_EXPERIENCIA_QTDE_DIAS": "" if form_data.get("experiencia_qtde_dias") is None else str(form_data.get("experiencia_qtde_dias")),
            "EXTRA_EXPERIENCIA_QTDE_DIAS_PRORROGACAO": "" if form_data.get("experiencia_qtde_dias_prorrogacao") is None else str(form_data.get("experiencia_qtde_dias_prorrogacao")),
            "EXTRA_REGISTRO_FUNCIONARIO": "" if form_data.get("registro_funcionario") is None else str(form_data.get("registro_funcionario")),
            "EXTRA_FOLHA_FICHA": "" if form_data.get("folha_ficha") is None else str(form_data.get("folha_ficha")),
            "EXTRA_CHAPA": "" if form_data.get("chapa") is None else str(form_data.get("chapa")),
            "EXTRA_FORMA_PAGAMENTO": "" if form_data.get("forma_pagamento") is None else str(form_data.get("forma_pagamento")),
            "EXTRA_TIPO_PAGAMENTO": "" if form_data.get("tipo_pagamento") is None else str(form_data.get("tipo_pagamento")),
            "EXTRA_REGIME_JORNADA": "" if form_data.get("regime_jornada") is None else str(form_data.get("regime_jornada")),
            "EXTRA_TIPO_TRIBUTACAO_SINDICAL": "" if form_data.get("tipo_tributacao_sindical") is None else str(form_data.get("tipo_tributacao_sindical")),
            "EXTRA_CARGO_CODIGO": "" if form_data.get("cargo") is None else str(form_data.get("cargo")),
            "EXTRA_CARGO_DESCRICAO": "" if form_data.get("cargo_descricao") is None else str(form_data.get("cargo_descricao")),
            "EXTRA_HORARIO_CODIGO": "" if form_data.get("horario") is None else str(form_data.get("horario")),
            "EXTRA_HORARIO_DESCRICAO": "" if form_data.get("horario_descricao") is None else str(form_data.get("horario_descricao")),
            "EXTRA_DEFICIENCIA_FISICA": "" if form_data.get("deficiencia_fisica") is None else str(form_data.get("deficiencia_fisica")),
            "EXTRA_DEFICIENCIA_VISUAL": "" if form_data.get("deficiencia_visual") is None else str(form_data.get("deficiencia_visual")),
            "EXTRA_DEFICIENCIA_AUDITIVA": "" if form_data.get("deficiencia_auditiva") is None else str(form_data.get("deficiencia_auditiva")),
            "EXTRA_DEFICIENCIA_MENTAL": "" if form_data.get("deficiencia_mental") is None else str(form_data.get("deficiencia_mental")),
            "EXTRA_DEFICIENCIA_INTELECTUAL": "" if form_data.get("deficiencia_intelectual") is None else str(form_data.get("deficiencia_intelectual")),
            "EXTRA_PREENCHE_COTA_PCD": "" if form_data.get("preenche_cota_pcd") is None else str(form_data.get("preenche_cota_pcd")),
            "EXTRA_OBSERVACAO_DEFICIENCIA": "" if form_data.get("observacao_deficiencia") is None else str(form_data.get("observacao_deficiencia")),
            "EXTRA_PERCEPCAO_SEGURO_DESEMPREGO": "" if form_data.get("percepcao_seguro_desemprego") is None else str(form_data.get("percepcao_seguro_desemprego")),
        }
    )
    legacy_columns.update(load_overrides(args.overrides_file))

    if args.dump_legacy_json:
        dump_path = Path(args.dump_legacy_json)
        dump_path.write_text(json.dumps(legacy_columns, ensure_ascii=False, indent=2), encoding="utf-8")

    print_preview(payload, legacy_columns)

    if args.preview_only:
        print("Preview concluido. Nenhuma automacao foi disparada.")
        return

    legacy_script_path = Path(args.legacy_script)
    if not legacy_script_path.exists():
        raise RuntimeError(f"Script legado nao encontrado: {legacy_script_path}")

    legacy = load_legacy_module(legacy_script_path)
    legacy.PARAR_PROCESSO = False
    legacy.PAUSADO = False
    legacy.EM_EXECUCAO = True

    try:
        # Nao configuramos atalhos aqui para evitar o pause inesperado do legado.
        legacy.ativar_janela_contmatic()
        legacy.abrir_rotina_uma_vez()
        legacy.preencher_sistema(legacy_columns, args.empresa_habilitada, args.empresa_rateio)
        print(f"Preenchimento legado disparado com sucesso para o funcionario {payload['employeeId']}.")
    finally:
        legacy.EM_EXECUCAO = False
        listener = getattr(legacy, "LISTENER_TECLADO", None)
        if listener is not None:
            try:
                listener.stop()
            except Exception:
                pass


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Erro: {error}", file=sys.stderr)
        sys.exit(1)
