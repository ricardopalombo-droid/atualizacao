import os
import sys
import json
import socket
import hashlib
import threading
import time
from datetime import datetime
import requests
import base64
import json
from nacl.signing import VerifyKey
from nacl.exceptions import BadSignatureError
from tkinter import messagebox, simpledialog

PUBLIC_KEY_BASE64 = "JAn31pQQ1NCc8bHIP6njlGOluKrcz73b1PWepRrfesQ="


class LicenseClient:
    def __init__(self, server_url: str, license_key: str, cache_file: str = "license_cache.json"):
        self.server_url = server_url.rstrip("/")
        self.license_key = license_key
        self.cache_file = cache_file
        self.session_token = None
        self.heartbeat_seconds = 120

    def get_machine_id(self) -> str:
        base = socket.gethostname()
        return hashlib.sha256(base.encode("utf-8")).hexdigest()

    def get_machine_name(self) -> str:
        return socket.gethostname()

    def save_cache(self, payload: dict, signature: str):
        data = {
            "payload": payload,
            "signature": signature
        }
        with open(self.cache_file, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)


    def load_cache(self):
        if not os.path.exists(self.cache_file):
            return None
        with open(self.cache_file, "r", encoding="utf-8") as f:
            return json.load(f)

    def activate(self) -> tuple[bool, str]:
        payload_envio = {
            "license_key": self.license_key,
            "machine_id": self.get_machine_id(),
            "machine_name": self.get_machine_name()
        }

        try:
            resp = requests.post(
                f"{self.server_url}/client/activate",
                json=payload_envio,
                timeout=10
            )

            if resp.status_code != 200:
                try:
                    erro = resp.json().get("detail", resp.text)
                except Exception:
                    erro = resp.text
                return False, erro

            data = resp.json()

            payload = data.get("payload")
            signature = data.get("signature")

            if not payload or not signature:
                return False, "Resposta do servidor em formato inválido"

            if not verify_signature(payload, signature):
                return False, "Assinatura do cache de licença inválida"

            if payload.get("license_key") != self.license_key:
                return False, "Licença do cache não confere"

            if payload.get("machine_id") != self.get_machine_id():
                return False, "Cache de licença pertence a outra máquina"

            self.session_token = payload["session_token"]
            self.customer_name = payload.get("customer_name", "")
            self.heartbeat_seconds = int(payload.get("heartbeat_seconds", 120))
            self.save_cache(payload, signature)

            return True, "Licença validada com sucesso"

        except Exception:
            cache = self.load_cache()
            if not cache:
                return False, "Sem conexão com o servidor e sem cache local"

            payload = cache.get("payload")
            signature = cache.get("signature")

            if not payload or not signature:
                return False, "Cache local inválido"

            if not verify_signature(payload, signature):
                return False, "Cache local adulterado"

            if payload.get("license_key") != self.license_key:
                return False, "Cache local não pertence a esta licença"

            if payload.get("machine_id") != self.get_machine_id():
                return False, "Cache local não pertence a esta máquina"

            offline_until = datetime.fromisoformat(payload["offline_until"])
            if datetime.utcnow() <= offline_until:
                self.session_token = payload.get("session_token")
                self.heartbeat_seconds = int(payload.get("heartbeat_seconds", 120))
                return True, f"Modo offline liberado até {offline_until.strftime('%d/%m/%Y %H:%M')}"

            return False, "Prazo de tolerância offline expirado"


    def heartbeat(self):
        if not self.session_token:
            return
        try:
            requests.post(
                f"{self.server_url}/client/heartbeat",
                json={"session_token": self.session_token},
                timeout=10
            )
        except Exception:
            pass

    def release(self):
        if not self.session_token:
            return
        try:
            requests.post(
                f"{self.server_url}/client/release",
                json={"session_token": self.session_token},
                timeout=10
            )
        except Exception:
            pass


def carregar_licenca_arquivo(arquivo_licenca: str) -> str:
    if os.path.exists(arquivo_licenca):
        with open(arquivo_licenca, "r", encoding="utf-8") as f:
            return f.read().strip()
    return ""


def salvar_licenca_arquivo(arquivo_licenca: str, license_key: str):
    with open(arquivo_licenca, "w", encoding="utf-8") as f:
        f.write(license_key.strip())


def pedir_chave_se_necessario(arquivo_licenca: str, parent=None) -> str:
    chave = carregar_licenca_arquivo(arquivo_licenca)
    if chave:
        return chave

    chave = simpledialog.askstring("Licença", "Digite a chave de licença:", parent=parent)

    if not chave:
        return ""

    salvar_licenca_arquivo(arquivo_licenca, chave)
    return chave.strip()


def iniciar_protecao_licenca(server_url: str, arquivo_licenca: str = "licenca.key", parent=None):
    chave = pedir_chave_se_necessario(arquivo_licenca, parent=parent)

    if not chave:
        messagebox.showerror("Licença", "Nenhuma chave de licença foi informada.", parent=parent)
        sys.exit(1)

    client = LicenseClient(server_url=server_url, license_key=chave)

    ok, msg = client.activate()
    if not ok:
        messagebox.showerror("Licença", msg, parent=parent)
        sys.exit(1)

    def heartbeat_loop():
        while True:
            try:
                client.heartbeat()
            except Exception:
                pass
            time.sleep(client.heartbeat_seconds)

    thread = threading.Thread(target=heartbeat_loop, daemon=True)
    thread.start()

    return client, None

def serialize_payload(payload: dict) -> bytes:
    return json.dumps(
        payload,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":")
    ).encode("utf-8")


def verify_signature(payload: dict, signature_b64: str) -> bool:
    try:
        verify_key = VerifyKey(base64.b64decode(PUBLIC_KEY_BASE64))
        payload_bytes = serialize_payload(payload)
        signature = base64.b64decode(signature_b64)
        verify_key.verify(payload_bytes, signature)
        return True
    except BadSignatureError:
        return False
    except Exception:
        return False

