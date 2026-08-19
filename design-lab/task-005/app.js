import { directions, scenario } from "./fixture.js";

const garmentIcon = (index) => {
  const icons = ["◠", "╲╱", "◇", "▱", "⌒", "∪"];
  return icons[index] ?? "·";
};

const statusBar = () => `
  <div class="status-bar" aria-hidden="true">
    <span>08:10</span><span>● ◒ ▰</span>
  </div>`;

const brand = () => `
  <div class="brand"><span class="brand-mark" aria-hidden="true">S</span><span>Snudly</span></div>`;

const bodyMap = () => `
  <figure class="body-map" aria-label="Plaggene er koblet til hode, overkropp, hender og bein">
    <svg viewBox="0 0 250 170" role="img" aria-hidden="true">
      <circle class="body" cx="88" cy="27" r="17" />
      <path class="body" d="M73 49 Q88 42 103 49 L109 104 Q88 116 67 104 Z" />
      <path class="body limb" d="M70 56 L42 96 M106 56 L135 96 M76 106 L67 150 M100 106 L111 150" />
      <path class="connector" d="M105 27 H188" />
      <path class="connector" d="M106 61 H205" />
      <path class="connector" d="M45 95 H22" />
      <path class="connector" d="M111 145 H196" />
      <circle class="anchor" cx="188" cy="27" r="4" />
      <circle class="anchor" cx="205" cy="61" r="4" />
      <circle class="anchor" cx="22" cy="95" r="4" />
      <circle class="anchor" cx="196" cy="145" r="4" />
      <text x="194" y="31">HODE</text>
      <text x="211" y="65">KROPP</text>
      <text x="3" y="89">HÅND</text>
      <text x="202" y="149">BEIN</text>
    </svg>
    <figcaption>Alle plagg er koblet til kroppen</figcaption>
  </figure>`;

const weather = () => `
  <section class="weather-block" aria-label="Været i Oslo">
    <div class="weather-art" aria-hidden="true"><span class="cloud"></span><i></i><i></i><i></i></div>
    <div class="weather-copy">
      <div class="weather-place">${scenario.place}</div>
      <strong>${scenario.temperature}</strong>
      <span>Føles som ${scenario.feelsLike}</span>
      <small>${scenario.wind} · ${scenario.precipitation}<br>${scenario.updated}</small>
    </div>
  </section>`;

const activityPicker = () => `
  <fieldset class="activity-picker">
    <legend>Hva skal dere?</legend>
    <div class="activity-options">
      ${scenario.activities
        .map(
          (activity) => `<button class="activity${activity === scenario.activity ? " is-selected" : ""}" type="button" aria-pressed="${activity === scenario.activity}">${activity}</button>`,
        )
        .join("")}
    </div>
  </fieldset>`;

const navigation = (active) => `
  <nav class="tab-bar" aria-label="Hovedmeny">
    ${["Hjem", "Planlegg", "Verktøy", "Familie"]
      .map(
        (item, index) => `<button class="tab${item === active ? " is-active" : ""}" type="button"${item === active ? ' aria-current="page"' : ""}>
          <span aria-hidden="true">${["⌂", "□", "+", "○"][index]}</span>${item}
        </button>`,
      )
      .join("")}
  </nav>`;

const onboarding = () => `
  <article class="phone screen-onboarding" data-screen="onboarding" aria-label="Onboarding">
    ${statusBar()}
    <main>
      ${brand()}
      <div class="progress"><span></span><span></span></div>
      <p class="eyebrow">Steg 1 av 2</p>
      <h2>Hvem kler vi på?</h2>
      <p class="lede">Alder hjelper oss å foreslå riktige lag for barnet.</p>
      <button class="field" type="button" aria-label="Barnets navn: ${scenario.child}">
        <span>Barnets navn</span>
        <strong>${scenario.child}</strong>
      </button>
      <button class="field" type="button" aria-label="Fødselsdato: ${scenario.birthDate}">
        <span>Fødselsdato</span>
        <strong>${scenario.birthDate}</strong>
      </button>
      <p class="privacy-note"><span aria-hidden="true">⌾</span> Lagres bare på denne telefonen</p>
      <button class="primary" type="button">Neste: hjemsted <span aria-hidden="true">→</span></button>
      <button class="secondary" type="button">Hvorfor spør vi?</button>
    </main>
  </article>`;

const home = () => `
  <article class="phone screen-home" data-screen="home" aria-label="Hjem">
    ${statusBar()}
    <main>
      <header class="home-header">
        ${brand()}
        <button class="child-switcher" type="button" aria-label="Bytt barn">${scenario.child} · ${scenario.age} <span aria-hidden="true">⌄</span></button>
      </header>
      <div class="home-greeting"><p class="eyebrow">God morgen</p><h2>Klar for frisk luft?</h2></div>
      ${weather()}
      ${activityPicker()}
      <div class="answer-preview">
        <span class="preview-line"></span>
        <p>Ett antrekk, i riktig rekkefølge.</p>
      </div>
      <button class="primary result-action" type="button">Finn dagens antrekk <span aria-hidden="true">→</span></button>
    </main>
    ${navigation("Hjem")}
  </article>`;

const result = () => `
  <article class="phone screen-result" data-screen="result" aria-label="Resultat">
    ${statusBar()}
    <main>
      <header class="result-header">
        <button class="icon-button" type="button" aria-label="Tilbake">←</button>
        <div><p class="eyebrow">${scenario.place} · ${scenario.activity}</p><h2>${scenario.child}s antrekk</h2></div>
        <button class="icon-button" type="button" aria-label="Del antrekket">↗</button>
      </header>
      <div class="result-meta"><strong>${scenario.temperature}</strong><span>Føles som ${scenario.feelsLike}<br>${scenario.updated}</span></div>
      ${bodyMap()}
      <ol class="outfit-list" aria-label="Påkledningsrekkefølge">
        ${scenario.outfit
          .map(
            (item, index) => `<li><span class="number">${index + 1}</span><span class="garment-icon" aria-hidden="true">${garmentIcon(index)}</span><strong>${item}</strong>${index > 3 ? '<span class="item-state">Tilbehør</span>' : '<span class="item-state">På</span>'}</li>`,
          )
          .join("")}
      </ol>
      <section class="reason"><h3>Derfor</h3><p>${scenario.reason}</p></section>
      <aside class="safety"><strong>Viktig i vogn</strong><p>${scenario.safety}</p></aside>
      <p class="source">${scenario.source}</p>
    </main>
    ${navigation("Hjem")}
  </article>`;

const renderDirection = ({ id, code }) => `
  <section class="direction direction-${id}" data-direction="${code}">
    <header class="direction-heading">
      <span>Retning ${code}</span>
      <p>Samme innhold · 390 × 844 · ingen produksjonstokens</p>
    </header>
    <div class="phone-grid">${onboarding()}${home()}${result()}</div>
  </section>`;

document.querySelector("#directions").innerHTML = directions.map(renderDirection).join("");

const blindButton = document.querySelector("#blind-toggle");
const setBlind = (isBlind) => {
  document.body.classList.toggle("blind", isBlind);
  blindButton.setAttribute("aria-pressed", String(isBlind));
  blindButton.textContent = isBlind ? "Vis retningstitler" : "Skjul retningstitler";
};

setBlind(new URLSearchParams(window.location.search).get("blind") === "1");
blindButton.addEventListener("click", () => setBlind(!document.body.classList.contains("blind")));
