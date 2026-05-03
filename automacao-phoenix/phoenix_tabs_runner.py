import argparse
import json
import sys
import time
from dataclasses import dataclass
from pathlib import Path

import pyautogui
import pygetwindow as gw
import pyperclip
import requests


pyautogui.FAILSAFE = True
pyautogui.PAUSE = 0.15


@dataclass
class Action:
    label: str
    kind: str
    value: str = ""
    source_key: str = ""
    note: str = ""
    tabs_after: int = 0
    tab_name: str = ""
    target_name: str = ""


def load_json(path: str | None):
    if not path:
        return {}

    file_path = Path(path)
    if not file_path.exists():
        raise RuntimeError(f"Arquivo JSON nao encontrado: {file_path}")

    with file_path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


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


def as_text(value):
    return "" if value is None else str(value).strip()


def normalize_digits(value: str):
    return "".join(ch for ch in value if ch.isdigit())


def format_date_for_phoenix(value):
    text = as_text(value)
    if not text:
        return ""

    if len(text) == 10 and text[4] == "-" and text[7] == "-":
        return f"{text[8:10]}/{text[5:7]}/{text[0:4]}"

    if len(text) == 10 and text[2] == "/" and text[5] == "/":
        return text

    return text


def format_money(value):
    text = as_text(value)
    if not text:
        return ""

    text = text.replace(".", ",")
    return text


def get_form_data(payload):
    return payload.get("formData", {})


def get_value(data: dict, key: str, transform=None):
    raw = data.get(key, "")
    if transform:
        return transform(raw)
    return as_text(raw)


