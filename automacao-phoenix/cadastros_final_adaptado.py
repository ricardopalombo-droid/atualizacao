import os
import time
import re
import threading
from datetime import datetime, timedelta
import tkinter as tk
from tkinter import filedialog, ttk, messagebox, scrolledtext

import pyautogui
import pyperclip
import pygetwindow as gw
from pynput import keyboard as pynput_keyboard

# =========================
# CONFIGURAÇÕES
# =========================

ABA_PLANILHA = 1
NOME_ABA = None

CAMPO_ESOCIAL_X = 1094
CAMPO_ESOCIAL_Y = 515
IMAGEM_LABEL_MATRICULA_ESOCIAL = os.path.join(os.path.dirname(__file__), "matricula_esocial_label.png")

PRIMEIRO_ITEM_LISTA_X = None
PRIMEIRO_ITEM_LISTA_Y = None

TEMPO_INICIAL = 5
NOME_JANELA_CONTMATIC = "Contmatic Folha Phoenix"
APELIDO_CONTMATIC_ATUAL = ""

pyautogui.PAUSE = 0.25
pyautogui.FAILSAFE = True

# =========================
# EXCEL REAL
# =========================
try:
    import win32com.client as win32
except ImportError:
    raise ImportError("Módulo win32com não encontrado. Instale com: pip install pywin32")

# =========================
# CONTROLE DO ROBÔ
# =========================
PAUSADO = False
PARAR_PROCESSO = False
EM_EXECUCAO = False
LISTENER_TECLADO = None

# =========================
# GUI
# =========================
root = None
entry_planilha = None
entry_linha = None
combo_habilitada = None
combo_rateio = None
btn_iniciar = None
btn_pausar = None
btn_parar = None
txt_log = None


def log(mensagem: str):
    print(mensagem)
    if txt_log is not None:
        txt_log.after(0, lambda: _append_log(mensagem))


def esperar_janela_conter(trecho_titulo: str, timeout: float = 8.0, intervalo: float = 0.2) -> bool:
    trecho = (trecho_titulo or "").strip().lower()
    if not trecho:
        return False

    limite = time.time() + timeout
    while time.time() < limite:
        try:
            for titulo in gw.getAllTitles():
                if trecho in (titulo or "").strip().lower():
                    return True
        except Exception:
            pass
        time.sleep(intervalo)

    return False


def obter_titulo_janela_ativa() -> str:
    try:
        janela = gw.getActiveWindow()
        if janela and janela.title:
            return str(janela.title).strip()
    except Exception:
        pass
    return ""


def esperar_janela_sumir_por_titulo(titulo: str, timeout: float = 8.0, intervalo: float = 0.2) -> bool:
    titulo_normalizado = (titulo or "").strip().lower()
    if not titulo_normalizado:
        return False

    limite = time.time() + timeout
    while time.time() < limite:
        try:
            titulos = [str(item or "").strip().lower() for item in gw.getAllTitles()]
            if titulo_normalizado not in titulos:
                return True
        except Exception:
            pass
        time.sleep(intervalo)

    return False


def selecionar_empresa_por_apelido_contmatic():
    apelido = limpar_texto(APELIDO_CONTMATIC_ATUAL)
    if not apelido:
        return

    verificar_controle()
    pyautogui.hotkey("ctrl", "a")
    dormir_controlado(0.3)
    pyautogui.press("enter")
    dormir_controlado(0.8)

    titulo_selecao = obter_titulo_janela_ativa()

    digitar_lento(apelido, intervalo=0.05)
    dormir_controlado(0.2)
    pyautogui.hotkey("alt", "a")

    if titulo_selecao and titulo_selecao.lower() != NOME_JANELA_CONTMATIC.lower():
        if not esperar_janela_sumir_por_titulo(titulo_selecao, timeout=8.0, intervalo=0.2):
            dormir_controlado(1.0)
    else:
        dormir_controlado(1.2)


def clicar_campo_matricula_esocial() -> bool:
    try:
        if os.path.exists(IMAGEM_LABEL_MATRICULA_ESOCIAL):
            local = pyautogui.locateOnScreen(IMAGEM_LABEL_MATRICULA_ESOCIAL, grayscale=True)
            if local:
                x = int(local.left + local.width + 90)
                y = int(local.top + (local.height / 2))
                pyautogui.click(x, y)
                dormir_controlado(0.25)
                return True
    except Exception:
        pass

    pyautogui.click(CAMPO_ESOCIAL_X, CAMPO_ESOCIAL_Y)
    dormir_controlado(0.25)
    return True


def _append_log(mensagem: str):
    txt_log.insert(tk.END, mensagem + "\n")
    txt_log.see(tk.END)


def set_botoes(executando: bool):
    def _apply():
        if executando:
            btn_iniciar.config(state="disabled")
            btn_pausar.config(state="normal")
            btn_parar.config(state="normal")
        else:
            btn_iniciar.config(state="normal")
            btn_pausar.config(state="disabled", text="Pausar")
            btn_parar.config(state="disabled")
    root.after(0, _apply)


def alternar_pausa():
    global PAUSADO
    if not EM_EXECUCAO:
        return

    PAUSADO = not PAUSADO
    if PAUSADO:
        log("Processo PAUSADO.")
        if btn_pausar is not None:
            root.after(0, lambda: btn_pausar.config(text="Continuar"))
    else:
        log("Processo retomado.")
        if btn_pausar is not None:
            root.after(0, lambda: btn_pausar.config(text="Pausar"))


def parar_processo():
    global PARAR_PROCESSO
    PARAR_PROCESSO = True
    log("Processo interrompido pelo usuário.")


def ao_pressionar_tecla(tecla):
    try:
        if tecla == pynput_keyboard.Key.f8:
            alternar_pausa()
        elif tecla == pynput_keyboard.Key.f9:
            parar_processo()
    except Exception as e:
        log(f"Erro no listener do teclado: {e}")


def configurar_atalhos():
    global LISTENER_TECLADO

    if LISTENER_TECLADO is not None:
        try:
            LISTENER_TECLADO.stop()
        except Exception:
            pass

    LISTENER_TECLADO = pynput_keyboard.Listener(on_press=ao_pressionar_tecla)
    LISTENER_TECLADO.daemon = True
    LISTENER_TECLADO.start()

    log("Atalhos ativos: F8 = Pausar/Continuar | F9 = Interromper")


def verificar_controle():
    global PAUSADO, PARAR_PROCESSO

    if PARAR_PROCESSO:
        raise SystemExit("Processo interrompido pelo usuário.")

    while PAUSADO:
        if PARAR_PROCESSO:
            raise SystemExit("Processo interrompido pelo usuário.")
        time.sleep(0.1)


def dormir_controlado(segundos, passo=0.1):
    fim = time.time() + segundos
    while time.time() < fim:
        verificar_controle()
        restante = fim - time.time()
        time.sleep(min(passo, max(0.01, restante)))


# =========================
# FUNÇÕES AUXILIARES
# =========================

def valor_vazio(valor) -> bool:
    if valor is None:
        return True
    texto = str(valor).strip()
    return texto == "" or texto.lower() == "none"


def limpar_texto(valor) -> str:
    if valor_vazio(valor):
        return ""
    return str(valor).strip()


def limpar_numero_excel(valor) -> str:
    if valor_vazio(valor):
        return ""

    if isinstance(valor, (int, float)):
        try:
            if float(valor).is_integer():
                return str(int(valor))
        except Exception:
            pass

    texto = str(valor).strip()

    if texto.endswith(".0"):
        try:
            return str(int(float(texto)))
        except Exception:
            pass

    return texto


def limpar_codigo(valor) -> str:
    if valor_vazio(valor):
        return ""

    if isinstance(valor, (int, float)):
        try:
            if float(valor).is_integer():
                return str(int(valor))
        except Exception:
            pass

    texto = str(valor).strip()

    if texto.endswith(".0"):
        try:
            return str(int(float(texto)))
        except Exception:
            pass

    return texto


def limpar_somente_numeros(valor) -> str:
    if valor_vazio(valor):
        return ""
    return re.sub(r"\D+", "", str(valor))


def primeiros_numeros(valor) -> str:
    if valor_vazio(valor):
        return ""
    txt = str(valor).strip()
    m = re.match(r"^(\d+)", txt)
    if m:
        return m.group(1)
    return limpar_somente_numeros(valor)


