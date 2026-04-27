import json
import threading
import tkinter as tk
from pathlib import Path
from tkinter import messagebox, ttk

import requests

from phoenix_legacy_site_runner import login, run_employee


SETTINGS_PATH = Path(__file__).with_name("phoenix_queue_runner_settings.json")


def fetch_pending_queue(session: requests.Session, base_url: str):
    response = session.get(
        f"{base_url.rstrip('/')}/api/cadastros/phoenix",
        params={"queue": "pending"},
        timeout=30,
    )

    if response.status_code >= 400:
        raise RuntimeError(f"Falha ao buscar fila do Phoenix: {response.text}")

    data = response.json()
    if not data.get("ok"):
        raise RuntimeError(f"Resposta invalida da fila do Phoenix: {data}")

    return data.get("records", [])


class PhoenixQueueRunnerApp:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Phoenix Runner")
        self.root.geometry("1180x640")

        self.base_url_var = tk.StringVar(value="https://www.palsys.com.br")
        self.email_var = tk.StringVar()
        self.password_var = tk.StringVar()
        self.legacy_script_var = tk.StringVar(value="cadastros_final_adaptado.py")
        self.empresa_habilitada_var = tk.StringVar(value="N")
        self.empresa_rateio_var = tk.StringVar(value="N")
        self.status_var = tk.StringVar(value="Preencha o login do escritório e carregue a fila do Phoenix.")

        self.session: requests.Session | None = None
        self.records: list[dict] = []

        self.load_settings()
        self.build_ui()

    def build_ui(self):
        container = ttk.Frame(self.root, padding=16)
        container.pack(fill="both", expand=True)

        credentials = ttk.LabelFrame(container, text="Conexão com o site", padding=12)
        credentials.pack(fill="x")

        ttk.Label(credentials, text="Base URL").grid(row=0, column=0, sticky="w")
        ttk.Entry(credentials, textvariable=self.base_url_var, width=40).grid(row=1, column=0, sticky="ew", padx=(0, 12))

        ttk.Label(credentials, text="Login do escritório").grid(row=0, column=1, sticky="w")
        ttk.Entry(credentials, textvariable=self.email_var, width=28).grid(row=1, column=1, sticky="ew", padx=(0, 12))

        ttk.Label(credentials, text="Senha").grid(row=0, column=2, sticky="w")
        ttk.Entry(credentials, textvariable=self.password_var, width=24, show="*").grid(row=1, column=2, sticky="ew", padx=(0, 12))

        ttk.Button(credentials, text="Carregar fila", command=self.load_queue).grid(row=1, column=3, sticky="ew")

        ttk.Label(credentials, text="Script legado").grid(row=2, column=0, sticky="w", pady=(12, 0))
        ttk.Entry(credentials, textvariable=self.legacy_script_var, width=40).grid(row=3, column=0, sticky="ew", padx=(0, 12))

        ttk.Label(credentials, text="Empresa habilitada").grid(row=2, column=1, sticky="w", pady=(12, 0))
        ttk.Combobox(credentials, textvariable=self.empresa_habilitada_var, values=["N", "S"], width=10, state="readonly").grid(row=3, column=1, sticky="w", padx=(0, 12))

        ttk.Label(credentials, text="Empresa rateio").grid(row=2, column=2, sticky="w", pady=(12, 0))
        ttk.Combobox(credentials, textvariable=self.empresa_rateio_var, values=["N", "S"], width=10, state="readonly").grid(row=3, column=2, sticky="w", padx=(0, 12))

        credentials.columnconfigure(0, weight=1)
        credentials.columnconfigure(1, weight=1)
        credentials.columnconfigure(2, weight=1)

        queue_frame = ttk.LabelFrame(container, text="Fila Enviado ao Phoenix", padding=12)
        queue_frame.pack(fill="both", expand=True, pady=(16, 0))

        columns = ("clientName", "clientContmaticNickname", "employeeName", "employeeEmail", "workflowStatus", "updatedAt")
        self.tree = ttk.Treeview(queue_frame, columns=columns, show="headings", height=16)
        self.tree.heading("clientName", text="Empresa")
        self.tree.heading("clientContmaticNickname", text="Apelido Contmatic")
        self.tree.heading("employeeName", text="Funcionário")
        self.tree.heading("employeeEmail", text="E-mail")
        self.tree.heading("workflowStatus", text="Status")
        self.tree.heading("updatedAt", text="Atualizado")
        self.tree.column("clientName", width=180)
        self.tree.column("clientContmaticNickname", width=170)
        self.tree.column("employeeName", width=220)
        self.tree.column("employeeEmail", width=220)
        self.tree.column("workflowStatus", width=140)
        self.tree.column("updatedAt", width=180)
        self.tree.pack(fill="both", expand=True)

        actions = ttk.Frame(queue_frame)
        actions.pack(fill="x", pady=(12, 0))

        ttk.Button(actions, text="Executar selecionado", command=self.execute_selected).pack(side="left")
        ttk.Button(actions, text="Atualizar fila", command=self.load_queue).pack(side="left", padx=(8, 0))

        ttk.Label(container, textvariable=self.status_var, wraplength=1120, foreground="#334155").pack(fill="x", pady=(14, 0))

    def load_settings(self):
        if not SETTINGS_PATH.exists():
            return

        try:
            data = json.loads(SETTINGS_PATH.read_text(encoding="utf-8"))
        except Exception:
            return

        self.base_url_var.set(str(data.get("baseUrl", self.base_url_var.get())))
        self.email_var.set(str(data.get("email", "")))
        self.legacy_script_var.set(str(data.get("legacyScript", self.legacy_script_var.get())))
        self.empresa_habilitada_var.set(str(data.get("empresaHabilitada", self.empresa_habilitada_var.get())))
        self.empresa_rateio_var.set(str(data.get("empresaRateio", self.empresa_rateio_var.get())))

    def save_settings(self):
        SETTINGS_PATH.write_text(
            json.dumps(
                {
                    "baseUrl": self.base_url_var.get().strip(),
                    "email": self.email_var.get().strip(),
                    "legacyScript": self.legacy_script_var.get().strip(),
                    "empresaHabilitada": self.empresa_habilitada_var.get().strip(),
                    "empresaRateio": self.empresa_rateio_var.get().strip(),
                },
                ensure_ascii=False,
                indent=2,
            ),
            encoding="utf-8",
        )

    def set_status(self, text: str):
        self.status_var.set(text)

    def load_queue(self):
        self.save_settings()
        thread = threading.Thread(target=self._load_queue_worker, daemon=True)
        thread.start()

    def _load_queue_worker(self):
        try:
            self.root.after(0, lambda: self.set_status("Entrando no site e carregando a fila do Phoenix..."))
            session = requests.Session()
            login(session, self.base_url_var.get().strip(), self.email_var.get().strip(), self.password_var.get())
            records = fetch_pending_queue(session, self.base_url_var.get().strip())
            self.session = session
            self.records = records
            self.root.after(0, self._render_queue)
            self.root.after(0, lambda: self.set_status(f"Fila carregada com {len(records)} cadastro(s) enviado(s) ao Phoenix."))
            if records:
                self.root.after(0, self._ask_run_first)
        except Exception as error:
            self.root.after(0, lambda: self.set_status(str(error)))
            self.root.after(0, lambda: messagebox.showerror("Phoenix Runner", str(error)))

    def _render_queue(self):
        self.tree.delete(*self.tree.get_children())
        for record in self.records:
            self.tree.insert(
                "",
                "end",
                iid=record["id"],
                values=(
                    record.get("clientName") or "Sem empresa",
                    record.get("clientContmaticNickname") or "Sem apelido",
                    record.get("employeeName") or "Sem nome",
                    record.get("employeeEmail") or "Sem e-mail",
                    record.get("workflowStatus") or "",
                    record.get("updatedAt") or "",
                ),
            )

    def _ask_run_first(self):
        first = self.records[0] if self.records else None
        if not first:
            return

        summary = (
            f"Empresa: {first.get('clientName') or 'Sem empresa'}\n"
            f"Apelido Contmatic: {first.get('clientContmaticNickname') or 'Sem apelido'}\n"
            f"Funcionário: {first.get('employeeName') or 'Sem nome'}"
        )

        wants_run = messagebox.askyesno(
            "Phoenix Runner",
            f"Há {len(self.records)} cadastro(s) enviado(s) ao Phoenix.\n\nDeseja rodar agora o primeiro da fila?\n\n{summary}",
        )
        if wants_run:
            self.tree.selection_set(first["id"])
            self.execute_selected()

    def execute_selected(self):
        selection = self.tree.selection()
        if not selection:
            messagebox.showinfo("Phoenix Runner", "Selecione um cadastro da fila primeiro.")
            return

        selected_id = selection[0]
        record = next((item for item in self.records if item["id"] == selected_id), None)
        if not record:
            messagebox.showerror("Phoenix Runner", "Cadastro selecionado não encontrado na fila.")
            return

        summary = (
            f"Empresa: {record.get('clientName') or 'Sem empresa'}\n"
            f"Apelido Contmatic: {record.get('clientContmaticNickname') or 'Sem apelido'}"
        )

        confirmed = messagebox.askyesno(
            "Phoenix Runner",
            f"Deseja rodar agora o cadastro de {record.get('employeeName') or 'Sem nome'} no Phoenix?\n\n{summary}",
        )
        if not confirmed:
            return

        self.save_settings()
        thread = threading.Thread(target=self._execute_worker, args=(record,), daemon=True)
        thread.start()

    def _execute_worker(self, record: dict):
        try:
            self.root.after(0, lambda: self.set_status(f"Executando no Phoenix: {record.get('employeeName') or record['id']}"))
            run_employee(
                base_url=self.base_url_var.get().strip(),
                email=self.email_var.get().strip(),
                password=self.password_var.get(),
                employee_id=record["id"],
                legacy_script=self.legacy_script_var.get().strip(),
                empresa_habilitada=self.empresa_habilitada_var.get().strip() or "N",
                empresa_rateio=self.empresa_rateio_var.get().strip() or "N",
            )
            self.root.after(0, lambda: self.set_status("Execução concluída. Atualizando a fila..."))
            self.root.after(0, self.load_queue)
        except Exception as error:
            self.root.after(0, lambda: self.set_status(f"Falha na execução: {error}"))
            self.root.after(0, lambda: messagebox.showerror("Phoenix Runner", str(error)))

    def run(self):
        self.root.mainloop()


if __name__ == "__main__":
    PhoenixQueueRunnerApp().run()