def build_actions(payload: dict):
    data = get_form_data(payload)
    actions: list[Action] = []

    def add(label, kind, source_key="", value="", note="", tabs_after=0, tab_name="", target_name=""):
        action_value = value if value != "" else get_value(data, source_key)
        actions.append(
            Action(
                label=label,
                kind=kind,
                value=action_value,
                source_key=source_key,
                note=note,
                tabs_after=tabs_after,
                tab_name=tab_name,
                target_name=target_name,
            )
        )

    add(
        "Iniciar na aba Dados Cadastrais com o cursor em Codigo",
        "info",
        note="Se voce usar --bootstrap-start, o runner abre Funcionario > Inserir antes daqui. Se nao usar, deixe o cadastro em foco no campo Codigo.",
        tab_name="Dados Cadastrais",
    )
    add("Pular Codigo", "tab", note="Codigo pode continuar vazio por enquanto.", tab_name="Dados Cadastrais")
    add("Nome completo", "write_tab", "nome_completo", tab_name="Dados Cadastrais")
    add("Admissao", "write_tab", value=format_date_for_phoenix(data.get("data_admissao")), tab_name="Dados Cadastrais")
    add(
        "Pular bloco superior (Status qualificacao, Status eSocial, Transf. Entrada e Rescisao)",
        "tab_n",
        value="4",
        note="Esses campos ficam no topo e devem ser pulados antes de entrar no endereco.",
        tab_name="Dados Cadastrais",
    )

    add(
        "CEP com busca automatica",
        "cep_search",
        "cep",
        note="Preenche o CEP e aciona a busca do endereco no proprio Phoenix.",
        tab_name="Dados Cadastrais",
    )
    add("Numero", "click_write", "numero", tab_name="Dados Cadastrais", target_name="numero_endereco")
    add(
        "Pular campos auto-preenchidos do endereco e ir direto para Nome da mae",
        "manual",
        note="A partir daqui usaremos clique direto em Nome da mae e Nome do pai.",
        tab_name="Dados Cadastrais",
    )
    add("Nome da mae", "click_write", "nome_mae", tab_name="Dados Cadastrais", target_name="nome_mae")
    add("Nome do pai", "click_write", "nome_pai", tab_name="Dados Cadastrais", target_name="nome_pai")
    add("Registro", "write_tab", "registro_funcionario", tab_name="Dados Cadastrais")
    add("Folha/Ficha", "write_tab", "folha_ficha", tab_name="Dados Cadastrais")
    add("Chapa", "tab", note="Nao usada atualmente.", tab_name="Dados Cadastrais")
    add("Matricula eSocial", "tab", note="Deixar em branco; destino preenche.", tab_name="Dados Cadastrais")

    add("E-mail", "write_tab", "email", tab_name="Dados Cadastrais")
    add("E-mail alternativo", "tab", note="Nao existe no nosso sistema.", tab_name="Dados Cadastrais")
    add("Telefone", "write_tab", "telefone", tab_name="Dados Cadastrais")
    add("Celular", "write_tab", "celular", tab_name="Dados Cadastrais")
    add("Sexo", "combo", "sexo", tab_name="Dados Cadastrais")
    add("Estado civil", "combo", "estado_civil", tab_name="Dados Cadastrais")
    add("Tipo sanguineo", "combo", "tipo_sanguineo", tab_name="Dados Cadastrais")
    add("Raca/Cor", "combo", "raca_cor", tab_name="Dados Cadastrais")
    add("Data nascimento", "write_tab", value=format_date_for_phoenix(data.get("data_nascimento")), tab_name="Dados Cadastrais")
    add("Pais origem", "lookup_search", "pais_origem", note="Campo abre pesquisa digitavel.", tab_name="Dados Cadastrais")
    add("Cod. Munic. naturalidade", "tab", note="Campo sera ignorado na primeira passada.", tab_name="Dados Cadastrais")
    add("Naturalidade", "lookup_search", "naturalidade", note="Campo abre pesquisa digitavel.", tab_name="Dados Cadastrais")
    add("UF naturalidade", "tab", note="Se o Phoenix preencher pela cidade, mantemos tab.", tab_name="Dados Cadastrais")

    add("Deficiencia fisica", "checkbox", value="1" if data.get("deficiencia_fisica") else "", tab_name="Dados Cadastrais")
    add("Deficiencia visual", "checkbox", value="1" if data.get("deficiencia_visual") else "", tab_name="Dados Cadastrais")
    add("Deficiencia auditiva", "checkbox", value="1" if data.get("deficiencia_auditiva") else "", tab_name="Dados Cadastrais")
    add("Observacao deficiencia", "write_tab", "observacao_deficiencia", tab_name="Dados Cadastrais")
    add("Deficiencia mental", "checkbox", value="1" if data.get("deficiencia_mental") else "", tab_name="Dados Cadastrais")
    add("Deficiencia intelectual", "checkbox", value="1" if data.get("deficiencia_intelectual") else "", tab_name="Dados Cadastrais")
    add("Profissional reabilitado", "checkbox", value="1" if data.get("reabilitado") else "", tab_name="Dados Cadastrais")
    add("Preenche cota PCD", "checkbox", value="1" if data.get("preenche_cota_pcd") else "", tab_name="Dados Cadastrais")
    add("Local", "write_tab", "local", tab_name="Dados Cadastrais")
    add("Departamento", "write_tab", "departamento", tab_name="Dados Cadastrais")
    add("Setor", "write_tab", "setor", tab_name="Dados Cadastrais")
    add("Secao", "write_tab", "secao", tab_name="Dados Cadastrais")

    add(
        "Ir para aba Dados Contratuais",
        "next_tab",
        note="Usa Ctrl+Tab para ir para a aba seguinte.",
        tab_name="Dados Contratuais",
    )
    add("Sindicato (historico)", "lookup_history", "sindicato", note="Abrir com Ctrl+Enter ou tres pontinhos. Depois pesquisar e gravar.", tab_name="Dados Contratuais")
    add("Categoria normativa", "write_tab", "categoria_normativa", tab_name="Dados Contratuais")
    add("Tipo tributacao sindical", "combo", "tipo_tributacao_sindical", tab_name="Dados Contratuais")
    add("Matricula filiacao", "tab", note="Nao existe no nosso sistema.", tab_name="Dados Contratuais")
    add("Forma pagamento (historico salarial)", "salary_history", note="Abre tela propria de historico de salario.", tab_name="Dados Contratuais")
    add("Banco", "write_tab", "banco", tab_name="Dados Contratuais")
    add("Agencia", "write_tab", "agencia", tab_name="Dados Contratuais")
    add("Tipo conta", "combo", "tipo_conta", tab_name="Dados Contratuais")
    add("Conta", "write_tab", "numero_conta", tab_name="Dados Contratuais")
    add("Indicativo admissao", "combo", "indicativo_admissao", tab_name="Dados Contratuais")
    add("Cargo (historico)", "cargo_history", "cargo", note="Abre historico de cargos.", tab_name="Dados Contratuais")
    add("Processo", "tab", note="Nao usado agora.", tab_name="Dados Contratuais")
    add("Horario (historico)", "horario_history", "horario", note="Abre historico de horarios.", tab_name="Dados Contratuais")

    add("Ir para aba Dados Oficiais", "next_tab", tab_name="Dados Oficiais")
    add("CPF", "write_tab", "cpf", tab_name="Dados Oficiais")
    add("PIS", "write_tab", "pis", tab_name="Dados Oficiais")
    add("Data PIS", "tab", note="Nao existe no nosso sistema.", tab_name="Dados Oficiais")
    add("Titulo eleitor", "write_tab", "titulo_eleitor", tab_name="Dados Oficiais")
    add("Zona", "tab", note="Nao existe no nosso sistema.", tab_name="Dados Oficiais")
    add("Secao", "tab", note="Nao existe no nosso sistema.", tab_name="Dados Oficiais")
    add("CTPS digital", "checkbox", value="1" if data.get("ctps_digital") else "", tab_name="Dados Oficiais")
    add("Numero CTPS", "write_tab", "ctps_numero", tab_name="Dados Oficiais")
    add("Serie CTPS", "write_tab", "ctps_serie", tab_name="Dados Oficiais")
    add("UF CTPS", "write_tab", "ctps_uf", tab_name="Dados Oficiais")
    add("Expedicao CTPS", "tab", note="Nao existe no nosso sistema.", tab_name="Dados Oficiais")
    add("CNH numero", "write_tab", "cnh_numero", tab_name="Dados Oficiais")
    add("CNH categoria", "write_tab", "categoria_cnh", tab_name="Dados Oficiais")
    add("Orgao emissor CNH", "tab", note="Ainda nao mapeado no nosso sistema.", tab_name="Dados Oficiais")
    add("UF CNH", "tab", note="Ainda nao mapeado no nosso sistema.", tab_name="Dados Oficiais")
    add("Primeira habilitacao", "tab", note="Nao existe no nosso sistema.", tab_name="Dados Oficiais")
    add("Expedicao CNH", "tab", note="Ainda nao mapeado.", tab_name="Dados Oficiais")
    add("Vencimento CNH", "write_tab", value=format_date_for_phoenix(data.get("validade_cnh")), tab_name="Dados Oficiais")
    add("RG numero", "write_tab", "rg_numero", tab_name="Dados Oficiais")
    add("RG orgao emissor", "write_tab", "rg_orgao_emissor", tab_name="Dados Oficiais")
    add("Complemento orgao emissor RG", "tab", note="Nao existe no nosso sistema.", tab_name="Dados Oficiais")
    add("UF RG", "write_tab", "uf_rg", tab_name="Dados Oficiais")
    add("Expedicao RG", "write_tab", value=format_date_for_phoenix(data.get("rg_data_expedicao")), tab_name="Dados Oficiais")

    add("Ir para aba Dados Complementares", "next_tab", tab_name="Dados Complementares")
    add("Nacionalidade", "lookup_search", "nacionalidade", note="Abre pesquisa digitavel.", tab_name="Dados Complementares")
    add("Dt naturalizacao", "tab", note="Nao existe no nosso sistema.", tab_name="Dados Complementares")
    add("Data chegada", "tab", note="Nao existe no nosso sistema.", tab_name="Dados Complementares")
    add("Tempo residencia", "tab", note="Nao existe no nosso sistema.", tab_name="Dados Complementares")
    add("Grau instrucao", "combo", "grau_instrucao", tab_name="Dados Complementares")
    add("Formacao academica", "tab", note="Nao existe no nosso sistema.", tab_name="Dados Complementares")
    add("Vinculo empregaticio", "combo", "vinculo_empregaticio", tab_name="Dados Complementares")
    add("Codigo admissao FGTS", "combo", "indicativo_admissao", tab_name="Dados Complementares")
    add("Ocorrencia / Grau de risco", "grau_risco_history", "grau_risco", note="Campo ocorre via Ctrl+Enter e tela historica.", tab_name="Dados Complementares")
    add("CAGED entrada", "combo", "caged", tab_name="Dados Complementares")

    add("Ir para aba Outros", "next_tab", tab_name="Outros")
    add("Nome social", "write_tab", "nome_social", tab_name="Outros")
    add("Possui residencia propria", "checkbox", value="1" if data.get("possui_residencia_propria") else "", tab_name="Outros")
    add("Possui imovel FGTS", "checkbox", value="1" if data.get("imovel_fgts") else "", tab_name="Outros")
    add("CNPJ vinculo anterior", "write_tab", "cnpj_vinculo_anterior", tab_name="Outros")
    add("Matricula anterior", "write_tab", "matricula_anterior", tab_name="Outros")
    add("Inicio vinculo anterior", "write_tab", value=format_date_for_phoenix(data.get("data_inicio_vinculo_anterior")), tab_name="Outros")
    add("Fim vinculo anterior", "write_tab", value=format_date_for_phoenix(data.get("data_fim_vinculo_anterior")), tab_name="Outros")
    add("Inicio aposentadoria", "write_tab", value=format_date_for_phoenix(data.get("inicio_aposentadoria")), tab_name="Outros")
    add("Motivo aposentadoria", "write_tab", "motivo_aposentadoria", tab_name="Outros")
    add("Isencao de molestia grave", "write_tab", "isencao_molestia_grave", tab_name="Outros")

    add(
        "Fim da primeira versao",
        "manual",
        note="A partir daqui, Documentos, Documentos Compl. e Temporario ficam para o proximo ajuste fino.",
        tab_name="Fim",
    )
    return actions


