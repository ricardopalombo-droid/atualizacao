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


def main():
    parser = argparse.ArgumentParser(
        description="Busca um cadastro finalizado no site e executa a automacao legada do Phoenix."
    )
    parser.add_argument("--base-url", required=True, help="Ex.: https://www.palsys.com.br")
    parser.add_argument("--email", required=True, help="Login do cliente no sistema")
    parser.add_argument("--password", required=True, help="Senha do cliente no sistema")
    parser.add_argument("--employee-id", required=True, help="ID do funcionario finalizado")
    parser.add_argument(
        "--legacy-script",
        required=True,
        help=r"Caminho do seu cadastros_final.py existente",
    )
    parser.add_argument(
        "--empresa-habilitada",
        default="S",
        choices=["S", "N"],
        help="Mesmo parametro usado hoje no robô legado",
    )
    parser.add_argument(
        "--empresa-rateio",
        default="N",
        choices=["S", "N"],
        help="Mesmo parametro usado hoje no robô legado",
    )
    parser.add_argument(
        "--overrides-file",
        help="JSON opcional com ajustes por empresa para colunas do formato legado, ex.: DG, DI, DJ, DK, DH",
    )

    args = parser.parse_args()

    session = requests.Session()
    login(session, args.base_url, args.email, args.password)
    payload = fetch_payload(session, args.base_url, args.employee_id)
    legacy_columns = payload["legacyColumns"]
    legacy_columns.update(load_overrides(args.overrides_file))

    legacy_script_path = Path(args.legacy_script)
    if not legacy_script_path.exists():
        raise RuntimeError(f"Script legado nao encontrado: {legacy_script_path}")

    legacy = load_legacy_module(legacy_script_path)
    legacy.PARAR_PROCESSO = False
    legacy.PAUSADO = False
    legacy.EM_EXECUCAO = True

    try:
        if hasattr(legacy, "configurar_atalhos"):
            legacy.configurar_atalhos()

        legacy.ativar_janela_contmatic()
        legacy.abrir_rotina_uma_vez()
        legacy.preencher_sistema(legacy_columns, args.empresa_habilitada, args.empresa_rateio)
        print(f"Preenchimento disparado com sucesso para o funcionario {payload['employeeId']}.")
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