def numeros_antes_do_traco(valor) -> str:
    if valor_vazio(valor):
        return ""

    texto = str(valor).strip()

    if "-" in texto:
        parte_antes = texto.split("-", 1)[0].strip()
        return re.sub(r"\D+", "", parte_antes)

    m = re.match(r"^\s*(\d+)", texto)
    if m:
        return m.group(1)

    return ""


def formatar_data_sem_barras(valor) -> str:
    if valor_vazio(valor):
        return ""

    if isinstance(valor, datetime):
        return valor.strftime("%d%m%Y")

    # Data serial do Excel
    if isinstance(valor, (int, float)):
        try:
            # Excel usa base 1899-12-30
            dt = datetime(1899, 12, 30) + timedelta(days=float(valor))
            return dt.strftime("%d%m%Y")
        except Exception:
            pass

    texto = str(valor).strip()

    for formato in ("%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d", "%d/%m/%y", "%d-%m-%y"):
        try:
            dt = datetime.strptime(texto, formato)
            return dt.strftime("%d%m%Y")
        except ValueError:
            pass

    so_numeros = re.sub(r"\D+", "", texto)
    if len(so_numeros) == 8:
        return so_numeros

    return ""


def escrever(texto: str, pausa_antes=0.1, pausa_depois=0.2):
    verificar_controle()
    texto = "" if texto is None else str(texto)
    pyperclip.copy(texto)
    dormir_controlado(pausa_antes)
    pyautogui.hotkey("ctrl", "v")
    dormir_controlado(pausa_depois)


def escrever_e_tab(texto: str, pausa_antes=0.1, pausa_depois=0.2, pausa_tab=0.2):
    escrever(texto, pausa_antes=pausa_antes, pausa_depois=pausa_depois)
    verificar_controle()
    pyautogui.press("tab")
    dormir_controlado(pausa_tab)


def digitar_lento(texto: str, intervalo=0.05):
    verificar_controle()
    texto = "" if texto is None else str(texto)
    pyautogui.write(texto, interval=intervalo)


def limpar_e_digitar(texto: str, intervalo=0.03):
    verificar_controle()
    pyautogui.hotkey("ctrl", "a")
    dormir_controlado(0.1)
    pyautogui.press("backspace")
    dormir_controlado(0.1)
    digitar_lento(texto, intervalo=intervalo)


def pressionar_tab(vezes=1, pausa=0.15):
    for _ in range(vezes):
        verificar_controle()
        pyautogui.press("tab")
        dormir_controlado(pausa)


def pressionar_enter(vezes=1, pausa=0.15):
    for _ in range(vezes):
        verificar_controle()
        pyautogui.press("enter")
        dormir_controlado(pausa)


def extrair_endereco(endereco: str):
    if valor_vazio(endereco):
        return {
            "cep": "",
            "numero": "",
            "complemento": "",
            "tem_complemento": False,
            "partes": []
        }

    partes = [p.strip() for p in str(endereco).split(",")]
    partes = [p for p in partes if p != ""]

    numero = ""
    complemento = ""
    cep = ""
    tem_complemento = False

    if len(partes) >= 8:
        numero = partes[1].strip()
        complemento = partes[2].strip()
        cep = partes[6].strip()
        tem_complemento = True
    elif len(partes) >= 7:
        numero = partes[1].strip()
        complemento = ""
        cep = partes[5].strip()
        tem_complemento = False
    else:
        if len(partes) > 1:
            numero = partes[1].strip()
        for p in partes:
            if re.search(r"\d{5}-?\d{3}", p):
                cep = p.strip()
                break

    cep = limpar_somente_numeros(cep)

    return {
        "cep": cep,
        "numero": numero,
        "complemento": complemento,
        "tem_complemento": tem_complemento,
        "partes": partes
    }


def formatar_valor_ab(valor) -> str:
    texto = limpar_texto(valor)

    if texto == "":
        return ""

    texto = texto.replace(" ", "")

    if "," in texto and "." in texto:
        ultimo_ponto = texto.rfind(".")
        ultima_virgula = texto.rfind(",")

        if ultima_virgula > ultimo_ponto:
            texto = texto.replace(".", "")
            texto = texto.replace(",", ".")
        else:
            texto = texto.replace(",", "")
    elif "," in texto:
        texto = texto.replace(",", ".")

    return texto


def formatar_horas_para_legacy(valor) -> str:
    texto = limpar_texto(valor)

    if texto == "":
        return ""

    texto = texto.replace(",", ".")

    try:
        numero = float(texto)
        if numero.is_integer():
            return str(int(numero))
        return str(numero).replace(".", ",")
    except Exception:
        return texto


def extra_bool(valor) -> bool:
    if isinstance(valor, bool):
        return valor

    texto = limpar_texto(valor).strip().lower()
    return texto in ("true", "1", "sim", "s", "yes")


def selecionar_combo_por_codigo_ou_descricao(valor):
    texto = limpar_texto(valor).strip()

    if texto == "":
        pyautogui.press("tab")
        dormir_controlado(0.25)
        return

    codigo = primeiros_numeros(texto)

    verificar_controle()
    pyautogui.hotkey("ctrl", "a")
    dormir_controlado(0.1)
    pyautogui.press("backspace")
    dormir_controlado(0.1)

    digitar_lento(codigo or texto, intervalo=0.05)
    dormir_controlado(0.2)
    pyautogui.press("enter")
    dormir_controlado(0.35)
    pyautogui.press("tab")
    dormir_controlado(0.25)


def selecionar_combo_por_codigo_sem_tab(valor):
    texto = limpar_texto(valor).strip()

    if texto == "":
        return

    codigo = primeiros_numeros(texto)

    verificar_controle()
    pyautogui.hotkey("ctrl", "a")
    dormir_controlado(0.1)
    pyautogui.press("backspace")
    dormir_controlado(0.1)
    digitar_lento(codigo or texto, intervalo=0.05)
    dormir_controlado(0.2)
    pyautogui.press("enter")
    dormir_controlado(0.35)


def preencher_ou_tab(texto: str):
    if valor_vazio(texto):
        pyautogui.press("tab")
        dormir_controlado(0.25)
    else:
        escrever_e_tab(texto)


def processar_bloco_deficiencia(
    fisica: bool,
    visual: bool,
    auditiva: bool,
    observacao: str,
    mental: bool,
    intelectual: bool,
    preenche_cota: bool,
):
    marcou_alguma_deficiencia = any((fisica, visual, auditiva, mental, intelectual))

    for marcado in (fisica, visual, auditiva, mental, intelectual):
        if marcado:
            pyautogui.press("space")
            dormir_controlado(0.15)
        pyautogui.press("tab")
        dormir_controlado(0.2)

    if marcou_alguma_deficiencia:
        pyautogui.press("tab")
        dormir_controlado(0.2)
        pyautogui.press("tab")
        dormir_controlado(0.2)

    if preenche_cota:
        pyautogui.press("space")
        dormir_controlado(0.15)

    if marcou_alguma_deficiencia and not valor_vazio(observacao):
        pyautogui.hotkey("shift", "tab")
        dormir_controlado(0.2)
        pyautogui.hotkey("ctrl", "enter")
        dormir_controlado(0.3)
        escrever(observacao)
        dormir_controlado(0.2)
        pyautogui.hotkey("alt", "o")
        dormir_controlado(0.4)
        pyautogui.press("tab")
        dormir_controlado(0.25)
        pyautogui.press("tab")
        dormir_controlado(0.25)
    else:
        pyautogui.press("tab")
        dormir_controlado(0.25)


def duplo_clique_primeiro_item(x=None, y=None):
    verificar_controle()
    if x is not None and y is not None:
        pyautogui.doubleClick(x=x, y=y, interval=0.2)
    else:
        pyautogui.doubleClick(interval=0.2)
    dormir_controlado(0.5)


def separar_coluna_an(valor):
    texto = limpar_texto(valor)

    if texto == "":
        return "", "", ""

    partes = [p.strip() for p in texto.split("/")]

    parte1 = ""
    parte2 = ""
    parte3 = ""

    if len(partes) >= 2:
        parte1 = f"{partes[0]}/{partes[1]}"
    elif len(partes) == 1:
        parte1 = partes[0]

    if len(partes) >= 3:
        parte2 = partes[2]

    if len(partes) >= 4:
        parte3 = partes[3]

    return parte1, parte2, parte3


