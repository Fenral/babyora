# Bevis at WidgetBridge-pluginet faktisk BLIR REGISTRERT i den bygde appen.
#
# Bakgrunn (2026-08-07): build 83 hadde all koden inne og var likevel usynlig
# for JS-en, fordi Capacitor 8 kun registrerer klassene i packageClassList.
# tools/ipa-bevis.ps1 sjekker at widgeten er embeddet og signert riktig;
# denne sjekker det andre leddet — at registreringen finnes i artefakten.
#
# Avslutter med kode 1 hvis en påstand mangler dekning.
param([Parameter(Mandatory=$true)][string]$Ipa)

Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead($Ipa)
$feil = 0

function Sjekk($tittel, $ok, $detalj) {
  $merke = if ($ok) { "OK  " } else { "FEIL" }
  $linje = "$merke $tittel"
  if ($detalj) { $linje = "$linje - $detalj" }
  Write-Output $linje
  if (-not $ok) { $script:feil++ }
}

function Bytes($navn) {
  $e = $zip.Entries | Where-Object { $_.FullName -eq $navn }
  if (-not $e) { return $null }
  $s = $e.Open(); $ms = New-Object System.IO.MemoryStream; $s.CopyTo($ms); $s.Close()
  return $ms.ToArray()
}
function Har($bytes, $needle) {
  if ($null -eq $bytes) { return $false }
  return [System.Text.Encoding]::ASCII.GetString($bytes).Contains($needle)
}

$bin = Bytes "Payload/App.app/App"
Sjekk "appbinaeren finnes" ($null -ne $bin) $null
Sjekk "BabyoraViewController er kompilert inn" (Har $bin "BabyoraViewController") $null
Sjekk "registerPluginInstance kalles fra appkoden" (Har $bin "registerPluginInstance") $null
Sjekk "WidgetBridgePlugin er kompilert inn" (Har $bin "WidgetBridgePlugin") $null

# Storyboardet kompileres til .storyboardc, men klassenavnet overlever som
# streng. Peker den fortsatt paa Capacitors egen klasse, kjoeres aldri
# registreringen - og appen ville sett helt riktig ut i koden.
$sbFiler = $zip.Entries | Where-Object { $_.FullName -like "Payload/App.app/Base.lproj/Main.storyboardc/*" }
Sjekk "kompilert storyboard finnes i bundlen" ($sbFiler.Count -gt 0) "$($sbFiler.Count) fil(er)"
$treff = $false
foreach ($e in $sbFiler) {
  $b = Bytes $e.FullName
  if (Har $b "BabyoraViewController") { $treff = $true; break }
}
Sjekk "storyboardet i bundlen peker paa BabyoraViewController" $treff $null

# Mutasjonsledd: en oppdiktet klasse skal IKKE finnes, ellers maaler
# soekemetoden over ingenting.
Sjekk "mutasjonsbevis: oppdiktet klasse finnes ikke" (-not (Har $bin "IkkeEksisterendeViewController")) $null

$zip.Dispose()
Write-Output ""
if ($feil -gt 0) { Write-Output "$feil paastand(er) uten dekning."; exit 1 }
Write-Output "Broen er registrert i artefakten."
