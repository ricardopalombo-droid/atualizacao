import argparse
import importlib.util
import json
import queue
import sys
import threading
from datetime import datetime
from pathlib import Path
import tkinter as tk
from tkinter import messagebox, scrolledtext

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


class CalibrationUI:
    def __init__(self, notes_file: Path):
        self.notes_file = notes_file
        self.notes: list[dict] = []
        self.current_meta: dict | None = None
        self.command_queue: queue.Queue = queue.Queue()
        self.result_queue: queue.Queue = queue.Queue()
        self.root = tk.Tk()
        self.root.title("Calibrador Phoenix")
        self.root.geometry("520x680")
        self.root.attributes("-topmost", True)
        self.root.resizable(False, False)

        self.title_var = tk.StringVar(value="Aguardando etapa")
        self.field_var = tk.StringVar(value="")
        self.legacy_var = tk.StringVar(value="")
        self.value_var = tk.StringVar(value="")
        self.status_var = tk.StringVar(value="Abra o Phoenix e inicie a calibracao.")

        self._build_layout()
        self.root.after(150, self._poll_messages)

    def _build_layout(self):
        wrapper = tk.Frame(self.root, padx=12, pady=12)
        wrapper.pack(fill="both", expand=True)

        tk.Label(wrapper, textvariable=self.title_var, font=("Segoe UI", 14, "bold"), wraplength=480, justify="left").pack(anchor="w")
        tk.Label(wrapper, textvariable=self.field_var, wraplength=480, justify="left").pack(anchor="w", pady=(8, 0))
        tk.Label(wrapper, textvariable=self.legacy_var, wraplength=480, justify="left").pack(anchor="w", pady=(4, 0))
        tk.Label(wrapper, textvariable=self.value_var, wraplength=480, justify="left").pack(anchor="w", pady=(4, 8))

        tk.Label(wrapper, text="Fluxo da etapa", font=("Segoe UI", 10, "bold")).pack(anchor="w")
        buttons = tk.Frame(wrapper)
        buttons.pack(fill="x", pady=(6, 10))

        tk.Button(buttons, text="Executar", width=12, command=lambda: self._send_command("execute")).pack(side="left", padx=(0, 6))
        tk.Button(buttons, text="Pular", width=12, command=lambda: self._send_command("skip")).pack(side="left", padx=(0, 6))
        tk.Button(buttons, text="Encerrar", width=12, command=lambda: self._send_command("quit")).pack(side="left")

        tk.Label(wrapper, text="Depois da execucao", font=("Segoe UI", 10, "bold")).pack(anchor="w")
        post_buttons = tk.Frame(wrapper)
        post_buttons.pack(fill="x", pady=(6, 10))

        tk.Button(post_buttons, text="Ficou certo", width=12, command=lambda: self._send_command("ok")).pack(side="left", padx=(0, 6))
        tk.Button(post_buttons, text="Ficou errado", width=12, command=lambda: self._send_command("wrong")).pack(side="left")

        form = tk.Frame(wrapper)
        form.pack(fill="x", pady=(8, 8))

        tk.Label(form, text="Campo correto do nosso sistema").grid(row=0, column=0, sticky="w")
        self.expected_source_entry = tk.Entry(form, width=60)
        self.expected_source_entry.grid(row=1, column=0, sticky="we", pady=(2, 8))

        tk.Label(form, text="Como o Phoenix deveria ser preenchido").grid(row=2, column=0, sticky="w")
        self.phoenix_instruction_entry = tk.Entry(form, width=60)
        self.phoenix_instruction_entry.grid(row=3, column=0, sticky="we", pady=(2, 8))

        tk.Label(form, text="Observacao").grid(row=4, column=0, sticky="w")
        self.notes_text = scrolledtext.ScrolledText(form, width=58, height=6, wrap="word")
        self.notes_text.grid(row=5, column=0, sticky="we")

        form.columnconfigure(0, weight=1)

        tk.Label(wrapper, textvariable=self.status_var, fg="#92400e", wraplength=480, justify="left").pack(anchor="w", pady=(10, 8))

        tk.Label(wrapper, text="Notas registradas nesta sessao", font=("Segoe UI", 10, "bold")).pack(anchor="w")
        self.log_text = scrolledtext.ScrolledText(wrapper, width=60, height=10, wrap="word")
        self.log_text.pack(fill="both", expand=True, pady=(6, 0))

    def _send_command(self, command: str):
        self.command_queue.put(command)

    def _append_log(self, message: str):
        self.log_text.insert(tk.END, message + "\n")
        self.log_text.see(tk.END)

    def show_step(self, meta: dict):
        self.current_meta = meta
        self.title_var.set(meta.get("label", "Etapa"))
        self.field_var.set(f"Campo do nosso sistema: {meta.get('sourceKey', '') or '-'}")
        self.legacy_var.set(f"Coluna/legado: {meta.get('legacyKey', '') or '-'} | Acao: {meta.get('helper', '')}")
        self.value_var.set(f"Valor enviado: {meta.get('runtimeValue', '')}")
        self.status_var.set("Clique em Executar para rodar a etapa, ou Pular/Encerrar se preferir.")
        self.expected_source_entry.delete(0, tk.END)
        self.expected_source_entry.insert(0, meta.get("sourceKey", ""))
        self.phoenix_instruction_entry.delete(0, tk.END)
        self.notes_text.delete("1.0", tk.END)

    def mark_after_execute(self):
        self.status_var.set("Veja o Phoenix e clique em Ficou certo ou Ficou errado.")

    def handle_wrong(self):
        if not self.current_meta:
            return

        note = {
            "timestamp": datetime.now().isoformat(timespec="seconds"),
            "label": self.current_meta.get("label", ""),
            "helper": self.current_meta.get("helper", ""),
            "sourceKey": self.current_meta.get("sourceKey", ""),
            "legacyKey": self.current_meta.get("legacyKey", ""),
            "runtimeValue": self.current_meta.get("runtimeValue", ""),
            "expectedSourceField": self.expected_source_entry.get().strip(),
            "phoenixFillInstruction": self.phoenix_instruction_entry.get().strip(),
            "notes": self.notes_text.get("1.0", tk.END).strip(),
        }
        self.notes.append(note)
        save_notes(self.notes_file, self.notes)
        self._append_log(f"- {note['label']} | {note['expectedSourceField']} | {note['phoenixFillInstruction']}")
        self.status_var.set(f"Ajuste registrado em {self.notes_file.name}.")

    def _poll_messages(self):
        try:
            while True:
                message = self.result_queue.get_nowait()
                if message["type"] == "step":
                    self.show_step(message["meta"])
                elif message["type"] == "after_execute":
                    self.mark_after_execute()
                elif message["type"] == "done":
                    self.status_var.set("Calibracao concluida.")
                    messagebox.showinfo("Calibracao Phoenix", "Calibracao concluida.")
                elif message["type"] == "error":
                    self.status_var.set(message["message"])
                    messagebox.showerror("Calibracao Phoenix", message["message"])
        except queue.Empty:
            pass
        finally:
            self.root.after(150, self._poll_messages)

    def run(self):
        self.root.mainloop()