def selecionar_opcao_lista(valor, confirmar_com_enter=True):
    texto = limpar_texto(valor)

    verificar_controle()
    pyautogui.hotkey("ctrl", "a")
    dormir_controlado(0.1)
    pyautogui.press("backspace")
    dormir_controlado(0.1)

    if texto != "":
        digitar_lento(texto, intervalo=0.05)
        dormir_controlado(0.2)

    if confirmar_com_enter:
        pyautogui.press("enter")
        dormir_controlado(0.4)


# =========================
# FUNÇÕES DE SELEÇÃO
# =========================

def selecionar_raca_cor(valor):
    texto = limpar_texto(valor).strip().upper()

    match = re.match(r"^\s*(\d)", texto)
    codigo = match.group(1) if match else ""

    if not codigo:
        mapa = {
            "BRANCA": "2",
            "BRANCO": "2",
            "PRETA": "4",
            "PRETO": "4",
            "NEGRA": "4",
            "NEGRO": "4",
            "PRETA / NEGRA": "4",
            "PRETO / NEGRO": "4",
            "AMARELA": "6",
            "AMARELO": "6",
            "PARDA": "8",
            "PARDO": "8",
            "INDIGENA": "0",
            "INDÍGENA": "0",
        }
        for chave, valor_codigo in mapa.items():
            if chave in texto:
                codigo = valor_codigo
                break

    verificar_controle()
    if codigo:
        pyautogui.press(codigo)
        dormir_controlado(0.2)
        pyautogui.press("enter")
        dormir_controlado(0.3)
    else:
        log(f"Raça/Cor não reconhecida: {texto}")


def selecionar_sexo(valor):
    texto = limpar_texto(valor).strip().upper()

    verificar_controle()
    if texto.startswith("M"):
        pyautogui.press("1")
    elif texto.startswith("F"):
        pyautogui.press("2")
    else:
        escrever(texto)

    dormir_controlado(0.2)
    pyautogui.press("enter")
    dormir_controlado(0.3)


def selecionar_estado_civil(valor):
    texto = limpar_texto(valor).strip().upper()

    match = re.match(r"^\s*(\d)", texto)
    codigo = match.group(1) if match else ""

    if not codigo:
        mapa = {
            "SOLTEIRO": "1",
            "SOLTEIRO(A)": "1",
            "CASADO": "2",
            "CASADO(A)": "2",
            "DIVORCIADO": "3",
            "DIVORCIADO(A)": "3",
            "VIUVO": "4",
            "VIÚVO": "4",
            "VIUVA": "4",
            "VIÚVA": "4",
            "DESQUITADO": "5",
            "UNIAO ESTAVEL": "6",
            "UNIÃO ESTÁVEL": "6",
            "OUTROS": "7",
        }
        for chave, valor_codigo in mapa.items():
            if chave in texto:
                codigo = valor_codigo
                break

    verificar_controle()
    if codigo:
        pyautogui.press(codigo)
        dormir_controlado(0.2)
        pyautogui.press("enter")
        dormir_controlado(0.3)
    else:
        log(f"Estado civil não reconhecido: {texto}")


def selecionar_nacionalidade(valor):
    texto = limpar_texto(valor).strip().upper()

    if texto == "":
        log("Nacionalidade vazia.")
        return

    match = re.match(r"^\s*(\d{1,3})", texto)
    codigo = match.group(1) if match else ""

    if not codigo:
        mapa = {
            "BRASILEIRA": "10",
            "BRASILEIRO": "10",
            "NATURALIZADO": "20",
            "NATURALIZADA": "20",
            "NATURALIZADO/BRASILEIRA": "20",
            "ARGENTINA": "21",
            "ARGENTINO": "21",
            "BOLIVIANA": "22",
            "BOLIVIANO": "22",
            "CHILENA": "23",
            "CHILENO": "23",
            "PARAGUAIA": "24",
            "PARAGUAIO": "24",
            "URUGUAIA": "25",
            "URUGUAIO": "25",
            "VENEZUELANA": "26",
            "VENEZUELANO": "26",
        }

        for chave, valor_codigo in mapa.items():
            if chave in texto:
                codigo = valor_codigo
                break

    if codigo:
        log(f"Nacionalidade selecionada: {codigo} | origem: {texto}")
        verificar_controle()
        pyautogui.hotkey("ctrl", "a")
        dormir_controlado(0.1)
        pyautogui.press("backspace")
        dormir_controlado(0.1)
        digitar_lento(codigo, intervalo=0.05)
        dormir_controlado(0.2)
        pyautogui.press("enter")
        dormir_controlado(0.4)
    else:
        log(f"Nacionalidade não reconhecida: {texto}")


def selecionar_grau_instrucao(valor):
    texto = limpar_texto(valor).strip().upper()

    if texto == "":
        log("Grau de instrução vazio.")
        return

    match = re.match(r"^\s*(\d{1,3})", texto)
    codigo = match.group(1) if match else ""

    if not codigo:
        mapa = {
            "ANALFABETO": "1",
            "ATE O 5O ANO INCOMPLETO DO ENSINO FUNDAMENTAL": "2",
            "ATÉ O 5O ANO INCOMPLETO DO ENSINO FUNDAMENTAL": "2",
            "5O ANO COMPLETO DO ENSINO FUNDAMENTAL": "3",
            "DO 6O AO 9O ANO DO ENSINO FUNDAMENTAL INCOMPLETO": "4",
            "ENSINO FUNDAMENTAL COMPLETO": "5",
            "ENSINO MEDIO INCOMPLETO": "6",
            "ENSINO MÉDIO INCOMPLETO": "6",
            "ENSINO MEDIO COMPLETO": "7",
            "ENSINO MÉDIO COMPLETO": "7",
            "SUPERIOR INCOMPLETO": "8",
            "SUPERIOR COMPLETO": "9",
            "POS GRADUACAO": "10",
            "PÓS GRADUAÇÃO": "10",
            "MESTRADO": "11",
            "DOUTORADO": "12",
        }

        for chave, valor_codigo in mapa.items():
            if chave in texto:
                codigo = valor_codigo
                break

    if codigo:
        log(f"Grau de instrução selecionado: {codigo} | origem: {texto}")
        verificar_controle()
        pyautogui.hotkey("ctrl", "a")
        dormir_controlado(0.1)
        pyautogui.press("backspace")
        dormir_controlado(0.1)
        digitar_lento(codigo, intervalo=0.05)
        dormir_controlado(0.2)
        pyautogui.press("enter")
        dormir_controlado(0.4)
    else:
        log(f"Grau de instrução não reconhecido: {texto}")


def selecionar_vinculo_empregaticio(valor):
    texto = limpar_texto(valor).strip().upper()

    if texto == "":
        log("Vínculo empregatício vazio.")
        return

    match = re.match(r"^\s*(\d{1,3})", texto)
    codigo = match.group(1) if match else ""

    if not codigo:
        mapa = {
            "TRAB. URBANO VINC. EMPREGADOR PESSOA JURIDICA": "10",
            "TRAB. URBANO VINC. EMPREGADOR PESSOA JURÍDICA": "10",
            "TRAB. URBANO VINC. EMPREGADOR PESSOA FISICA": "15",
            "TRAB. URBANO VINC. EMPREGADOR PESSOA FÍSICA": "15",
            "TRAB. RURAL VINC. EMPREGADOR PESSOA JURIDICA": "20",
            "TRAB. RURAL VINC. EMPREGADOR PESSOA JURÍDICA": "20",
            "TRAB. RURAL VINC. EMPREGADOR PESSOA FISICA": "25",
            "TRAB. RURAL VINC. EMPREGADOR PESSOA FÍSICA": "25",
            "SERVIDOR REGIDO PELO REGIME JURIDICO UNICO": "30",
            "SERVIDOR REGIDO PELO REGIME JURÍDICO ÚNICO": "30",
            "SERV. PUBLICO NAO-EFETIVO": "35",
            "SERV. PÚBLICO NÃO-EFETIVO": "35",
            "TRAB. AVULSO": "40",
            "TRABALHADOR TEMPORARIO": "50",
            "TRABALHADOR TEMPORÁRIO": "50",
            "APRENDIZ": "55",
        }

        for chave, valor_codigo in mapa.items():
            if chave in texto:
                codigo = valor_codigo
                break

    if codigo:
        log(f"Vínculo empregatício selecionado: {codigo} | origem: {texto}")
        verificar_controle()
        pyautogui.hotkey("ctrl", "a")
        dormir_controlado(0.1)
        pyautogui.press("backspace")
        dormir_controlado(0.1)
        digitar_lento(codigo, intervalo=0.05)
        dormir_controlado(0.2)
        pyautogui.press("enter")
        dormir_controlado(0.4)
    else:
        log(f"Vínculo empregatício não reconhecido: {texto}")


