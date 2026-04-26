import argparse
import json
import sys
from pathlib import Path

from pywinauto import Desktop


def safe_text(value):
    if value is None:
        return ""
    return str(value)


def collect_children(wrapper, depth, max_depth, results):
    if depth > max_depth:
        return

    try:
        children = wrapper.children()
    except Exception:
        children = []

    for child in children:
        try:
            rect = child.rectangle()
            entry = {
                "depth": depth,
                "control_type": safe_text(getattr(child.element_info, "control_type", "")),
                "class_name": safe_text(getattr(child.element_info, "class_name", "")),
                "name": safe_text(getattr(child.element_info, "name", "")),
                "automation_id": safe_text(getattr(child.element_info, "automation_id", "")),
                "left": rect.left,
                "top": rect.top,
                "right": rect.right,
                "bottom": rect.bottom,
            }
        except Exception as error:
            entry = {
                "depth": depth,
                "control_type": "",
                "class_name": "",
                "name": f"<erro: {error}>",
                "automation_id": "",
                "left": 0,
                "top": 0,
                "right": 0,
                "bottom": 0,
            }

        results.append(entry)
        collect_children(child, depth + 1, max_depth, results)


def main():
    parser = argparse.ArgumentParser(
        description="Inspeciona a arvore de controles do Phoenix via UI Automation/Win32."
    )
    parser.add_argument(
        "--window-title",
        default="contmatic",
        help="Trecho do titulo da janela. Ex.: contmatic, cadastro de funcionarios, pesquisar funcionarios",
    )
    parser.add_argument(
        "--backend",
        default="uia",
        choices=["uia", "win32"],
        help="Backend do pywinauto a testar",
    )
    parser.add_argument("--max-depth", type=int, default=4)
    parser.add_argument("--output", default="phoenix-uia-snapshot.json")
    parser.add_argument(
        "--list-windows",
        action="store_true",
        help="Lista as janelas visiveis encontradas no backend e encerra",
    )
    args = parser.parse_args()

    desktop = Desktop(backend=args.backend)
    windows = desktop.windows()
    visible_titles = []

    for window in windows:
        try:
            title = window.window_text()
        except Exception:
            title = ""

        title = title.strip()
        if title:
            visible_titles.append(title)

    if args.list_windows:
        print(f"Backend: {args.backend}")
        for title in sorted(set(visible_titles)):
            print(title)
        return

    matches = []

    for window in windows:
        try:
            title = window.window_text()
        except Exception:
            title = ""

        if args.window_title.lower() in title.lower():
            matches.append(window)

    if not matches:
        raise RuntimeError(
            "Nenhuma janela encontrada contendo "
            f"'{args.window_title}' no backend {args.backend}. "
            "Use --list-windows para ver os titulos disponiveis."
        )

    target = matches[0]
    target.set_focus()

    rect = target.rectangle()
    snapshot = {
        "backend": args.backend,
        "window_title": target.window_text(),
        "window_rect": {
            "left": rect.left,
            "top": rect.top,
            "right": rect.right,
            "bottom": rect.bottom,
        },
        "controls": [],
    }

    collect_children(target, 1, args.max_depth, snapshot["controls"])

    output_path = Path(args.output)
    output_path.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Janela: {snapshot['window_title']}")
    print(f"Backend: {args.backend}")
    print(f"Controles coletados: {len(snapshot['controls'])}")
    print(f"Arquivo gerado: {output_path}")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Erro: {error}", file=sys.stderr)
        sys.exit(1)
