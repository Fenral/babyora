const params = new URLSearchParams(location.search);

const ARMS = {
  k0: { short: "K0", name: "Dagens kontroll", hypothesis: "Maskot + direkte spørsmål" },
  k1: { short: "K1", name: "Situasjonen først", hypothesis: "Autentisk foto" },
  k2: { short: "K2", name: "Rådet blir til", hypothesis: "Motion-storyboard" },
  k3: { short: "K3", name: "Svaret først", hypothesis: "Native no-photo" },
};

const FRAMES = [
  "Første spørsmål",
  "Alder",
  "Sted og tillit",
  "Kontroll",
  "Velkomst",
  "Hjem / handling",
  "Første råd",
];

const state = {
  arm: ARMS[params.get("arm")] ? params.get("arm") : "k0",
  frame: Math.max(0, Math.min(FRAMES.length - 1, Number(params.get("frame") || 1) - 1)),
  theme: params.get("theme") === "light" ? "light" : "dark",
  scenario: ["normal", "offline", "slow", "error"].includes(params.get("state")) ? params.get("state") : "normal",
  text: params.get("text") === "large" ? "large" : "normal",
  motion: params.get("motion") === "reduce" ? "reduce" : "full",
  compare: params.get("compare") === "1",
  participant: params.get("mode") === "participant",
  name: params.get("name") ?? "",
};

if (params.get("resume") === "warm" && !params.has("frame")) {
  state.frame = Number(sessionStorage.getItem(`babyora-bakeoff-${state.arm}`) || 0);
}

const stage = document.querySelector("#stage");
const armSelect = document.querySelector("#arm-select");
const frameSelect = document.querySelector("#frame-select");
const themeSelect = document.querySelector("#theme-select");
const scenarioSelect = document.querySelector("#scenario-select");
const textSelect = document.querySelector("#text-select");
const motionSelect = document.querySelector("#motion-select");

document.body.classList.toggle("participant", state.participant);

for (const [key, arm] of Object.entries(ARMS)) {
  armSelect.add(new Option(`${arm.short} · ${arm.name}`, key));
}
FRAMES.forEach((frame, index) => frameSelect.add(new Option(`${index + 1} · ${frame}`, String(index))));

armSelect.value = state.arm;
frameSelect.value = String(state.frame);
themeSelect.value = state.theme;
scenarioSelect.value = state.scenario;
textSelect.value = state.text;
motionSelect.value = state.motion;

function hero(arm, scenario) {
  if (arm === "k0") {
    return `<div class="hero hero--k0" aria-label="Babyoras stiliserte maskot står og smiler">
      <img src="../../../public/monter/maskot-staaende-cut-360.webp" alt="" />
    </div>`;
  }

  if (arm === "k1") {
    if (scenario === "offline") {
      return `<div class="hero hero--photo"><div class="offline-poster" role="img" aria-label="Foto er utilgjengelig. Teksten forklarer fortsatt Babyoras oppgave.">
        <span><strong>Fra inne til ute.</strong><br />Vi gjør vær, alder og situasjon om til lag.</span>
      </div></div>`;
    }
    return `<figure class="hero hero--photo">
      <img src="./assets/k1-authentic-photo-pexels-11369315.jpg" alt="En forelder knepper en lys body på en baby hjemme. Bildet viser en hverdagssituasjon, ikke det anbefalte antrekket." />
      <figcaption class="photo-caption">En kjent start på dagen · ikke et antrekksråd</figcaption>
    </figure>`;
  }

  if (arm === "k2") {
    return `<div class="hero hero--motion" role="img" aria-label="Fire grader, ti måneder og trilletur blir til tre synlige kleslag. Bevegelsen forklarer sammenhengen.">
      <div class="signal-row" aria-hidden="true">
        <div class="signal"><strong>4°</strong>vær</div>
        <div class="signal"><strong>10</strong>måneder</div>
        <div class="signal"><strong>Vogn</strong>rolig</div>
      </div>
      <div class="process-line" aria-hidden="true"><span class="process-dot"></span></div>
      <div class="layer-stack" aria-hidden="true">
        <div class="layer">1 · Ull innerst</div>
        <div class="layer">2 · Fleece i midten</div>
        <div class="layer">3 · Vindtett ytterst</div>
      </div>
      <p class="demo-caption">Vær + alder + situasjon → lag i riktig rekkefølge</p>
    </div>`;
  }

  return `<div class="hero hero--native" aria-label="Eksempel på Babyoras lagvise råd for fire grader, ti måneder og trilletur.">
    <div class="native-weather"><div><strong>4°</strong><br /><span>Oslo · føles som 1°</span></div><span>10 mnd · vogn</span></div>
    <div class="native-list">
      <div><b>1</b> Ullbody og strømpebukse</div>
      <div><b>2</b> Tynn fleecedress</div>
      <div><b>3</b> Vindtett dress</div>
    </div>
    <p class="demo-caption">Slik ser et råd ut: innerst → ytterst</p>
  </div>`;
}

