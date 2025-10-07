
# GGets Aurora installer — imports VBA modules and saves as .xlsm
# Requirements: Excel for Windows; "Trust access to the VBA project object model" enabled.

param(
  [string]$Xlsx = "SPP_v03.xlsx"
)

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$src  = Join-Path $here $Xlsx
if (!(Test-Path $src)) { Write-Error "Source workbook not found: $src"; exit 1 }

$xlsm = [System.IO.Path]::ChangeExtension($src, "xlsm").Replace(".xlsm", "_GGets.xlsm")

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

try {
  $wb = $excel.Workbooks.Open($src)
  $wb.SaveAs($xlsm, 52)  # 52 = xlOpenXMLWorkbookMacroEnabled

  # Import modules
  $vbproj = $wb.VBProject
  function Import-Mod($path){
    $null = $vbproj.VBComponents.Import($path)
  }
  Import-Mod (Join-Path $here "modHttp_GGets.bas")
  Import-Mod (Join-Path $here "modUI_GGets_Aurora.bas")
  Import-Mod (Join-Path $here "modBrand_GGets.bas")
  Import-Mod (Join-Path $here "GGets_Refresh.bas")

  # Drop logo + UI
  $excel.Run("modUI_GGets_Aurora.EnsureGGetsUI")
  $excel.Run("modBrand_GGets.InstallGGetsBranding")

  $wb.Save()
  $wb.Close($true)
  Write-Output "Installed → $xlsm"
}
finally {
  $excel.Quit()
}