class PhoenixTabRunner:
    def __init__(self, payload: dict, args):
        self.payload = payload
        self.args = args
        self.actions = build_actions(payload)
        self.window_hint = args.window_hint.lower()
        self.layout = load_json(args.layout_file)
        self.window = None
        self.search_window = None
        self.form_window = None

    def log(self, message: str):
        print(message, flush=True)

    def sleep(self, seconds: float | None = None):
        time.sleep(seconds if seconds is not None else self.args.delay)

    def focus_grace_period(self, message: str | None = None):
        seconds = self.args.focus_grace
        if seconds <= 0:
            return

        if message:
            self.log(message)

        self.log(f"Aguardando {seconds} segundo(s) para voce voltar o foco ao Phoenix...")
        time.sleep(seconds)

    def activate_window(self):
        if not self.args.activate_window:
            return

        candidates = self.find_windows(self.window_hint)
        if not candidates:
            raise RuntimeError(
                f"Nao encontrei janela com '{self.args.window_hint}'. Deixe o Phoenix aberto e use --window-hint se precisar."
            )

        self.window = candidates[0]
        if self.window.isMinimized:
            self.window.restore()
            self.sleep(0.5)
        self.window.activate()
        self.sleep(0.8)

    def find_windows(self, title_hint: str):
        titles = gw.getAllTitles()
        matches = []
        for title in titles:
            if title_hint.lower() in title.lower():
                try:
                    wins = gw.getWindowsWithTitle(title)
                    if wins:
                        matches.append(wins[0])
                except Exception:
                    pass
        return matches

    def activate_named_window(self, title_hint: str):
        matches = self.find_windows(title_hint)
        if not matches:
            raise RuntimeError(f"Nao encontrei janela com '{title_hint}'.")
        window = matches[0]
        if window.isMinimized:
            window.restore()
            self.sleep(0.5)
        window.activate()
        self.sleep(0.8)
        return window

    def ensure_phoenix_focus(self):
        if not self.args.activate_window:
            return

        if not self.window:
            self.activate_window()
            return

        try:
            if self.window.isMinimized:
                self.window.restore()
                self.sleep(0.5)
            self.window.activate()
            self.sleep(0.4)
        except Exception:
            self.activate_window()

    def click_target(self, target_name: str):
        if not target_name:
            return

        target = self.layout.get("targets", {}).get(target_name)
        if not target:
            raise RuntimeError(
                f"Target '{target_name}' nao encontrado no layout. Adicione no JSON de layout para usar clique por coordenada."
            )

        if self.window:
            base_x = self.window.left
            base_y = self.window.top
        else:
            origin = self.layout.get("windowOrigin")
            if not origin:
                raise RuntimeError(
                    "Janela do Phoenix ainda nao foi ativada e o layout nao tem windowOrigin. "
                    "Defina windowOrigin no JSON ou use --activate-window."
                )
            base_x = int(origin["x"])
            base_y = int(origin["y"])

        x = int(base_x + target["x"])
        y = int(base_y + target["y"])
        pyautogui.click(x, y)
        self.sleep(self.args.click_delay)

    def click_window_target(self, window, target_name: str):
        target = self.layout.get("targets", {}).get(target_name)
        if not target:
            raise RuntimeError(f"Target '{target_name}' nao encontrado no layout.")
        x = int(window.left + target["x"])
        y = int(window.top + target["y"])
        pyautogui.click(x, y)
        self.sleep(self.args.click_delay)

    def bootstrap_into_employee_form(self):
        self.log("Abrindo fluxo a partir da janela principal do Contmatic...")
        self.window = self.activate_named_window(self.args.main_window_hint)
        self.click_window_target(self.window, "botao_funcionario")
        self.sleep(self.args.lookup_delay)

        self.search_window = self.activate_named_window(self.args.search_window_hint)
        self.click_window_target(self.search_window, "botao_inserir")
        self.sleep(self.args.lookup_delay)

        self.form_window = self.activate_named_window(self.args.form_window_hint)
        self.window = self.form_window

    def hotkey(self, *keys):
        pyautogui.hotkey(*keys)
        self.sleep()

    def press(self, key, count=1):
        for _ in range(count):
            pyautogui.press(key)
            self.sleep(self.args.key_delay)

    def type_text(self, value: str, clear=False):
        text = as_text(value)
        if clear:
            self.hotkey("ctrl", "a")
            self.press("backspace")
        if text:
            pyperclip.copy(text)
            pyautogui.hotkey("ctrl", "v")
            self.sleep()

    def lookup_search(self, value: str):
        if not value:
            self.press("tab")
            return

        self.hotkey("ctrl", "enter")
        self.sleep(self.args.lookup_delay)
        self.type_text(value, clear=True)
        self.press("enter")
        self.sleep(self.args.lookup_delay)
        self.press("enter")

    def combo_select(self, value: str):
        if not value:
            self.press("tab")
            return

        self.type_text(value, clear=True)
        self.press("enter")

    def cep_search(self, value: str):
        if not value:
            return

        self.click_target("cep")
        self.type_text(value, clear=True)
        self.click_target("buscar_cep")
        self.sleep(self.args.lookup_delay)

    def checkbox(self, checked: bool):
        if checked:
            self.press("space")
        self.press("tab")

    def next_tab(self):
        self.hotkey("ctrl", "tab")
        self.sleep(self.args.lookup_delay)

    def handle_history_manual(self, label: str, value: str, note: str):
        self.log("")
        self.log(f"[ACAO MANUAL ASSISTIDA] {label}")
        self.log(f"Valor do nosso sistema: {value or '(vazio)'}")
        self.log(f"Orientacao: {note}")
        self.log("O script vai abrir a janela/tela auxiliar e aguardar ENTER seu no terminal para seguir.")

    def salary_history(self, data: dict):
        self.hotkey("ctrl", "enter")
        self.sleep(self.args.lookup_delay)
        self.log("")
        self.log("[DADOS SALARIAIS]")
        self.log(f"Salario: {format_money(data.get('salario'))}")
        self.log(f"Horas semanais: {as_text(data.get('horas_semanais'))}")
        self.log(f"Horas mensais: {as_text(data.get('horas_mensais'))}")
        self.log(f"Forma de pagamento: {as_text(data.get('forma_pagamento')) or '(definir depois)'}")
        self.log(f"Tipo de contrato: {as_text(data.get('tipo_contrato'))}")
        self.log(f"Regime de jornada: {as_text(data.get('regime_jornada'))}")
        self.log("Preencha/ajuste a tela Historico de Salario. Depois volte ao terminal e pressione ENTER.")
        input()
        self.focus_grace_period()

    def cargo_history(self, value: str):
        self.hotkey("ctrl", "enter")
        self.sleep(self.args.lookup_delay)
        self.log("")
        self.log("[HISTORICO DE CARGOS]")
        self.log(f"Cargo: {value or '(vazio)'}")
        self.log("No popup, use Inserir, mantenha Motivo = Admissao, escolha o Cargo e grave. Depois pressione ENTER aqui.")
        input()
        self.focus_grace_period()

    def horario_history(self, value: str):
        self.hotkey("ctrl", "enter")
        self.sleep(self.args.lookup_delay)
        self.log("")
        self.log("[HISTORICO DE HORARIOS]")
        self.log(f"Horario: {value or '(vazio)'}")
        self.log("No popup, selecione o horario e grave. Depois pressione ENTER aqui.")
        input()
        self.focus_grace_period()

    def sindicato_history(self, data: dict):
        self.hotkey("ctrl", "enter")
        self.sleep(self.args.lookup_delay)
        self.log("")
        self.log("[SINDICATO / CATEGORIA NORMATIVA]")
        self.log(f"Sindicato: {as_text(data.get('sindicato'))}")
        self.log(f"Tipo tributacao: {as_text(data.get('tipo_tributacao_sindical'))}")
        self.log(f"Categoria normativa: {as_text(data.get('categoria_normativa'))}")
        self.log("No popup, insira o sindicato, escolha o tipo de tributacao e, se aplicavel, a categoria normativa. Depois pressione ENTER aqui.")
        input()
        self.focus_grace_period()

    def grau_risco_history(self, value: str):
        self.hotkey("ctrl", "enter")
        self.sleep(self.args.lookup_delay)
        self.log("")
        self.log("[GRAU DE RISCO]")
        self.log(f"Grau de risco: {value or '(vazio)'}")
        self.log("No popup, use Inserir, preencha Data de Inicio e escolha o Grau de Risco. Depois pressione ENTER aqui.")
        input()
        self.focus_grace_period()

    def execute(self):
        if self.args.bootstrap_start:
            self.bootstrap_into_employee_form()
        else:
            self.activate_window()
            if self.args.startup_delay > 0:
                self.log(f"Aguardando {self.args.startup_delay} segundo(s) para voce posicionar a tela...")
                time.sleep(self.args.startup_delay)
        data = get_form_data(self.payload)

        for index, action in enumerate(self.actions, start=1):
            self.log("")
            self.log(f"[{index:03d}/{len(self.actions):03d}] Aba: {action.tab_name} | {action.label}")
            if action.source_key:
                self.log(f"Campo do nosso sistema: {action.source_key}")
            if action.value:
                self.log(f"Valor: {action.value}")
            if action.note:
                self.log(f"Obs.: {action.note}")

            if action.kind == "manual":
                input("Quando estiver pronto, pressione ENTER para continuar...")
                self.focus_grace_period()
                continue

            if action.kind == "info":
                continue

            self.ensure_phoenix_focus()

            if action.kind == "tab":
                self.press("tab")
                continue

            if action.kind == "tab_n":
                count = int(action.value or "1")
                self.press("tab", count)
                continue

            if action.kind == "write_tab":
                if action.value:
                    self.type_text(action.value, clear=True)
                self.press("tab")
                continue

            if action.kind == "click_write":
                self.click_target(action.target_name)
                if action.value:
                    self.type_text(action.value, clear=True)
                continue

            if action.kind == "cep_search":
                self.cep_search(action.value)
                continue

            if action.kind == "combo":
                if action.value:
                    self.combo_select(action.value)
                self.press("tab")
                continue

            if action.kind == "lookup_search":
                self.lookup_search(action.value)
                self.press("tab")
                continue

            if action.kind == "checkbox":
                self.checkbox(bool(action.value))
                continue

            if action.kind == "next_tab":
                self.next_tab()
                continue

            if action.kind == "salary_history":
                self.salary_history(data)
                self.press("tab")
                continue

            if action.kind == "cargo_history":
                self.cargo_history(action.value)
                self.press("tab")
                continue

            if action.kind == "horario_history":
                self.horario_history(action.value)
                self.press("tab")
                continue

            if action.kind == "lookup_history":
                self.sindicato_history(data)
                self.press("tab")
                continue

            if action.kind == "grau_risco_history":
                self.grau_risco_history(action.value)
                self.press("tab")
                continue

            raise RuntimeError(f"Tipo de acao nao suportado: {action.kind}")