function frameContent(arm, frame, scenario, name) {
  const displayName = name.trim() || "babyen";
  if (frame === 0) {
    return {
      title: "Hvem kler vi på?",
      supporting: arm === "k0" ? "Vi bruker navnet for å gjøre rådene litt mer personlige." : "Se hva du får, og gjør så rådet personlig.",
      body: `${hero(arm, scenario)}
        <label class="field">Barnets navn
          <input id="baby-name" autocomplete="off" placeholder="Valgfritt" value="${escapeHtml(name)}" />
          <span class="hint">Du kan endre dette senere.</span>
        </label>`,
      cta: "Fortsett",
    };
  }
  if (frame === 1) {
    return {
      title: `Hvor gammel er ${displayName}?`,
      supporting: "Alder påvirker hvor mye isolasjon og bevegelsesrom vi anbefaler.",
      body: `<label class="field">Alder
        <select aria-label="Barnets alder"><option>10 måneder</option><option>9 måneder</option><option>11 måneder</option></select>
        <span class="hint">Denne testvarianten er avgrenset til 0–24 måneder.</span>
      </label>`,
      cta: "Fortsett",
    };
  }
  if (frame === 2) {
    return {
      title: "Hvor er hjemme?",
      supporting: "Vi bruker stedet til å hente været der dere faktisk skal kle på.",
      body: `<div class="permission-card">
        <p class="eyebrow">Hvorfor vi spør</p>
        <p><strong>Oslo nå: 4°, føles som 1°.</strong></p>
        <p class="supporting">Stedet lagres på profilen. Du kan skrive det inn uten posisjonstilgang.</p>
      </div>
      <label class="field">Hjemsted<input aria-label="Hjemsted" value="Oslo" /></label>
      ${scenario === "error" ? `<p class="error" role="alert">Vi fikk ikke hentet forslag. Skriv hele stedsnavnet og fortsett manuelt.</p>` : ""}`,
      cta: "Fortsett",
    };
  }
  if (frame === 3) {
    const k0Blocked = arm === "k0" && !name.trim();
    return {
      title: "Ser dette riktig ut?",
      supporting: "Dette bruker Babyora når det første rådet lages.",
      body: `<div class="summary-card">
        <div class="summary-row"><span>Navn</span><strong>${arm === "k0" && !name.trim() ? "Mangler" : displayName}</strong></div>
        <div class="summary-row"><span>Alder</span><strong>10 måneder</strong></div>
        <div class="summary-row"><span>Hjemme</span><strong>Oslo</strong></div>
      </div>
      ${k0Blocked ? `<p class="error" role="alert">Kontrollen stopper her selv om navnet ble kalt valgfritt.</p>` : ""}
      <p class="disclaimer">Babyora gir veiledning, ikke medisinske råd. Kjenn etter i nakken og tilpass barnet.</p>`,
      cta: "Lag første antrekk",
      disabled: k0Blocked,
    };
  }
  if (frame === 4) {
    return {
      title: arm === "k0" ? "Dagens råd er klart" : "Alt er klart for første råd",
      supporting: arm === "k0" ? "Vi har gjort Babyora klar for dere." : "Nå bruker vi været i Oslo, 10 måneder og dagens situasjon.",
      body: `${arm === "k0" ? hero("k0", scenario) : `<div class="summary-card"><p class="eyebrow">Det du får</p><p><strong>En lagvis liste i riktig rekkefølge</strong></p><p class="supporting">Med varme-/kuldesignaler og begrunnelse.</p></div>`}`,
      cta: "Vis dagens antrekk",
    };
  }
  if (frame === 5) {
    return {
      title: `God morgen, ${displayName}`,
      supporting: "Oslo · fredag 7. august",
      body: `<div class="weather-line"><strong>4°</strong><span>føles som 1°<br />lett vind</span></div>
        <div class="summary-card"><p class="eyebrow">Situasjon</p><p><strong>Trilletur · rolig aktivitet</strong></p><p class="supporting">Velg en annen situasjon på Hjem når dagen endrer seg.</p></div>`,
      cta: "Finn dagens antrekk",
    };
  }
  return {
    title: "Dagens lag",
    supporting: `${displayName} · 10 måneder · trilletur i Oslo`,
    body: `<div class="result-card">
      <div class="weather-line"><strong>4°</strong><span>føles som 1°<br />lett vind</span></div>
      <p class="eyebrow">Innerst → ytterst</p>
      <ol class="garment-list">
        <li><b>1</b> Ullbody</li><li><b>2</b> Ullstrømpebukse</li><li><b>3</b> Tynn fleecedress</li>
        <li><b>4</b> Vindtett dress</li><li><b>5</b> Ullsokker</li><li><b>6</b> Tynn ullue</li>
      </ol>
      <p class="disclaimer">Kjenn etter i nakken etter 10–15 minutter. Juster ett lag av gangen.</p>
    </div>`,
      cta: "Ferdig",
    };
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
}

