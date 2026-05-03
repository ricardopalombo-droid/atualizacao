[Setup]
AppId={{9F70C2C7-6A8D-4B27-90D3-0E8A32E7E91E}
AppName=PalSys Runner Phoenix
AppVersion=1.0.0
AppPublisher=PalSys
AppPublisherURL=https://www.palsys.com.br
AppSupportURL=https://www.palsys.com.br
AppUpdatesURL=https://www.palsys.com.br
DefaultDirName={autopf}\PalSys\Runner Phoenix
DefaultGroupName=PalSys\Runner Phoenix
DisableProgramGroupPage=yes
PrivilegesRequired=admin
ArchitecturesAllowed=x86 x64
ArchitecturesInstallIn64BitMode=x64
OutputDir=installer
OutputBaseFilename=PalSysRunnerPhoenix-Setup
SetupIconFile=PalSys.ico
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
UninstallDisplayIcon={app}\PalSysRunnerPhoenix.exe

[Languages]
Name: "brazilianportuguese"; MessagesFile: "compiler:Languages\BrazilianPortuguese.isl"

[Tasks]
Name: "desktopicon"; Description: "Criar atalho na área de trabalho"; GroupDescription: "Opções adicionais:"; Flags: unchecked

[Files]
Source: "dist\PalSysRunnerPhoenix.exe"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\PalSys Runner Phoenix"; Filename: "{app}\PalSysRunnerPhoenix.exe"
Name: "{autodesktop}\PalSys Runner Phoenix"; Filename: "{app}\PalSysRunnerPhoenix.exe"; Tasks: desktopicon

[Run]
Filename: "{app}\PalSysRunnerPhoenix.exe"; Description: "Abrir PalSys Runner Phoenix"; Flags: nowait postinstall skipifsilent
