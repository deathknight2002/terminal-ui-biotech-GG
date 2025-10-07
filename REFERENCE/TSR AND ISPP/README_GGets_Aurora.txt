GGets Aurora — Excel Macro Pack (Biopharma-leaning)
===================================================

What this is
------------
A polished backup to pull Yahoo Finance history + light quote metrics,
normalize FX to USD, index ISPP, and provide a glassy UI overlay branded as **GGets Aurora**.
Includes a base64-embedded **GG** logo; once added, it lives inside the workbook.

Files
-----
- **GGets_Refresh.bas** – main macro (entrypoint: `GGets_Refresh`)
- **modHttp_GGets.bas** – robust HTTP with retries/backoff
- **modUI_GGets_Aurora.bas** – glass button + loading overlay (aurora theme)
- **modBrand_GGets.bas** – writes embedded logo to temp & inserts it; also applies theme
- **GG.png** – logo file (optional at runtime; embedded fallback exists)
- **install_ggets.ps1** – one-click Windows installer (imports modules, saves as .xlsm)
- **SPP_v03.xlsx** – your workbook (source); the installer will save an .xlsm copy

Quick Install (Windows, PowerShell)
-----------------------------------
1. Right-click the ZIP → **Extract All**.
2. Right-click **install_ggets.ps1** → Run with PowerShell. (If blocked, open PowerShell as Admin and run: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`)
3. The script will:
   - create `SPP_v03_GGets.xlsm` next to the source workbook,
   - import all `.bas` modules,
   - call `EnsureGGetsUI` + `InstallGGetsBranding` (adds button + logo),
   - save and close.

Manual Install (any OS)
-----------------------
1. Open **SPP_v03.xlsx** and Save As **.xlsm**.
2. `Alt+F11` → `File > Import File…`:
   - import `modHttp_GGets.bas`
   - import `modUI_GGets_Aurora.bas`
   - import `modBrand_GGets.bas`
   - import `GGets_Refresh.bas`
3. In Excel, open the **Control** sheet:
   - run `EnsureGGetsUI` (adds the GGets Refresh button)
   - run `InstallGGetsBranding` (inserts the GG logo; uses embedded fallback)
4. Click **GGets Refresh** to run the macro (`GGets_Refresh`).

Notes
-----
- Theme matches the **eclipse/aurora** palette in your terminal demo.
- If Excel asks for macro permissions or VBIDE access, allow them for the installer to import modules.
- Yahoo rate-limits sometimes; the HTTP module backs off and logs to a *Log* sheet.
- Base currency = USD by default; easy to generalize later.