def selecionar_codigo_admissao(valor):
    texto = limpar_texto(valor).strip().upper()

    if texto == "":
        log("Código de admissão vazio.")
        return

    match = re.match(r"^\s*(\d{1,3})", texto)
    codigo = match.group(1) if match else ""

    if not codigo:
        mapa = {
            "DIRETOR NAO EMPREGADO": "1",
            "DIRETOR NÃO EMPREGADO": "1",
            "TRABALHADOR RURAL": "2",
            "JOVEM APRENDIZ": "3",
            "OUTROS": "9",
            "DIRIGENTE SINDICAL": "10",
        }

        for chave, valor_codigo in mapa.items():
            if chave in texto:
                codigo = valor_codigo
                break

    if codigo:
        log(f"Código de admissão selecionado: {codigo} | origem: {texto}")
        verificar_controle()
        pyautogui.hotkey("ctrl", "a")
        dormir_controlado(0.1)
        pyautogui.press("backspace")
        dormir_controlado(0.1)
        digitar_lento(codigo, intervalo=0.05)
        dormir_controlado(0.2)
        pyautogui.press("enter")
        dormir_controlado(0.4)
    else:
        log(f"Código de admissão não reconhecido: {texto}")


def selecionar_grau_risco(valor):
    texto = limpar_texto(valor).strip().upper()

    if texto == "":
        log("Grau de risco vazio.")
        return

    match = re.match(r"^\s*(\d{1,3})", texto)
    codigo = match.group(1) if match else ""

    if not codigo:
        mapa = {
            "NAO EXPOSICAO A AGENTE NOCIVO": "1",
            "NÃO EXPOSIÇÃO A AGENTE NOCIVO": "1",
            "APOSENT. EXP. 15 ANOS": "2",
            "APOSENT EXP 15 ANOS": "2",
            "APOSENT. EXP. 20 ANOS": "3",
            "APOSENT EXP 20 ANOS": "3",
            "APOSENT. EXP. 25 ANOS": "4",
            "APOSENT EXP 25 ANOS": "4",
            "NAO EXPOSICAO A AGENTE NOCIVO (MAIS DE UM VINCULO)": "5",
            "NÃO EXPOSIÇÃO A AGENTE NOCIVO (MAIS DE UM VÍNCULO)": "5",
            "APOSENT. EXP. 15 ANOS) (MAIS DE UM VINCULO": "6",
            "APOSENT. EXP. 15 ANOS) (MAIS DE UM VÍNCULO": "6",
            "APOSENT. EXP. 20 ANOS) (MAIS DE UM VINCULO": "7",
            "APOSENT. EXP. 20 ANOS) (MAIS DE UM VÍNCULO": "7",
            "APOSENT. EXP. 25 ANOS) (MAIS DE UM VINCULO": "8",
            "APOSENT. EXP. 25 ANOS) (MAIS DE UM VÍNCULO": "8",
            "EMPREGADORES CUJA ATIVIDADE NÃO EXPONHA SEUS TRABALHADORES A AGENTES NOCIVOS": "9",
        }

        for chave, valor_codigo in mapa.items():
            if chave in texto:
                codigo = valor_codigo
                break

    if codigo:
        log(f"Grau de risco selecionado: {codigo} | origem: {texto}")
        verificar_controle()
        pyautogui.hotkey("ctrl", "a")
        dormir_controlado(0.1)
        pyautogui.press("backspace")
        dormir_controlado(0.1)
        digitar_lento(codigo, intervalo=0.05)
        dormir_controlado(0.2)
        pyautogui.press("enter")
        dormir_controlado(0.4)
    else:
        log(f"Grau de risco não reconhecido: {texto}")


def selecionar_caged(valor):
    texto = limpar_texto(valor).strip().upper()

    if texto == "":
        log("CAGED vazio.")
        return

    match = re.match(r"^\s*(\d{1,3})", texto)
    codigo = match.group(1) if match else ""

    if not codigo:
        mapa = {
            "ADMISSAO DE EMPREGADO NO 1O EMPREGO": "10",
            "ADMISSÃO DE EMPREGADO NO 1O EMPREGO": "10",
            "PRIMEIRO EMPREGO": "10",
            "ADMISSAO DE EMPREGADO COM EMPREGO ANTERIOR": "30",
            "ADMISSÃO DE EMPREGADO COM EMPREGO ANTERIOR": "30",
            "EMPREGO ANTERIOR": "30",
            "REINTEGRACAO": "69",
            "REINTEGRAÇÃO": "69",
            "TRANSFERENCIA DE ENTRADA": "70",
            "TRANSFERÊNCIA DE ENTRADA": "70",
        }

        for chave, valor_codigo in mapa.items():
            if chave in texto:
                codigo = valor_codigo
                break

    if codigo:
        log(f"CAGED selecionado: {codigo} | origem: {texto}")
        verificar_controle()
        pyautogui.hotkey("ctrl", "a")
        dormir_controlado(0.1)
        pyautogui.press("backspace")
        dormir_controlado(0.1)
        digitar_lento(codigo, intervalo=0.05)
        dormir_controlado(0.2)
        pyautogui.press("enter")
        dormir_controlado(0.4)
    else:
        log(f"CAGED não reconhecido: {texto}")


def selecionar_orgao_emissor(valor):
    texto = limpar_texto(valor).strip().upper()

    if texto == "":
        log("Órgão emissor vazio.")
        return

    match = re.match(r"^\s*(\d{1,3})", texto)
    codigo = match.group(1) if match else ""

    if not codigo:
        mapa = {
            "DETRAN": "1",
            "DEPARTAMENTO ESTADUAL DE TRANSITO DE SAO PAULO": "1",
            "DEPARTAMENTO ESTADUAL DE TRÂNSITO DE SÃO PAULO": "1",
            "CIRETRAN": "2",
            "CIRCUNSCRICAO REGIONAL DE TRANSITO": "2",
            "CIRCUNSCRIÇÃO REGIONAL DE TRÂNSITO": "2",
            "OUTROS": "3",
        }

        for chave, valor_codigo in mapa.items():
            if chave in texto:
                codigo = valor_codigo
                break

    if not codigo:
        log(f"Órgão emissor não reconhecido: {texto}")
        return

    log(f"Órgão emissor selecionado: {codigo} | origem: {texto}")

    verificar_controle()
    pyautogui.hotkey("ctrl", "a")
    dormir_controlado(0.1)
    pyautogui.press("backspace")
    dormir_controlado(0.1)
    digitar_lento(codigo, intervalo=0.05)
    dormir_controlado(0.2)
    pyautogui.press("enter")
    dormir_controlado(0.4)


def selecionar_sp():
    verificar_controle()
    pyautogui.hotkey("ctrl", "a")
    dormir_controlado(0.1)
    pyautogui.press("backspace")
    dormir_controlado(0.1)
    digitar_lento("SS", intervalo=0.05)
    dormir_controlado(0.2)
    pyautogui.press("enter")
    dormir_controlado(0.4)


# =========================
# EXCEL
# =========================

def obter_texto_excel(celula):
    try:
        return str(celula.Text).strip()
    except Exception:
        return ""


def obter_valor_excel(celula):
    try:
        return celula.Value
    except Exception:
        return None


def linha_vazia(ws, linha):
    colunas_teste = ["A", "B", "C", "U", "DH"]
    for col in colunas_teste:
        valor = obter_valor_excel(ws.Range(f"{col}{linha}"))
        if not valor_vazio(valor):
            return False
    return True


