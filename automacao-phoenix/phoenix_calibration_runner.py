import argparse
import importlib.util
import json
import sys
from datetime import datetime
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


def save_notes(path: Path, notes: list[dict]):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(notes, handle, ensure_ascii=False, indent=2)


def prompt(message: str):
    return input(message).strip().lower()


class CalibrationContext:
    def __init__(self, notes_file: Path, expected_steps: list[dict]):
        self.notes_file = notes_file
        self.expected_steps = expected_steps
        self.notes: list[dict] = []
        self.current_step_index = 0

    def next_meta(self, helper_name: str, arg_value):
        if self.current_step_index < len(self.expected_steps):
            expected = self.expected_steps[self.current_step_index]
            if expected["helper"] == helper_name:
                self.current_step_index += 1
                return {
                    **expected,
                    "runtimeValue": "" if arg_value is None else str(arg_value),
                }

        return {
            "helper": helper_name,
            "label": f"Acao nao mapeada ({helper_name})",
            "sourceKey": "",
            "legacyKey": "",
            "runtimeValue": "" if arg_value is None else str(arg_value),
        }

    def record_issue(self, meta: dict):
        origem = input("Qual campo do nosso sistema deveria alimentar isso? ").strip()
        como_preencher = input("Como o Phoenix deveria ser preenchido aqui? ").strip()
        observacao = input("Observacao extra (opcional): ").strip()

        self.notes.append(
            {
                "timestamp": datetime.now().isoformat(timespec="seconds"),
                "label": meta.get("label", ""),
                "helper": meta.get("helper", ""),
                "sourceKey": meta.get("sourceKey", ""),
                "legacyKey": meta.get("legacyKey", ""),
                "runtimeValue": meta.get("runtimeValue", ""),
                "expectedSourceField": origem,
                "phoenixFillInstruction": como_preencher,
                "notes": observacao,
            }
        )
        save_notes(self.notes_file, self.notes)


def build_expected_steps(payload: dict):
    form_data = payload.get("formData", {})
    legacy = payload.get("legacyColumns", {})

    def step(helper, label, source_key="", legacy_key="", fallback=""):
        value = form_data.get(source_key, legacy.get(legacy_key, fallback)) if source_key else legacy.get(legacy_key, fallback)
        return {
            "helper": helper,
            "label": label,
            "sourceKey": source_key,
            "legacyKey": legacy_key,
            "value": "" if value is None else str(value),
        }

    return [
        step("escrever_e_tab", "Codigo/registro do funcionario", "registro_funcionario", "A"),
        step("escrever_e_tab", "Nome completo", "nome_completo", "B"),
        step("limpar_e_digitar", "Data de admissao", "data_admissao", "U"),
        step("escrever", "CEP", "cep", "C"),
        step("escrever_e_tab", "Telefone", "telefone", "F"),
        step("escrever_e_tab", "Celular", "celular", "G"),
        step("escrever", "Codigo/configuracao eSocial da empresa", "codigo_evento_esocial", "DH"),
        step("escrever", "E-mail", "email", "H"),
        step("escrever_e_tab", "Nome da mae", "nome_mae", "D"),
        step("escrever_e_tab", "Nome do pai", "nome_pai", "E"),
        step("selecionar_sexo", "Sexo", "sexo", "N"),
        step("selecionar_estado_civil", "Estado civil", "estado_civil", "O"),
        step("selecionar_raca_cor", "Raca/cor", "raca_cor", "M"),
        step("limpar_e_digitar", "Data de nascimento", "data_nascimento", "I"),
        step("escrever", "Pais de origem", "pais_origem", "J"),
        step("escrever", "Naturalidade", "naturalidade", "K"),
        step("escrever", "Sindicato", "sindicato", "Y"),
        step("limpar_e_digitar", "Salario", "salario", "AB"),
        step("limpar_e_digitar", "Cargo", "cargo", "AC"),
        step("limpar_e_digitar", "Horario", "horario", "AF"),
        step("limpar_e_digitar", "Banco", "banco", "AG"),
        step("limpar_e_digitar", "Agencia", "agencia", "AH"),
        step("selecionar_nacionalidade", "Nacionalidade", "nacionalidade", "AK"),
        step("selecionar_grau_instrucao", "Grau de instrucao", "grau_instrucao", "AL"),
        step("selecionar_vinculo_empregaticio", "Vinculo empregaticio", "vinculo_empregaticio", "DO"),
        step("selecionar_codigo_admissao", "Indicativo admissao", "indicativo_admissao", "DP"),
        step("selecionar_grau_risco", "Grau de risco", "grau_risco", "DN"),
        step("selecionar_caged", "Situacao CAGED entrada", "caged", "DQ"),
        step("escrever", "CPF", "cpf", "AQ"),
        step("escrever", "PIS", "pis", "AO"),
        step("escrever", "RG", "rg_numero", "AP"),
    ]


