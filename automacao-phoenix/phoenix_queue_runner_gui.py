import atexit
import json
import sys
import threading
import time
import tkinter as tk
import webbrowser
from pathlib import Path
from tkinter import messagebox, ttk

import requests

from licenca_app import iniciar_protecao_licenca
from phoenix_legacy_site_runner import login, run_employee


if getattr(sys, "frozen", False):
    APP_DIR = Path(sys.executable).resolve().parent
    BUNDLE_DIR = Path(getattr(sys, "_MEIPASS", APP_DIR))
else:
    APP_DIR = Path(__file__).resolve().parent
    BUNDLE_DIR = APP_DIR

SETTINGS_PATH = APP_DIR / "phoenix_queue_runner_settings.json"
DEFAULT_LEGACY_SCRIPT = BUNDLE_DIR / "cadastros_final_adaptado.py"
LOGO_PATH = BUNDLE_DIR / "PalSys.png"
ICON_PATH = BUNDLE_DIR / "PalSys.ico"
WHATSAPP_ICON_PATH = BUNDLE_DIR / "whatsapp.png"
WHATSAPP_LINK = "https://wa.me/5512997952482"
LICENSE_SERVER_URL = "https://license-server-production-ee3a.up.railway.app"


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


def mostrar_splash(root: tk.Tk):
    splash = tk.Toplevel(root)
    splash.overrideredirect(True)

    largura = 520
    altura = 320

    x = (splash.winfo_screenwidth() // 2) - (largura // 2)
    y = (splash.winfo_screenheight() // 2) - (altura // 2)

    splash.geometry(f"{largura}x{altura}+{x}+{y}")
    splash.configure(bg="white")

    try:
        img_original = tk.PhotoImage(file=str(LOGO_PATH))
        img = img_original.subsample(3, 3)
        label_img = tk.Label(splash, image=img, bg="white")
        label_img.image = img
        label_img.pack(expand=True)
    except Exception:
        tk.Label(splash, text="PalSys", font=("Segoe UI", 20, "bold"), bg="white").pack(expand=True)

    tk.Label(
        splash,
        text="Iniciando runner do Phoenix...",
        font=("Segoe UI", 10),
        bg="white",
    ).pack(pady=10)

    splash.update()
    time.sleep(2.5)
    splash.destroy()


class PhoenixQueueRunnerApp:
    def __init__(self, root: tk.Tk, cliente_licenca):
        self.root = root
        self.cliente_licenca = cliente_licenca
        self.root.title("PalSys Runner Phoenix")
        self.root.geometry("1240x760")
        self.root.minsize(1180, 660)
        self.root.configure(bg="white")

        try:
            self.root.iconbitmap(str(ICON_PATH))
        except Exception:
            pass

        self.base_url_var = tk.StringVar(value="https://www.palsys.com.br")
        self.email_var = tk.StringVar()
        self.password_var = tk.StringVar()
        self.legacy_script_var = tk.StringVar(value=str(DEFAULT_LEGACY_SCRIPT))
        self.empresa_habilitada_var = tk.StringVar(value="N")
        self.status_var = tk.StringVar(value="Preencha o login do escritorio e carregue a fila do Phoenix.")
        self.texto_licenca = tk.StringVar(
            value=f"Licenciado para: {getattr(self.cliente_licenca, 'customer_name', '')}"
        )

        self.session: requests.Session | None = None
        self.records: list[dict] = []
        self.logo_topo = None
        self.icone_whatsapp = None

        self.configure_styles()
        self.load_settings()
        self.build_ui()
        self.centralizar_janela()
        self.root.protocol("WM_DELETE_WINDOW", self.encerrar_programa)

    def configure_styles(self):
        style = ttk.Style()
        style.theme_use("default")
        style.configure(".", background="white", foreground="#222222")
        style.configure("TFrame", background="white")
        style.configure("TLabel", background="white", font=("Segoe UI", 9))
        style.configure("TLabelframe", background="white")
        style.configure("TLabelframe.Label", background="white", font=("Segoe UI", 9, "bold"))
        style.configure("TButton", font=("Segoe UI", 9), padding=6)

    def encerrar_programa(self):
        try:
            self.cliente_licenca.release()
        except Exception:
            pass
        self.save_settings()
        self.root.destroy()

    def carregar_logo(self, largura_maxima=None, altura_maxima=None, subsample_inicial=1):
        if not LOGO_PATH.exists():
            return None
        try:
            img = tk.PhotoImage(file=str(LOGO_PATH))
            if largura_maxima or altura_maxima:
                largura = img.width()
                altura = img.height()
                fator_w = max(1, (largura + (largura_maxima or largura) - 1) // (largura_maxima or largura))
                fator_h = max(1, (altura + (altura_maxima or altura) - 1) // (altura_maxima or altura))
                fator = max(subsample_inicial, fator_w, fator_h)
                if fator > 1:
                    img = img.subsample(fator, fator)
            elif subsample_inicial and subsample_inicial > 1:
                img = img.subsample(subsample_inicial, subsample_inicial)
            return img
        except Exception:
            return None

    def centralizar_janela(self):
        self.root.update_idletasks()
        largura = self.root.winfo_width() or 1240
        altura = self.root.winfo_height() or 760
        x = (self.root.winfo_screenwidth() // 2) - (largura // 2)
        y = (self.root.winfo_screenheight() // 2) - (altura // 2)
        self.root.geometry(f"{largura}x{altura}+{max(x, 0)}+{max(y, 0)}")

    def abrir_whatsapp_contato(self, event=None):
        try:
            webbrowser.open(WHATSAPP_LINK)
        except Exception:
            pass

    def desenhar_retangulo_arredondado(self, canvas, x1, y1, x2, y2, raio=16, **kwargs):
        pontos = [
            x1 + raio, y1,
            x2 - raio, y1,
            x2, y1,
            x2, y1 + raio,
            x2, y2 - raio,
            x2, y2,
            x2 - raio, y2,
            x1 + raio, y2,
            x1, y2,
            x1, y2 - raio,
            x1, y1 + raio,
            x1, y1,
        ]
        return canvas.create_polygon(pontos, smooth=True, splinesteps=36, **kwargs)

    def criar_bloco_whatsapp(self, master):
        frame_contato = tk.Frame(master, bg="white")

        largura_pill = 245
        altura_pill = 42
        fundo_normal = "#F3FBF6"
        fundo_hover = "#E5F8EC"
        fundo_click = "#D8F3E2"
        cor_sombra = "#DCE9E2"
        cor_borda = "#CFE9D8"
        cor_texto = "#159447"

        canvas = tk.Canvas(
            frame_contato,
            width=largura_pill,
            height=altura_pill + 4,
            bg="white",
            highlightthickness=0,
            bd=0,
            cursor="hand2",
        )
        canvas.pack(anchor="w")

        self.desenhar_retangulo_arredondado(
            canvas, 3, 5, largura_pill - 3, altura_pill + 1, raio=20, fill=cor_sombra, outline=""
        )
        pill = self.desenhar_retangulo_arredondado(
            canvas, 1, 1, largura_pill - 5, altura_pill - 3, raio=20, fill=fundo_normal, outline=cor_borda, width=1
        )

        icone_carregado = False
        if WHATSAPP_ICON_PATH.exists():
            try:
                self.icone_whatsapp = tk.PhotoImage(file=str(WHATSAPP_ICON_PATH))
                largura = self.icone_whatsapp.width()
                altura = self.icone_whatsapp.height()
                fator = max(largura // 24, altura // 24, 1)
                self.icone_whatsapp = self.icone_whatsapp.subsample(fator, fator)
                item_icone = canvas.create_image(24, 20, image=self.icone_whatsapp)
                icone_carregado = True
            except Exception:
                icone_carregado = False

        if not icone_carregado:
            item_icone = canvas.create_oval(12, 8, 34, 30, fill="#25D366", outline="#25D366")
            canvas.create_text(23, 19, text="W", fill="white", font=("Segoe UI", 10, "bold"))

        texto = canvas.create_text(
            48, 20,
            text="(12) 99795-2482",
            anchor="w",
            fill=cor_texto,
            font=("Segoe UI", 9, "bold"),
        )

        def atualizar_visual(cor_fundo):
            canvas.itemconfig(pill, fill=cor_fundo)

        def entrar(event=None):
            atualizar_visual(fundo_hover)

        def sair(event=None):
            atualizar_visual(fundo_normal)
            canvas.move("pill_group", 0, 0)

        def pressionar(event=None):
            atualizar_visual(fundo_click)
            canvas.move("pill_group", 0, 1)

        def soltar(event=None):
            canvas.move("pill_group", 0, -1)
            atualizar_visual(fundo_hover)
            self.abrir_whatsapp_contato()

        canvas.addtag_withtag("pill_group", pill)
        canvas.addtag_withtag("pill_group", item_icone)
        canvas.addtag_withtag("pill_group", texto)

        canvas.bind("<Enter>", entrar)
        canvas.bind("<Leave>", sair)
        canvas.bind("<ButtonPress-1>", pressionar)
        canvas.bind("<ButtonRelease-1>", soltar)

        return frame_contato

    def build_ui(self):
        container = ttk.Frame(self.root, padding=16)
        container.pack(fill="both", expand=True)

        tk.Label(
            container,
            textvariable=self.texto_licenca,
            font=("Segoe UI", 13, "bold"),
            bg="white",
            anchor="w",
            justify="left",
        ).pack(fill="x", pady=(0, 10))

        header = ttk.Frame(container)
        header.pack(fill="x", pady=(0, 16))

        frame_logo = ttk.Frame(header)
        frame_logo.grid(row=0, column=0, rowspan=2, sticky="nw", padx=(0, 14))

        self.logo_topo = self.carregar_logo(largura_maxima=220, altura_maxima=90)
        if self.logo_topo:
            ttk.Label(frame_logo, image=self.logo_topo).pack(anchor="nw", pady=(0, 4))
        else:
            ttk.Label(frame_logo, text="PalSys", font=("Segoe UI", 18, "bold")).pack(anchor="nw")

        self.bloco_whatsapp = self.criar_bloco_whatsapp(frame_logo)
        self.bloco_whatsapp.pack(anchor="nw", pady=(2, 0))

        ttk.Label(
            header,
            text="Runner grafico do Phoenix para o escritorio contabil.",
            font=("Segoe UI", 12, "bold"),
        ).grid(row=0, column=1, sticky="w", pady=(6, 4))
        ttk.Label(
            header,
            text="Entre com o login do escritorio, carregue a fila e execute os cadastros enviados pelas empresas da sua carteira.",
            wraplength=760,
        ).grid(row=1, column=1, sticky="w")

        credentials = ttk.LabelFrame(container, text="Conexao com o site", padding=12)
        credentials.pack(fill="x")

        ttk.Label(credentials, text="Login do escritorio").grid(row=0, column=0, sticky="w")
        ttk.Entry(credentials, textvariable=self.email_var, width=34).grid(row=1, column=0, sticky="ew", padx=(0, 12))

        ttk.Label(credentials, text="Senha").grid(row=0, column=1, sticky="w")
        ttk.Entry(credentials, textvariable=self.password_var, width=24, show="*").grid(row=1, column=1, sticky="ew", padx=(0, 12))

        ttk.Button(credentials, text="Carregar fila", command=self.load_queue).grid(row=1, column=3, sticky="ew")

        ttk.Label(credentials, text="Empresa habilitada no eSocial").grid(row=2, column=0, sticky="w", pady=(12, 0))
        ttk.Combobox(credentials, textvariable=self.empresa_habilitada_var, values=["N", "S"], width=22, state="readonly").grid(row=3, column=0, sticky="w", padx=(0, 12))

        credentials.columnconfigure(0, weight=1)
        credentials.columnconfigure(1, weight=1)
        credentials.columnconfigure(2, weight=1)

        queue_frame = ttk.LabelFrame(container, text="Fila Enviado ao Phoenix", padding=12)
        queue_frame.pack(fill="both", expand=True, pady=(16, 0))

        columns = ("clientName", "clientContmaticNickname", "employeeName", "employeeEmail", "workflowStatus", "updatedAt")
        self.tree = ttk.Treeview(queue_frame, columns=columns, show="headings", height=11)
        self.tree.heading("clientName", text="Empresa")
        self.tree.heading("clientContmaticNickname", text="Apelido Contmatic")
        self.tree.heading("employeeName", text="Funcionario")
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

        ttk.Label(container, textvariable=self.status_var, wraplength=1180, foreground="#334155").pack(fill="x", pady=(14, 0))

    def load_settings(self):
        if not SETTINGS_PATH.exists():
            return

        try:
            data = json.loads(SETTINGS_PATH.read_text(encoding="utf-8"))
        except Exception:
            return

        self.base_url_var.set(str(data.get("baseUrl", self.base_url_var.get())))
        self.email_var.set(str(data.get("email", "")))
        self.empresa_habilitada_var.set(str(data.get("empresaHabilitada", self.empresa_habilitada_var.get())))

    def save_settings(self):
        SETTINGS_PATH.write_text(
            json.dumps(
                {
                    "baseUrl": self.base_url_var.get().strip(),
                    "email": self.email_var.get().strip(),
                    "empresaHabilitada": self.empresa_habilitada_var.get().strip(),
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
            f"Funcionario: {first.get('employeeName') or 'Sem nome'}"
        )

        wants_run = messagebox.askyesno(
            "Phoenix Runner",
            f"Ha {len(self.records)} cadastro(s) enviado(s) ao Phoenix.\n\nDeseja rodar agora o primeiro da fila?\n\n{summary}",
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
            messagebox.showerror("Phoenix Runner", "Cadastro selecionado nao encontrado na fila.")
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
                legacy_script=str(DEFAULT_LEGACY_SCRIPT),
                empresa_habilitada=self.empresa_habilitada_var.get().strip() or "N",
                empresa_rateio="N",
            )
            self.root.after(0, lambda: self.set_status("Execucao concluida. Atualizando a fila..."))
            self.root.after(0, self.load_queue)
        except Exception as error:
            self.root.after(0, lambda: self.set_status(f"Falha na execucao: {error}"))
            self.root.after(0, lambda: messagebox.showerror("Phoenix Runner", str(error)))

    def run(self):
        self.root.mainloop()


if __name__ == "__main__":
    root = tk.Tk()
    root.withdraw()

    cliente_licenca, _ = iniciar_protecao_licenca(
        LICENSE_SERVER_URL,
        arquivo_licenca=str(APP_DIR / "licenca.key"),
        parent=root,
    )
    atexit.register(cliente_licenca.release)

    mostrar_splash(root)
    root.deiconify()

    app = PhoenixQueueRunnerApp(root, cliente_licenca)
    app.run()
