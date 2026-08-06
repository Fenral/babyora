# Ærlighetsvakt for TestFlight-artefakten: leser DEN FAKTISKE IPA-en og
# avslutter med kode 1 hvis noe protokollen skal bevise mangler.
# Grønt på fravær teller ikke — hver påstand har en fasit i fila.
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

function Tekst($navn) {
  $e = $zip.Entries | Where-Object { $_.FullName -eq $navn }
  if (-not $e) { return $null }
  $s = $e.Open()
  $ms = New-Object System.IO.MemoryStream
  $s.CopyTo($ms)
  $s.Close()
  return [System.Text.Encoding]::GetEncoding("latin1").GetString($ms.ToArray())
}

$APPEX = "Payload/App.app/PlugIns/BabyoraWidgetExtension.appex/"

$binaer = $zip.Entries | Where-Object { $_.FullName -eq ($APPEX + "BabyoraWidgetExtension") }
Sjekk "widget-utvidelsen er embeddet med egen binaer" ($null -ne $binaer) $null

$wp = Tekst ($APPEX + "embedded.mobileprovision")
if ($null -eq $wp) {
  Sjekk "widgetens provisioning-profil finnes" $false $null
} else {
  Sjekk "widget-profil: app-gruppe group.no.klemeg.app" ($wp -like "*group.no.klemeg.app*") $null
  Sjekk "widget-profil: bundle-id no.klemeg.app.widget" ($wp -like "*no.klemeg.app.widget*") $null
}

$ap = Tekst "Payload/App.app/embedded.mobileprovision"
if ($null -eq $ap) {
  Sjekk "appens provisioning-profil finnes" $false $null
} else {
  Sjekk "app-profil: app-gruppe group.no.klemeg.app" ($ap -like "*group.no.klemeg.app*") $null
}

$ip = Tekst "Payload/App.app/Info.plist"
if ($null -eq $ip) {
  Sjekk "appens Info.plist finnes" $false $null
} else {
  Sjekk "deep link: babyora-scheme registrert i Info.plist" ($ip -like "*babyora*") $null
}

# Mutasjonsbevis: en oppdiktet fil SKAL ikke finnes. Hvis denne "bestaar"
# uansett hva vi ser etter, maaler testen ingenting.
$falsk = $zip.Entries | Where-Object { $_.FullName -like "*IkkeEksisterendeWidget.appex*" }
Sjekk "mutasjonsbevis: oppdiktet fil finnes ikke" ($null -eq $falsk) $null

Write-Output ""
Write-Output "$($zip.Entries.Count) filer i IPA-en."
$zip.Dispose()

if ($feil -gt 0) {
  Write-Output "$feil paastand(er) uten dekning - artefakten er IKKE verifisert."
  exit 1
}
Write-Output "Alle paastander har dekning i den faktiske IPA-en."