def obter_dados_linha(ws, linha: int):
    def v(col):
        return obter_valor_excel(ws.Range(f"{col}{linha}"))

    def t(col):
        return obter_texto_excel(ws.Range(f"{col}{linha}"))

    valor_v_texto = t("V")
    valor_v_valor = v("V")

    valor_w_texto = t("W")
    valor_w_valor = v("W")

    valor_i_texto = t("I")
    valor_i_valor = v("I")

    valor_u_texto = t("U")
    valor_u_valor = v("U")

    valor_at_texto = t("AT")
    valor_at_valor = v("AT")

    valor_av_texto = t("AV")
    valor_av_valor = v("AV")

    return {
        "LINHA": linha,
        "A": v("A"),
        "B": v("B"),
        "C": v("C"),
        "D": v("D"),
        "E": v("E"),
        "F": v("F"),
        "G": v("G"),
        "H": v("H"),
        "I": valor_i_texto if valor_i_texto else valor_i_valor,
        "J": v("J"),
        "K": v("K"),
        "M": v("M"),
        "N": v("N"),
        "O": v("O"),
        "Q": v("Q"),
        "U": valor_u_texto if valor_u_texto else valor_u_valor,
        "V": valor_v_texto if valor_v_texto else valor_v_valor,
        "W": valor_w_texto if valor_w_texto else valor_w_valor,
        "Y": v("Y"),
        "AA": v("AA"),
        "AB": v("AB"),
        "AC": v("AC"),
        "AF": v("AF"),
        "AG": v("AG"),
        "AH": v("AH"),
        "AK": v("AK"),
        "AL": v("AL"),
        "AN": v("AN"),
        "AO": v("AO"),
        "AP": v("AP"),
        "AQ": v("AQ"),
        "AR": v("AR"),
        "AS": v("AS"),
        "AT": valor_at_texto if valor_at_texto else valor_at_valor,
        "AU": v("AU"),
        "AV": valor_av_texto if valor_av_texto else valor_av_valor,
        "DG": v("DG"),
        "DI": v("DI"),
        "DJ": v("DJ"),
        "DK": v("DK"),
        "DH": v("DH"),
        "DN": v("DN"),
        "DO": v("DO"),
        "DP": v("DP"),
        "DQ": v("DQ"),
    }


def obter_todas_as_linhas_excel(arquivo: str, linha_inicial=5):
    excel = win32.Dispatch("Excel.Application")
    excel.Visible = False
    excel.DisplayAlerts = False

    wb = excel.Workbooks.Open(arquivo)

    try:
        ws = wb.Worksheets(NOME_ABA) if NOME_ABA else wb.Worksheets(ABA_PLANILHA)
        ultima_linha = ws.UsedRange.Rows.Count
        dados_linhas = []

        for linha in range(linha_inicial, ultima_linha + 1):
            if linha_vazia(ws, linha):
                continue
            dados_linhas.append(obter_dados_linha(ws, linha))

        return dados_linhas

    finally:
        wb.Close(SaveChanges=False)
        excel.Quit()


# =========================
# CONTMATIC
# =========================

def ativar_janela_contmatic():
    titulos_alvo = [
        "Contmatic Folha Phoenix",
        "Folha"
    ]

    log("Procurando janela do Contmatic...")

    janela_encontrada = None
    titulo_encontrado = ""

    titulos_abertos = gw.getAllTitles()

    for titulo in titulos_abertos:
        titulo_limpo = str(titulo).strip()
        if not titulo_limpo:
            continue

        for alvo in titulos_alvo:
            if alvo.lower() in titulo_limpo.lower():
                janelas = gw.getWindowsWithTitle(titulo_limpo)
                if janelas:
                    janela_encontrada = janelas[0]
                    titulo_encontrado = titulo_limpo
                    break

        if janela_encontrada:
            break

    if not janela_encontrada:
        raise RuntimeError("Janela do Contmatic não encontrada.")

    log(f"Janela encontrada: {titulo_encontrado}")

    try:
        root.iconify()
    except Exception:
        pass

    dormir_controlado(0.5)

    if janela_encontrada.isMinimized:
        janela_encontrada.restore()
        dormir_controlado(1.0)

    try:
        janela_encontrada.activate()
        dormir_controlado(1.0)
    except Exception:
        pass

    try:
        janela_encontrada.maximize()
        dormir_controlado(1.0)
    except Exception:
        pass

    try:
        import win32com.client
        shell = win32com.client.Dispatch("WScript.Shell")
        shell.SendKeys('%')
        dormir_controlado(0.3)
        shell.AppActivate(titulo_encontrado)
        dormir_controlado(1.0)
    except Exception:
        pass

    log("Janela Contmatic ativada.")


def abrir_rotina_uma_vez():
    log(f"Iniciando em {TEMPO_INICIAL} segundos...")
    dormir_controlado(TEMPO_INICIAL)

    selecionar_empresa_por_apelido_contmatic()

    verificar_controle()
    pyautogui.hotkey("alt", "q")
    dormir_controlado(0.3)
    pyautogui.press("f")
    dormir_controlado(0.2)
    pyautogui.press("f")
    dormir_controlado(0.2)
    pyautogui.press("a")
    if esperar_janela_conter("Pesquisar Funcionários", timeout=8.0, intervalo=0.2):
        dormir_controlado(0.2)
    else:
        dormir_controlado(1.8)


# =========================
# PREENCHIMENTO
# =========================