def main():
    parser = argparse.ArgumentParser(
        description="Primeira automacao nova do Phoenix por abas, baseada nas telas reais do cadastro."
    )
    parser.add_argument("--base-url", required=True, help="Ex.: https://www.palsys.com.br")
    parser.add_argument("--email", required=True, help="Login do cliente no sistema")
    parser.add_argument("--password", required=True, help="Senha do cliente no sistema")
    parser.add_argument("--employee-id", required=True, help="ID do funcionario finalizado")
    parser.add_argument(
        "--window-hint",
        default="phoenix",
        help="Trecho do titulo da janela para ativar o sistema de destino",
    )
    parser.add_argument(
        "--bootstrap-start",
        action="store_true",
        help="Abre o fluxo pela janela principal: clica em Funcionario, depois Inserir, e so entao entra no cadastro.",
    )
    parser.add_argument(
        "--startup-delay",
        type=float,
        default=5,
        help="Segundos para voce posicionar a tela antes do runner comecar, quando nao usar bootstrap",
    )
    parser.add_argument(
        "--main-window-hint",
        default="contmatic folha phoenix",
        help="Titulo da janela principal do Contmatic",
    )
    parser.add_argument(
        "--search-window-hint",
        default="pesquisar funcionarios",
        help="Titulo da janela de pesquisa de funcionarios",
    )
    parser.add_argument(
        "--form-window-hint",
        default="cadastro de funcionarios",
        help="Titulo da janela do cadastro de funcionarios",
    )
    parser.add_argument(
        "--activate-window",
        action="store_true",
        help="Ativa automaticamente a janela do Phoenix pelo titulo. Sem este parametro, voce mesmo deixa a tela posicionada.",
    )
    parser.add_argument("--delay", type=float, default=0.35, help="Pausa padrao entre acoes")
    parser.add_argument("--key-delay", type=float, default=0.08, help="Pausa entre teclas repetidas")
    parser.add_argument("--click-delay", type=float, default=0.2, help="Pausa apos clique em campo mapeado")
    parser.add_argument("--lookup-delay", type=float, default=0.9, help="Pausa extra para popups e telas auxiliares")
    parser.add_argument(
        "--layout-file",
        default="phoenix-layout.sample.json",
        help="JSON com coordenadas relativas dos campos do Phoenix",
    )
    parser.add_argument(
        "--focus-grace",
        type=float,
        default=5,
        help="Segundos de espera depois do ENTER manual para voce devolver o foco ao Phoenix",
    )
    args = parser.parse_args()

    session = requests.Session()
    login(session, args.base_url, args.email, args.password)
    payload = fetch_payload(session, args.base_url, args.employee_id)

    runner = PhoenixTabRunner(payload, args)
    runner.execute()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nEncerrado pelo usuario.", file=sys.stderr)
        sys.exit(1)
    except Exception as error:
        print(f"Erro: {error}", file=sys.stderr)
        sys.exit(1)
