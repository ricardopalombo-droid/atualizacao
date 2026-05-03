# -*- mode: python ; coding: utf-8 -*-

from pathlib import Path

from PyInstaller.utils.hooks import collect_submodules


BASE_DIR = Path.cwd()

datas = [
    (str(BASE_DIR / "PalSys.png"), "."),
    (str(BASE_DIR / "PalSys.ico"), "."),
    (str(BASE_DIR / "whatsapp.png"), "."),
    (str(BASE_DIR / "cadastros_final_adaptado.py"), "."),
]

matricula_label = BASE_DIR / "matricula_esocial_label.png"
if matricula_label.exists():
    datas.append((str(matricula_label), "."))

hiddenimports = (
    collect_submodules("pynput")
    + [
        "win32com",
        "win32com.client",
        "pythoncom",
        "pywintypes",
        "pyautogui",
        "pygetwindow",
        "pyperclip",
        "tkinter",
        "tkinter.ttk",
        "tkinter.messagebox",
        "tkinter.simpledialog",
    ]
)


a = Analysis(
    ["phoenix_queue_runner_gui.py"],
    pathex=[str(BASE_DIR)],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name="PalSysRunnerPhoenix",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=str(BASE_DIR / "PalSys.ico"),
)