def preencher_sistema(dados: dict, empresa_habilitada: str, empresa_rateio: str):
    verificar_controle()

    linha_excel = dados.get("LINHA", "")
    endereco = extrair_endereco(dados["C"])

    col_a = limpar_codigo(dados["A"])
    col_b = limpar_texto(dados["B"])
    col_u = formatar_data_sem_barras(dados["U"])
    col_v = formatar_data_sem_barras(dados["V"])
    col_w = limpar_numero_excel(dados["W"])

    col_f = limpar_texto(dados["F"])
    col_g = limpar_texto(dados["G"])
    col_dh = limpar_texto(dados["DH"])
    col_dg = limpar_texto(dados["DG"])
    col_di = limpar_texto(dados["DI"])
    col_dj = limpar_texto(dados["DJ"])
    col_dk = limpar_texto(dados["DK"])

    col_h = limpar_texto(dados["H"])
    col_d = limpar_texto(dados["D"])
    col_e = limpar_texto(dados["E"])
    col_n = limpar_texto(dados["N"])
    col_o = limpar_texto(dados["O"])
    col_m = limpar_texto(dados["M"])
    col_i = formatar_data_sem_barras(dados["I"])
    col_j = limpar_texto(dados["J"])
    col_k = limpar_texto(dados["K"])
    col_q_numerico = limpar_somente_numeros(dados["Q"])
    col_y_numerico = primeiros_numeros(dados["Y"])
    col_aa_numerico = primeiros_numeros(dados["AA"])
    col_ab = formatar_valor_ab(dados["AB"])
    col_extra_horas_semanais = formatar_horas_para_legacy(dados.get("EXTRA_HORAS_SEMANAIS", ""))
    col_extra_horas_mensais = formatar_horas_para_legacy(dados.get("EXTRA_HORAS_MENSAIS", ""))
    col_extra_experiencia_qtde_dias = limpar_texto(dados.get("EXTRA_EXPERIENCIA_QTDE_DIAS", ""))
    col_extra_experiencia_qtde_dias_prorrogacao = limpar_texto(dados.get("EXTRA_EXPERIENCIA_QTDE_DIAS_PRORROGACAO", ""))
    col_extra_registro_funcionario = limpar_texto(dados.get("EXTRA_REGISTRO_FUNCIONARIO", "")) or limpar_texto(dados.get("DA", ""))
    col_extra_folha_ficha = limpar_texto(dados.get("EXTRA_FOLHA_FICHA", "")) or limpar_texto(dados.get("DB", ""))
    col_extra_chapa = limpar_texto(dados.get("EXTRA_CHAPA", ""))
    col_extra_forma_pagamento = limpar_texto(dados.get("EXTRA_FORMA_PAGAMENTO", ""))
    col_extra_tipo_pagamento = limpar_texto(dados.get("EXTRA_TIPO_PAGAMENTO", ""))
    col_extra_regime_jornada = limpar_texto(dados.get("EXTRA_REGIME_JORNADA", ""))
    col_extra_tipo_tributacao_sindical = limpar_texto(dados.get("EXTRA_TIPO_TRIBUTACAO_SINDICAL", ""))
    flag_ctps_digital = extra_bool(dados.get("EXTRA_CTPS_DIGITAL", ""))
    col_extra_ctps_numero = limpar_texto(dados.get("EXTRA_CTPS_NUMERO", ""))
    col_extra_ctps_serie = limpar_texto(dados.get("EXTRA_CTPS_SERIE", ""))
    col_extra_ctps_uf = limpar_texto(dados.get("EXTRA_CTPS_UF", ""))
    col_extra_ctps_data_expedicao = formatar_data_sem_barras(dados.get("EXTRA_CTPS_DATA_EXPEDICAO", ""))
    col_extra_cargo_codigo = limpar_texto(dados.get("EXTRA_CARGO_CODIGO", ""))
    col_extra_cargo_descricao = limpar_texto(dados.get("EXTRA_CARGO_DESCRICAO", ""))
    col_extra_horario_codigo = limpar_texto(dados.get("EXTRA_HORARIO_CODIGO", ""))
    col_extra_horario_descricao = limpar_texto(dados.get("EXTRA_HORARIO_DESCRICAO", ""))
    col_extra_observacao_deficiencia = limpar_texto(dados.get("EXTRA_OBSERVACAO_DEFICIENCIA", ""))
    col_extra_percepcao_seguro_desemprego = limpar_texto(dados.get("EXTRA_PERCEPCAO_SEGURO_DESEMPREGO", ""))
    flag_deficiencia_fisica = extra_bool(dados.get("EXTRA_DEFICIENCIA_FISICA", ""))
    flag_deficiencia_visual = extra_bool(dados.get("EXTRA_DEFICIENCIA_VISUAL", ""))
    flag_deficiencia_auditiva = extra_bool(dados.get("EXTRA_DEFICIENCIA_AUDITIVA", ""))
    flag_deficiencia_mental = extra_bool(dados.get("EXTRA_DEFICIENCIA_MENTAL", ""))
    flag_deficiencia_intelectual = extra_bool(dados.get("EXTRA_DEFICIENCIA_INTELECTUAL", ""))
    flag_preenche_cota_pcd = extra_bool(dados.get("EXTRA_PREENCHE_COTA_PCD", ""))
    col_ac = limpar_texto(dados["AC"])
    col_af_numerico = numeros_antes_do_traco(dados["AF"])
    col_ag = limpar_numero_excel(dados["AG"])
    col_ah = limpar_numero_excel(dados["AH"])
    col_ak = limpar_texto(dados["AK"])
    col_al = limpar_texto(dados["AL"])
    col_an = limpar_texto(dados["AN"])
    col_ao = limpar_texto(dados["AO"])
    col_ap = limpar_texto(dados["AP"])
    col_aq = limpar_texto(dados["AQ"])
    col_ar = limpar_numero_excel(dados["AR"])
    col_as = limpar_texto(dados["AS"])
    col_at = formatar_data_sem_barras(dados["AT"])
    col_au = limpar_texto(dados["AU"])
    col_av = formatar_data_sem_barras(dados["AV"])
    col_dn = limpar_texto(dados["DN"])
    col_do = limpar_texto(dados["DO"])
    col_dp = limpar_texto(dados["DP"])
    col_dq = limpar_texto(dados["DQ"])

    an_parte1, an_parte2, an_parte3 = separar_coluna_an(col_an)

    log("=" * 70)
    log(f"PROCESSANDO LINHA {linha_excel}")
    log(f"V formatado = {col_v}")
    log(f"W formatado = {col_w}")
    log(f"Coluna I original: {dados['I']} | formatada: {col_i}")
    log(f"Coluna U original: {dados['U']} | formatada: {col_u}")
    log(f"Horas semanais extra = {col_extra_horas_semanais}")
    log(f"Horas mensais extra = {col_extra_horas_mensais}")

    pyautogui.hotkey("alt", "i")
    dormir_controlado(1.0)

    escrever_e_tab(col_a)
    escrever_e_tab(col_b)

    limpar_e_digitar(col_u, intervalo=0.05)
    dormir_controlado(0.3)

    if empresa_habilitada == "S":
        pressionar_tab(2, pausa=0.2)
        pyautogui.press("enter")
        dormir_controlado(0.5)

        pyautogui.hotkey("alt", "i")
        dormir_controlado(0.5)

        selecionar_opcao_lista("1")
        dormir_controlado(0.2)
        selecionar_opcao_lista(col_di)
        dormir_controlado(0.2)
        selecionar_opcao_lista(col_dg)
        dormir_controlado(0.2)
        selecionar_opcao_lista(col_dj)
        dormir_controlado(0.2)

        pressionar_tab(1, pausa=0.2)
        escrever(col_dk)
        dormir_controlado(0.2)

        pressionar_tab(1, pausa=0.2)
        pyautogui.press("enter")
        dormir_controlado(0.6)

        pyautogui.hotkey("alt", "s")
        dormir_controlado(0.4)

        pyautogui.hotkey("alt", "f4")
        dormir_controlado(0.5)

        pyautogui.press("right")
        dormir_controlado(0.2)
        pressionar_tab(2)
    else:
        pressionar_tab(5, pausa=0.2)

    escrever(endereco["cep"])
    pyautogui.press("tab")
    dormir_controlado(0.2)
    pyautogui.press("enter")
    dormir_controlado(1.5)

    digitar_lento(endereco["numero"], intervalo=0.08)
    dormir_controlado(0.5)
    pyautogui.press("tab")
    dormir_controlado(0.3)

    if endereco["tem_complemento"] and endereco["complemento"]:
        escrever(endereco["complemento"])
        pressionar_tab(4)
    else:
        pressionar_tab(4)

    escrever_e_tab(col_f)
    escrever_e_tab(col_g)

    preencher_ou_tab(col_extra_registro_funcionario)
    if valor_vazio(col_extra_folha_ficha):
        pyautogui.press("tab")
        dormir_controlado(0.2)
    else:
        limpar_e_digitar(col_extra_folha_ficha, intervalo=0.05)
        dormir_controlado(0.2)
        pyautogui.press("tab")
        dormir_controlado(0.2)
    preencher_ou_tab(col_extra_chapa)

    if valor_vazio(col_dh):
        dormir_controlado(0.2)
    else:
        clicar_campo_matricula_esocial()
        pyautogui.hotkey("ctrl", "a")
        pyautogui.press("backspace")
        escrever(col_dh)
        pyautogui.press("tab")
        dormir_controlado(0.2)

    escrever(col_h)
    dormir_controlado(0.3)
    pressionar_tab(2)

    escrever_e_tab(col_d)
    escrever_e_tab(col_e)

    selecionar_sexo(col_n)

    selecionar_estado_civil(col_o)
    pyautogui.press("tab")
    dormir_controlado(0.2)

    selecionar_raca_cor(col_m)

    limpar_e_digitar(col_i, intervalo=0.05)
    dormir_controlado(0.2)
    pyautogui.press("tab")
    dormir_controlado(0.2)

    pyautogui.hotkey("ctrl", "enter")
    dormir_controlado(0.2)
    escrever(col_j)
    pyautogui.press("enter")
    dormir_controlado(0.2)
    pyautogui.press("tab")
    dormir_controlado(0.2)

    if col_k == "":
        processar_bloco_deficiencia(
            fisica=flag_deficiencia_fisica,
            visual=flag_deficiencia_visual,
            auditiva=flag_deficiencia_auditiva,
            observacao=col_extra_observacao_deficiencia,
            mental=flag_deficiencia_mental,
            intelectual=flag_deficiencia_intelectual,
            preenche_cota=flag_preenche_cota_pcd,
        )
    else:
        pyautogui.hotkey("ctrl", "enter")
        dormir_controlado(0.2)
        escrever(col_k)
        pressionar_enter(2)
        processar_bloco_deficiencia(
            fisica=flag_deficiencia_fisica,
            visual=flag_deficiencia_visual,
            auditiva=flag_deficiencia_auditiva,
            observacao=col_extra_observacao_deficiencia,
            mental=flag_deficiencia_mental,
            intelectual=flag_deficiencia_intelectual,
            preenche_cota=flag_preenche_cota_pcd,
        )

    if empresa_rateio == "S":
        pyautogui.hotkey("ctrl", "enter")
        dormir_controlado(0.2)
        escrever(col_q_numerico)
        pyautogui.press("enter")
        dormir_controlado(0.3)
        pressionar_tab(4)   

    if empresa_rateio == "N":
        pressionar_tab(3)
        dormir_controlado(0.3)

    pyautogui.hotkey("ctrl", "enter")
    dormir_controlado(0.2)

    pyautogui.hotkey("alt", "i")
    dormir_controlado(0.3)

    pyautogui.press("tab")
    dormir_controlado(0.2)

    pyautogui.hotkey("ctrl", "enter")
    dormir_controlado(0.2)
    escrever(col_y_numerico)
    dormir_controlado(0.2)
    pyautogui.press("enter")
    dormir_controlado(0.2)

    pyautogui.press("tab")
    dormir_controlado(0.2)
    selecionar_combo_por_codigo_sem_tab(col_extra_tipo_tributacao_sindical)
    pyautogui.press("enter")
    dormir_controlado(0.25)

    pyautogui.hotkey("alt", "f4")
    dormir_controlado(0.3)
    pyautogui.press("s")
    dormir_controlado(0.3)
    pyautogui.hotkey("alt", "f4")
    dormir_controlado(0.3)

    pressionar_tab(4)

    pyautogui.hotkey("ctrl", "enter")
    dormir_controlado(0.4)
    pyautogui.press("enter")
    dormir_controlado(0.4)

    limpar_e_digitar(col_u, intervalo=0.05)
    dormir_controlado(0.3)
    pyautogui.press("tab")
    dormir_controlado(0.25)
    pyautogui.press("tab")
    dormir_controlado(0.25)
    pyautogui.press("tab")
    dormir_controlado(0.25)
    limpar_e_digitar(col_u, intervalo=0.05)
    dormir_controlado(0.3)
    pyautogui.press("tab")
    dormir_controlado(0.25)

    limpar_e_digitar(col_extra_horas_semanais or "44", intervalo=0.05)
    dormir_controlado(0.4)

    if col_extra_horas_mensais:
        pyautogui.press("tab")
        dormir_controlado(0.25)
        limpar_e_digitar(col_extra_horas_mensais, intervalo=0.05)
        dormir_controlado(0.4)
        pyautogui.press("tab")
        dormir_controlado(0.25)
    else:
        pressionar_tab(2, pausa=0.25)

    selecionar_combo_por_codigo_sem_tab(col_extra_forma_pagamento)
    selecionar_combo_por_codigo_sem_tab(col_extra_tipo_pagamento)

    digitar_lento(col_ab, intervalo=0.04)
    dormir_controlado(0.5)
    pyautogui.press("tab")
    dormir_controlado(0.4)

    selecionar_combo_por_codigo_sem_tab(col_aa_numerico or dados["AA"])
    if col_aa_numerico.startswith("4") or col_aa_numerico.startswith("8"):
        pyautogui.press("tab")
        dormir_controlado(0.4)
    selecionar_combo_por_codigo_sem_tab(col_extra_regime_jornada)

    pyautogui.hotkey("alt", "g")
    dormir_controlado(1.0)

    pyautogui.hotkey("alt", "f4")
    dormir_controlado(0.3)

    pressionar_tab(6)

    limpar_e_digitar(col_extra_experiencia_qtde_dias or "45")
    dormir_controlado(0.2)
    pressionar_enter(2, pausa=0.25)

    limpar_e_digitar(col_extra_experiencia_qtde_dias_prorrogacao or "45")
    dormir_controlado(0.2)
    pressionar_enter(2, pausa=0.25)

    pyautogui.hotkey("ctrl", "a")
    dormir_controlado(0.1)
    pyautogui.press("backspace")
    dormir_controlado(0.1)
    digitar_lento(col_v, intervalo=0.08)
    dormir_controlado(0.2)
    pyautogui.press("enter")
    dormir_controlado(0.4)

    pyautogui.hotkey("ctrl", "a")
    dormir_controlado(0.1)
    pyautogui.press("backspace")
    dormir_controlado(0.1)
    digitar_lento(col_w, intervalo=0.08)
    dormir_controlado(0.2)
    pyautogui.press("enter")
    dormir_controlado(0.4)

    if valor_vazio(col_ag) and valor_vazio(col_ah):
        pressionar_tab(7, pausa=0.15)
    else:
        pyautogui.hotkey("ctrl", "enter")
        dormir_controlado(0.3)
        escrever(col_ag)
        dormir_controlado(0.2)
        pyautogui.press("enter")
        dormir_controlado(0.25)
        pressionar_tab(7, pausa=0.15)

    selecionar_combo_por_codigo_sem_tab(col_dp)

    pyautogui.hotkey("ctrl", "enter")
    dormir_controlado(0.3)

    pyautogui.hotkey("alt", "i")
    dormir_controlado(0.4)
    pyautogui.press("enter")
    dormir_controlado(0.25)

    pyautogui.hotkey("ctrl", "enter")
    dormir_controlado(0.3)

    dormir_controlado(0.5)
    pressionar_tab(9, pausa=0.15)

    limpar_e_digitar(col_extra_cargo_codigo or primeiros_numeros(col_extra_cargo_descricao or col_ac), intervalo=0.05)
    dormir_controlado(0.25)

    pyautogui.hotkey("alt", "p")
    dormir_controlado(0.8)

    duplo_clique_primeiro_item(PRIMEIRO_ITEM_LISTA_X, PRIMEIRO_ITEM_LISTA_Y)

    pyautogui.hotkey("alt", "g")
    dormir_controlado(0.6)

    pyautogui.press("s")
    dormir_controlado(0.3)

    pyautogui.hotkey("alt", "f4")
    dormir_controlado(0.5)

    pyautogui.press("tab")
    dormir_controlado(0.25)

    pyautogui.hotkey("ctrl", "enter")
    dormir_controlado(0.3)

    pressionar_enter(2, pausa=0.25)

    pyautogui.hotkey("ctrl", "enter")
    dormir_controlado(0.3)

    dormir_controlado(0.5)
    pressionar_tab(7, pausa=0.15)

    pyautogui.hotkey("ctrl", "a")
    dormir_controlado(0.1)
    pyautogui.press("backspace")
    dormir_controlado(0.1)
    digitar_lento(col_extra_horario_codigo or primeiros_numeros(col_extra_horario_descricao) or col_af_numerico, intervalo=0.08)
    dormir_controlado(0.25)

    pyautogui.hotkey("alt", "p")
    dormir_controlado(0.8)

    duplo_clique_primeiro_item(PRIMEIRO_ITEM_LISTA_X, PRIMEIRO_ITEM_LISTA_Y)

    pyautogui.hotkey("alt", "g")
    dormir_controlado(0.6)

    pyautogui.hotkey("alt", "s")
    dormir_controlado(0.6)

    pressionar_tab(6, pausa=0.15)

    selecionar_nacionalidade(col_ak)
    selecionar_grau_instrucao(col_al)
    dormir_controlado(0.3)

    pressionar_tab(1)
    selecionar_vinculo_empregaticio(col_do)
    pressionar_tab(1)
    selecionar_codigo_admissao(col_dp)

    pressionar_tab(1)
    digitar_lento(col_u, intervalo=0.08)
    dormir_controlado(0.2)

    pressionar_tab(1)

    pyautogui.hotkey("ctrl", "enter")
    dormir_controlado(0.3)
    pyautogui.hotkey("alt", "i")
    dormir_controlado(0.4)

    digitar_lento(col_u, intervalo=0.08)
    dormir_controlado(0.2)

    pyautogui.press("enter")
    dormir_controlado(0.3)

    selecionar_grau_risco(col_dn)

    pressionar_enter(2, pausa=0.25)

    pyautogui.hotkey("alt", "f4")
    dormir_controlado(0.4)

    pressionar_tab(1, pausa=0.25)
    selecionar_caged(col_dq)
    dormir_controlado(0.35)

    if primeiros_numeros(col_dq) == "25":
        if str(col_extra_percepcao_seguro_desemprego).strip().upper() in {"TRUE", "1", "SIM", "S", "YES", "ON"}:
            pyautogui.press("space")
            dormir_controlado(0.15)
        pyautogui.press("tab")
        dormir_controlado(0.25)

    limpar_e_digitar(col_aq, intervalo=0.05)
    dormir_controlado(0.2)
    pyautogui.press("enter")
    dormir_controlado(0.25)

    limpar_e_digitar(col_ao, intervalo=0.05)
    dormir_controlado(0.25)
    pressionar_enter(2, pausa=0.25)

    limpar_e_digitar(an_parte1, intervalo=0.05)
    dormir_controlado(0.2)
    pyautogui.press("tab")
    dormir_controlado(0.25)

    limpar_e_digitar(an_parte2, intervalo=0.05)
    dormir_controlado(0.2)
    pyautogui.press("tab")
    dormir_controlado(0.25)

    limpar_e_digitar(an_parte3, intervalo=0.05)
    dormir_controlado(0.2)

    pressionar_tab(1)
    if flag_ctps_digital:
        pyautogui.press("space")
        dormir_controlado(0.2)
        pressionar_tab(2)
    else:
        pressionar_tab(1)
        limpar_e_digitar(col_extra_ctps_numero, intervalo=0.05)
        dormir_controlado(0.2)
        pyautogui.press("tab")
        dormir_controlado(0.25)
        limpar_e_digitar(col_extra_ctps_serie, intervalo=0.05)
        dormir_controlado(0.2)
        pyautogui.press("tab")
        dormir_controlado(0.25)
        selecionar_sigla_uf(col_extra_ctps_uf)
        limpar_e_digitar(col_extra_ctps_data_expedicao, intervalo=0.05)
        dormir_controlado(0.2)
        pyautogui.press("tab")
        dormir_controlado(0.25)

    if valor_vazio(col_ar):

        pressionar_tab(7)

    else:

        escrever(col_ar)
        dormir_controlado(0.2)
        pyautogui.press("tab")
        dormir_controlado(0.25)

        escrever(col_as)
        dormir_controlado(0.2)
        pyautogui.press("tab")
        dormir_controlado(0.25)

        selecionar_orgao_emissor(col_au)
        selecionar_sp()
        selecionar_sp()

        escrever(col_at)
        dormir_controlado(0.2)
        pyautogui.press("tab")
        dormir_controlado(0.25)

        escrever(col_av)
        dormir_controlado(0.2)
        pyautogui.press("tab")
        dormir_controlado(0.25)

    if valor_vazio(col_ap):

        pyautogui.hotkey("alt", "g")
        dormir_controlado(0.6)
        pyautogui.hotkey("alt", "s")
        dormir_controlado(0.3)

    else:
        escrever(col_ap)
        dormir_controlado(0.2)
        pyautogui.press("tab")
        dormir_controlado(0.25)

        pyautogui.press("4")
        dormir_controlado(0.2)
        pyautogui.press("enter")
        dormir_controlado(0.3)

        selecionar_sp()
        pyautogui.press("enter")
        dormir_controlado(0.25)

        pyautogui.hotkey("alt", "g")
        dormir_controlado(0.6)
        pyautogui.hotkey("alt", "s")
        dormir_controlado(0.3)

    log(f"Processo da linha {linha_excel} finalizado.")


