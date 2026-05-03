# Empacotamento do Runner Phoenix

## Arquivos usados
- `phoenix_queue_runner_gui.py`
- `cadastros_final_adaptado.py`
- `licenca_app.py`
- `PalSys.ico`
- `PalSys.png`
- `whatsapp.png`
- `phoenix_runner.spec`
- `build_runner_exe.bat`

## Como gerar o `.exe`
1. Abra a pasta `automacao-phoenix`.
2. Dê duplo clique em `build_runner_exe.bat`.
3. Aguarde a instalação das dependências e a geração do pacote.

## Resultado esperado
O executável será criado em:

```text
automacao-phoenix\dist\PalSysRunnerPhoenix.exe
```

## Observações
- A licença será salva ao lado do executável, em `licenca.key`.
- As configurações do runner serão salvas ao lado do executável, em `phoenix_queue_runner_settings.json`.
- O runner empacotado continua usando o `cadastros_final_adaptado.py` que vai junto no pacote.
- Se o Windows Defender ou antivírus bloquear a primeira geração, execute o `.bat` como administrador.