function renderDevice(armKey, options = {}) {
  const arm = ARMS[armKey];
  const content = frameContent(armKey, state.frame, state.scenario, state.name);
  const note = state.scenario === "slow" ? `<p class="state-note">Media laster tregt · CTA er fortsatt tilgjengelig</p>` :
    state.scenario === "offline" ? `<p class="state-note">Offline-test · meningen skal stå uten media</p>` : "";
  return `<div class="device-wrap">
    ${options.label ? `<div class="candidate-label"><strong>${arm.short}</strong> · ${arm.name}</div>` : ""}
    <section class="device ${state.scenario === "slow" ? "is-slow" : ""}" data-arm="${armKey}" data-theme="${state.theme}" data-text="${state.text}" data-motion="${state.motion}" aria-label="Babyora ${arm.short}: ${arm.name}">
      <div class="island" aria-hidden="true"></div>
      <div class="phone">
        <div class="statusbar"><span>9:41</span><span class="status-icons" aria-hidden="true"><i></i><i></i><i></i></span></div>
        <div class="phone__content">
          <div class="topline">
            ${state.frame > 0 ? `<button class="back" data-action="back" aria-label="Gå tilbake">‹</button>` : `<span class="brand">Babyora</span>`}
            <span class="progress">${Math.min(state.frame + 1, 4)} av 4</span>
          </div>
          <p class="eyebrow">${state.frame < 4 ? "Første antrekk" : "Babyora"}</p>
          <h1>${content.title}</h1>
          <p class="supporting">${content.supporting}</p>
          ${content.body}
        </div>
        <div>${note}<div class="phone__actions">
          <button class="primary" data-action="next" ${content.disabled ? "disabled" : ""}>${content.cta}</button>
        </div></div>
      </div>
    </section>
  </div>`;
}

function render() {
  stage.classList.toggle("stage--compare", state.compare);
  stage.innerHTML = state.compare
    ? Object.keys(ARMS).map(arm => renderDevice(arm, { label: true })).join("")
    : renderDevice(state.arm);
  frameSelect.value = String(state.frame);
  sessionStorage.setItem(`babyora-bakeoff-${state.arm}`, String(state.frame));
  bindPhone();
  window.__babyoraBakeoff = { ...state, ready: true };
}

function bindPhone() {
  document.querySelectorAll("#baby-name").forEach(input => {
    input.addEventListener("input", event => {
      state.name = event.target.value;
      sessionStorage.setItem("babyora-bakeoff-name", state.name);
    });
  });
  document.querySelectorAll('[data-action="next"]').forEach(button => button.addEventListener("click", () => {
    if (state.frame === 5) {
      button.disabled = true;
      button.textContent = state.arm === "k0" ? "Vurderer vær og aktivitet…" : "Lager rådet…";
      setTimeout(() => { state.frame = 6; render(); }, 3200);
      return;
    }
    if (state.frame < FRAMES.length - 1) { state.frame += 1; render(); }
  }));
  document.querySelectorAll('[data-action="back"]').forEach(button => button.addEventListener("click", () => {
    state.frame = Math.max(0, state.frame - 1); render();
  }));
}

function syncQuery() {
  const next = new URLSearchParams();
  next.set("arm", state.arm);
  next.set("frame", String(state.frame + 1));
  next.set("theme", state.theme);
  next.set("state", state.scenario);
  next.set("text", state.text);
  next.set("motion", state.motion);
  if (state.compare) next.set("compare", "1");
  if (state.participant) next.set("mode", "participant");
  history.replaceState(null, "", `${location.pathname}?${next}`);
}

armSelect.addEventListener("change", () => { state.arm = armSelect.value; state.compare = false; syncQuery(); render(); });
frameSelect.addEventListener("change", () => { state.frame = Number(frameSelect.value); syncQuery(); render(); });
themeSelect.addEventListener("change", () => { state.theme = themeSelect.value; syncQuery(); render(); });
scenarioSelect.addEventListener("change", () => { state.scenario = scenarioSelect.value; syncQuery(); render(); });
textSelect.addEventListener("change", () => { state.text = textSelect.value; syncQuery(); render(); });
motionSelect.addEventListener("change", () => { state.motion = motionSelect.value; syncQuery(); render(); });
document.querySelector("#compare-button").addEventListener("click", () => { state.compare = !state.compare; syncQuery(); render(); });

state.name ||= sessionStorage.getItem("babyora-bakeoff-name") || "";
render();