def selecionar_sigla_uf(valor):
    texto = limpar_texto(valor).strip().upper()
    if not texto:
        pyautogui.press("tab")
        dormir_controlado(0.25)
        return

    sigla = texto[:2]
    verificar_controle()
    pyautogui.hotkey("ctrl", "a")
    dormir_controlado(0.1)
    pyautogui.press("backspace")
    dormir_controlado(0.1)
    digitar_lento(sigla, intervalo=0.05)
    dormir_controlado(0.2)
    pyautogui.press("enter")
    dormir_controlado(0.25)


# =========================
# GUI
# =========================

def selecionar_arquivo_gui():
    caminho = filedialog.askopenfilename(
        title="Selecione a planilha",
        filetypes=[("Planilhas Excel", "*.xlsx *.xls")]
    )
    if caminho:
        entry_planilha.delete(0, tk.END)
        entry_planilha.insert(0, caminho)


def validar_campos():
    arquivo_planilha = entry_planilha.get().strip()
    linha_txt = entry_linha.get().strip()
    habilitada = combo_habilitada.get().strip()
    rateio = combo_rateio.get().strip()

    if not arquivo_planilha:
        messagebox.showerror("Erro", "Selecione a planilha.")
        return None

    if not os.path.exists(arquivo_planilha):
        messagebox.showerror("Erro", "A planilha selecionada não existe.")
        return None

    if not linha_txt.isdigit():
        messagebox.showerror("Erro", "Informe uma linha inicial válida.")
        return None

    linha_inicial = int(linha_txt)
    if linha_inicial < 5:
        messagebox.showerror("Erro", "A linha inicial deve ser 5 ou maior.")
        return None

    if habilitada not in ("S", "N"):
        messagebox.showerror("Erro", "Selecione se a empresa está habilitada.")
        return None

    if rateio not in ("S", "N"):
        messagebox.showerror("Erro", "Selecione se a empresa usa rateio.")
        return None

    return arquivo_planilha, linha_inicial, habilitada, rateio