def attach_calibration_wrappers(legacy, context: CalibrationContext):
    helper_names = [
        "escrever_e_tab",
        "escrever",
        "limpar_e_digitar",
        "selecionar_sexo",
        "selecionar_estado_civil",
        "selecionar_raca_cor",
        "selecionar_nacionalidade",
        "selecionar_grau_instrucao",
        "selecionar_vinculo_empregaticio",
        "selecionar_codigo_admissao",
        "selecionar_grau_risco",
        "selecionar_caged",
    ]

    for helper_name in helper_names:
        original = getattr(legacy, helper_name, None)
        if original is None:
            continue

        def build_wrapper(fn, name):
            def wrapper(*args, **kwargs):
                meta = context.next_meta(name, args[0] if args else "")

                print("\n" + "=" * 72)
                print(f"Etapa: {meta['label']}")
                if meta.get("sourceKey"):
                    print(f"Campo do nosso sistema: {meta['sourceKey']}")
                if meta.get("legacyKey"):
                    print(f"Coluna/legado: {meta['legacyKey']}")
                print(f"Valor enviado: {meta.get('runtimeValue', '')}")
                print(f"Acao: {name}")

                decision = prompt("[Enter] executa | s pula | q encerra: ")
                if decision == "q":
                    raise SystemExit("Calibracao encerrada pelo usuario.")
                if decision == "s":
                    print("Etapa pulada.")
                    return None

                result = fn(*args, **kwargs)

                confirm = prompt("Ficou certo no Phoenix? [Enter/s]=sim | n=nao: ")
                if confirm == "n":
                    context.record_issue(meta)
                    print(f"Ajuste registrado em: {context.notes_file}")

                return result

            return wrapper

        setattr(legacy, helper_name, build_wrapper(original, helper_name))


def main():
    parser = argparse.ArgumentParser(
        description="Executa o robô legado do Phoenix em modo de calibracao, confirmando etapa por etapa."
    )
    parser.add_argument("--base-url", required=True)
    parser.add_argument("--email", required=True)
    parser.add_argument("--password", required=True)
    parser.add_argument("--employee-id", required=True)
    parser.add_argument("--legacy-script", required=True)
    parser.add_argument("--empresa-habilitada", default="S", choices=["S", "N"])
    parser.add_argument("--empresa-rateio", default="N", choices=["S", "N"])
    parser.add_argument("--overrides-file")
    parser.add_argument("--notes-file", default="phoenix-calibration-notes.json")
    args = parser.parse_args()

    session = requests.Session()
    login(session, args.base_url, args.email, args.password)
    payload = fetch_payload(session, args.base_url, args.employee_id)
    payload["legacyColumns"].update(load_overrides(args.overrides_file))

    legacy = load_legacy_module(Path(args.legacy_script))
    legacy.PARAR_PROCESSO = False
    legacy.PAUSADO = False
    legacy.EM_EXECUCAO = True

    notes_file = Path(args.notes_file)
    context = CalibrationContext(notes_file, build_expected_steps(payload))
    attach_calibration_wrappers(legacy, context)

    try:
        if hasattr(legacy, "configurar_atalhos"):
            legacy.configurar_atalhos()

        legacy.ativar_janela_contmatic()
        input("Deixe o Phoenix na tela correta e pressione Enter para iniciar a calibracao... ")
        legacy.abrir_rotina_uma_vez()
        legacy.preencher_sistema(payload["legacyColumns"], args.empresa_habilitada, args.empresa_rateio)
        print("Calibracao concluida.")
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