class CalibrationCoordinator:
    def __init__(self, ui: CalibrationUI, expected_steps: list[dict]):
        self.ui = ui
        self.expected_steps = expected_steps
        self.step_index = 0

    def next_meta(self, helper_name: str, arg_value):
        if self.step_index < len(self.expected_steps):
            expected = self.expected_steps[self.step_index]
            if expected["helper"] == helper_name:
                self.step_index += 1
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

    def wait_command(self, meta: dict):
        self.ui.result_queue.put({"type": "step", "meta": meta})
        command = self.ui.command_queue.get()
        if command == "quit":
            raise SystemExit("Calibracao encerrada pelo usuario.")
        return command

    def wait_post_command(self):
        self.ui.result_queue.put({"type": "after_execute"})
        command = self.ui.command_queue.get()
        if command == "quit":
            raise SystemExit("Calibracao encerrada pelo usuario.")
        if command == "wrong":
            self.ui.handle_wrong()
        return command


def attach_calibration_wrappers(legacy, coordinator: CalibrationCoordinator):
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
                meta = coordinator.next_meta(name, args[0] if args else "")
                command = coordinator.wait_command(meta)
                if command == "skip":
                    return None

                result = fn(*args, **kwargs)
                coordinator.wait_post_command()
                return result

            return wrapper

        setattr(legacy, helper_name, build_wrapper(original, helper_name))


def worker(args, ui: CalibrationUI):
    try:
        session = requests.Session()
        login(session, args.base_url, args.email, args.password)
        payload = fetch_payload(session, args.base_url, args.employee_id)
        payload["legacyColumns"].update(load_overrides(args.overrides_file))

        legacy = load_legacy_module(Path(args.legacy_script))
        legacy.PARAR_PROCESSO = False
        legacy.PAUSADO = False
        legacy.EM_EXECUCAO = True

        coordinator = CalibrationCoordinator(ui, build_expected_steps(payload))
        attach_calibration_wrappers(legacy, coordinator)

        try:
            if hasattr(legacy, "configurar_atalhos"):
                legacy.configurar_atalhos()

            legacy.ativar_janela_contmatic()
            legacy.abrir_rotina_uma_vez()
            legacy.preencher_sistema(payload["legacyColumns"], args.empresa_habilitada, args.empresa_rateio)
            ui.result_queue.put({"type": "done"})
        finally:
            legacy.EM_EXECUCAO = False
            listener = getattr(legacy, "LISTENER_TECLADO", None)
            if listener is not None:
                try:
                    listener.stop()
                except Exception:
                    pass
    except Exception as error:
        ui.result_queue.put({"type": "error", "message": str(error)})


def main():
    parser = argparse.ArgumentParser(
        description="Executa o robô legado do Phoenix em modo de calibracao com janela flutuante."
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

    ui = CalibrationUI(Path(args.notes_file))
    thread = threading.Thread(target=worker, args=(args, ui), daemon=True)
    thread.start()
    ui.run()


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Erro: {error}", file=sys.stderr)
        sys.exit(1)