def executar_processo(arquivo_planilha, linha_inicial, empresa_habilitada, empresa_rateio):
    global PARAR_PROCESSO, PAUSADO, EM_EXECUCAO

    try:
        PARAR_PROCESSO = False
        PAUSADO = False
        EM_EXECUCAO = True
        set_botoes(True)

        root.after(0, root.iconify)
        dormir_controlado(0.5)

        ativar_janela_contmatic()
        linhas = obter_todas_as_linhas_excel(arquivo_planilha, linha_inicial=linha_inicial)

        if not linhas:
            log("Nenhuma linha encontrada para processar.")
            return

        log(f"Total de linhas encontradas: {len(linhas)}")
        configurar_atalhos()
        abrir_rotina_uma_vez()

        for i, dados in enumerate(linhas, start=1):
            verificar_controle()
            log(f"[{i}/{len(linhas)}] Iniciando linha {dados.get('LINHA')}")
            preencher_sistema(dados, empresa_habilitada, empresa_rateio)
            dormir_controlado(1.0)

        log("Processamento concluído.")

    except SystemExit as e:
        log(str(e))
    except Exception as e:
        log(f"Erro: {e}")
        messagebox.showerror("Erro", str(e))
    finally:
        EM_EXECUCAO = False
        set_botoes(False)


def iniciar_processo():
    dados = validar_campos()
    if not dados:
        return

    arquivo_planilha, linha_inicial, empresa_habilitada, empresa_rateio = dados
    threading.Thread(
        target=executar_processo,
        args=(arquivo_planilha, linha_inicial, empresa_habilitada, empresa_rateio),
        daemon=True
    ).start()


def montar_interface():
    global root, entry_planilha, entry_linha, combo_habilitada, combo_rateio
    global btn_iniciar, btn_pausar, btn_parar, txt_log

    root = tk.Tk()
    root.title("Automação")
    root.geometry("760x520")
    root.resizable(False, False)

    frm = ttk.Frame(root, padding=12)
    frm.pack(fill="both", expand=True)

    ttk.Label(frm, text="Planilha:").grid(row=0, column=0, sticky="w", pady=5)
    entry_planilha = ttk.Entry(frm, width=70)
    entry_planilha.grid(row=0, column=1, sticky="we", pady=5)
    ttk.Button(frm, text="Selecionar", command=selecionar_arquivo_gui).grid(row=0, column=2, padx=8, pady=5)

    ttk.Label(frm, text="Linha inicial:").grid(row=1, column=0, sticky="w", pady=5)
    entry_linha = ttk.Entry(frm, width=12)
    entry_linha.insert(0, "5")
    entry_linha.grid(row=1, column=1, sticky="w", pady=5)

    ttk.Label(frm, text="Empresa habilitada no eSocial:").grid(row=2, column=0, sticky="w", pady=5)
    combo_habilitada = ttk.Combobox(frm, values=["S", "N"], width=10, state="readonly")
    combo_habilitada.set("S")
    combo_habilitada.grid(row=2, column=1, sticky="w", pady=5)

    ttk.Label(frm, text="Processa folha por rateio:").grid(row=3, column=0, sticky="w", pady=5)
    combo_rateio = ttk.Combobox(frm, values=["S", "N"], width=10, state="readonly")
    combo_rateio.set("N")
    combo_rateio.grid(row=3, column=1, sticky="w", pady=5)

    lbl_info = ttk.Label(
        frm,
        text="Atalhos: F8 = Pausar/Continuar | F9 = Interromper",
        foreground="blue"
    )
    lbl_info.grid(row=4, column=0, columnspan=3, sticky="w", pady=(8, 10))

    botoes = ttk.Frame(frm)
    botoes.grid(row=5, column=0, columnspan=3, sticky="w", pady=(0, 10))

    btn_iniciar = ttk.Button(botoes, text="Iniciar", command=iniciar_processo)
    btn_iniciar.pack(side="left", padx=(0, 8))

    btn_pausar = ttk.Button(botoes, text="Pausar", command=alternar_pausa, state="disabled")
    btn_pausar.pack(side="left", padx=(0, 8))

    btn_parar = ttk.Button(botoes, text="Interromper", command=parar_processo, state="disabled")
    btn_parar.pack(side="left")

    ttk.Label(frm, text="Log:").grid(row=6, column=0, sticky="w", pady=(8, 5))
    txt_log = scrolledtext.ScrolledText(frm, width=90, height=22, wrap="word")
    txt_log.grid(row=7, column=0, columnspan=3, sticky="nsew")

    frm.columnconfigure(1, weight=1)

    root.mainloop()


if __name__ == "__main__":
    montar_interface()
