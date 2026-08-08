import type { Lesson } from '../data/vinterprogram';
import { normalizeDeepFlowLanguage, type DeepFlowLanguage } from './deep-flow-copy';

export type LocalizedWinterLesson = Readonly<{
  title: string;
  lead: string;
  sections: readonly Readonly<{ heading: string; body: string }>[];
  tryLabel: string;
}>;

type TranslatedLanguage = Exclude<DeepFlowLanguage, 'no'>;

const LESSONS: Record<TranslatedLanguage, Readonly<Record<string, LocalizedWinterLesson>>> = {
  en: {
    'ull-mot-huden': {
      title: 'Wool next to the skin',
      lead: 'Wool regulates warmth and moisture next to the skin, but it is not always right for every child.',
      sections: [
        { heading: 'Why wool is the first choice', body: 'Wool stays warm when damp and moves moisture away from the skin better than most materials. It also needs less frequent washing. That is why Babyora suggests wool as the first base layer.' },
        { heading: 'The cost of those benefits', body: 'Wool costs more, needs a gentle wash and wears faster than synthetics. That is a real trade-off, not a quality badge you must pursue at any price.' },
        { heading: 'When cotton is right', body: 'Some children react to wool against the body. Paediatric guidance then recommends bamboo or cotton as the base layer, with wool as layer two instead.' },
        { heading: 'No single answer, just a good starting point', body: 'Notice how your child reacts during the first weeks. Redness, itching or discomfort after dressing can mean cotton works better next to the skin. Wool can still be used in the outer layers.' },
      ],
      tryLabel: 'Compare wool and cotton in the garment library',
    },
    'lag-pa-lag': {
      title: 'Layer by layer',
      lead: 'Three adjustable layers work better than one thick garment you cannot change.',
      sections: [
        { heading: 'The model: base, middle and outer layer', body: 'The base layer sits close to the skin and moves moisture. The middle layer adds warmth. The outer layer blocks wind and water. Babyora always builds recommendations in this order.' },
        { heading: 'Why layers beat bulk', body: 'Air between the layers insulates. With three light layers, you can remove one in a warm stroller or add one when you go into the cold without replacing the whole outfit.' },
        { heading: 'Outerwear does little on its own', body: 'A windproof shell without insulating layers underneath does not retain enough warmth. The combination works, not one garment by itself.' },
        { heading: 'One extra wool rule for the youngest', body: 'For babies under three months, Babyora automatically adds an extra wool layer in colder weather because very young babies regulate temperature less effectively.' },
      ],
      tryLabel: 'Build the layers in the calculator',
    },
    'vind-skjult-faktor': {
      title: 'Wind is the hidden factor',
      lead: 'The recommendation follows the “feels like” temperature, not the thermometer alone.',
      sections: [
        { heading: 'Wind takes heat you cannot see', body: 'Two days with the same temperature can feel very different. Damp cold and wind remove heat from skin faster than still, dry air, so Babyora uses the feels-like temperature.' },
        { heading: 'When wind calls for another layer', body: 'From about 5 metres per second in cool weather, the app adds a windproof outer layer. Below 0°C and above 8 metres per second, it also adds shell mittens.' },
        { heading: 'Damp cold is deceptive', body: 'Damp cold feels colder than the thermometer suggests. An extra layer can make sense even when the number on your phone does not look severe.' },
        { heading: 'The youngest in windy weather', body: 'For babies under three months in freezing temperatures and strong wind, the app recommends waiting until the wind eases instead of forcing the outing.' },
      ],
      tryLabel: 'Test wind in the calculator',
    },
    'vogn-baeresele-lek': {
      title: 'Stroller, carrier or play',
      lead: 'Activity changes how much heat a child makes and therefore how much clothing is needed.',
      sections: [
        { heading: 'Stroller: the child lies still', body: 'Without movement, a child in a stroller depends on clothing and a footmuff for warmth. The stroller recommendation often has more insulation than a carrier or active play at the same temperature.' },
        { heading: 'Carrier: your body provides warmth', body: 'Your body heat helps. If the child is inside your jacket, Babyora removes outerwear to avoid overheating.' },
        { heading: 'Outdoor play: movement creates heat', body: 'A child crawling or walking outside creates body heat and often needs lighter, more flexible clothing than a child lying still in a stroller.' },
        { heading: 'One temperature, three answers', body: 'That is why Babyora asks about activity. The same cold day can mean a footmuff in the stroller, a lighter jacket in the carrier and a robust suit for play.' },
      ],
      tryLabel: 'Change activity in the calculator',
    },
    'sjekk-nakken': {
      title: 'Check the neck',
      lead: 'One ten-second routine overrides every other rule.',
      sections: [
        { heading: 'How to do it', body: 'Slip two fingers behind the neck under the top, not on hands or feet, which are naturally cooler. A warm, dry neck means the outfit is right.' },
        { heading: 'Three answers, three responses', body: 'A damp or sweaty neck means too warm: remove a layer. A cool or cold neck means add one. A comfortably warm and dry neck means leave the outfit as it is.' },
        { heading: 'Why this overrides the app', body: 'Weather, age and activity give the app a useful starting point, but only your child’s body shows how that day really feels. The neck check is the final and most important check.' },
        { heading: 'Too much clothing is the common mistake', body: 'Most of us wrap children a little too warmly out of care. Overheating is more common than getting too cold, which is where the neck check is most useful.' },
      ],
      tryLabel: 'Try the neck check',
    },
    'sove-ute-vinter': {
      title: 'Winter sleep',
      lead: 'Sleep sacks and room temperature use a TOG system, while outdoor stroller sleep follows different rules.',
      sections: [
        { heading: 'Indoor TOG steps', body: 'Below 16°C: 3.5 TOG with a long-sleeved bodysuit and pyjamas. From 16 to 20°C: 2.5 TOG. From 20 to 24°C: 1.0 TOG. Above 24°C: 0.5 TOG or less.' },
        { heading: 'Two rules that do not change', body: 'Never use two sleep sacks at once because that can overheat the child. A sleep sack replaces a blanket; do not use both.' },
        { heading: 'Outdoor stroller sleep is different', body: 'TOG numbers do not apply when a child sleeps outside in a stroller. Use a pramsuit, footmuff and hat. Never cover the hood with a blanket because it traps heat.' },
        { heading: 'Check more often in severe cold', body: 'If a child sleeps outside below −7°C for more than half an hour, check every 30 minutes. A down footmuff alone may not be enough.' },
      ],
      tryLabel: 'Find the right TOG step',
    },
    'frost-dager': {
      title: 'Freezing days',
      lead: 'Below −10°C, the youngest babies should usually stay indoors.',
      sections: [
        { heading: 'The −10°C limit', body: 'Norwegian guidance recommends keeping infants indoors when it is colder than −10°C. Below that limit, protection matters more than pushing through the cold.' },
        { heading: 'Balaclava and insulated suit', body: 'In severe cold, a balaclava covers the head, ears and neck, while maximum insulation keeps warmth longer. This is a step above ordinary winter outerwear.' },
        { heading: 'Short trips and frequent checks', body: 'At a feels-like temperature of −10°C or colder, take short trips and check cheeks, nose and ears every 20 minutes. White patches can be an early sign of freezing.' },
        { heading: 'For the very youngest', body: 'Babies under three months should be outside for no more than half an hour in freezing weather. Apply a rich face cream half an hour before going out.' },
      ],
      tryLabel: 'See clothing for −10°C',
    },
    'din-garderobe-din-anbefaling': {
      title: 'Make tomorrow easy',
      lead: 'Plan shows clothing for today and tomorrow, so you can prepare the essentials without guessing far ahead.',
      sections: [
        { heading: 'Look one day ahead', body: 'Tomorrow’s plan uses the hourly forecast for your location and checks the same four times of day as today’s plan.' },
        { heading: 'Lay out the clothes', body: 'Preparing the outfit makes departure calmer. Use the plan as support and always check how your child feels.' },
        { heading: 'Find what you already own', body: 'The garment library gives a simple overview of the layers and what each garment is intended to do.' },
        { heading: 'Check again before leaving', body: 'Forecasts can change. Review today’s plan just before departure and adjust for activity, wind and how your child feels.' },
      ],
      tryLabel: 'Open the garment library',
    },
  },
  sv: {
    'ull-mot-huden': { title: 'Ull mot huden', lead: 'Ull reglerar värme och fukt mot huden, men passar inte alltid alla barn.', sections: [{ heading: 'Varför ull är förstahandsvalet', body: 'Ull håller värmen även när den blir fuktig och leder bort fukt från huden bättre än de flesta material. Den behöver också tvättas mer sällan. Därför föreslår Babyora ull innerst.' }, { heading: 'Priset för fördelarna', body: 'Ull kostar mer, behöver skonsam tvätt och slits snabbare än syntet. Det är en verklig avvägning, inte ett kvalitetskrav du måste nå till varje pris.' }, { heading: 'När bomull är rätt', body: 'Vissa barn reagerar på ull mot kroppen. Barnläkare rekommenderar då bambu eller bomull innerst och ull som lager två.' }, { heading: 'Inget facit, bara en bra start', body: 'Se hur barnet reagerar under de första veckorna. Rodnad, klåda eller oro efter påklädning kan betyda att bomull passar bättre innerst. Ull kan fortfarande användas utanpå.' }], tryLabel: 'Jämför ull och bomull i plaggbiblioteket' },
    'lag-pa-lag': { title: 'Lager på lager', lead: 'Tre justerbara lager fungerar bättre än ett tjockt plagg som inte går att ändra.', sections: [{ heading: 'Modellen: innerst, mellan och ytterst', body: 'Innerlagret ligger mot huden och leder bort fukt. Mellanlagret ger värme. Ytterlagret stoppar vind och vatten. Babyora bygger alltid rekommendationen i den ordningen.' }, { heading: 'Varför lager slår volym', body: 'Luften mellan lagren isolerar. Med tre tunna lager kan du ta av ett i en varm vagn eller lägga till ett i kylan utan att byta allt.' }, { heading: 'Ytterkläder gör lite själva', body: 'Ett vindtätt skal utan isolerande lager under håller inte kvar tillräckligt med värme. Det är kombinationen som fungerar.' }, { heading: 'En extra ullregel för de yngsta', body: 'För barn under tre månader lägger Babyora automatiskt till ett extra ullager i kallare väder eftersom de yngsta reglerar temperaturen sämre.' }], tryLabel: 'Bygg lagren i kalkylatorn' },
    'vind-skjult-faktor': { title: 'Vinden är den dolda faktorn', lead: 'Rekommendationen följer temperaturen som det känns som, inte bara termometern.', sections: [{ heading: 'Vinden tar värme du inte ser', body: 'Två dagar med samma temperatur kan kännas olika. Fuktig kyla och vind tar värme från huden snabbare än stilla, torr luft, så Babyora använder känns-som-temperaturen.' }, { heading: 'När vinden kräver ett extra lager', body: 'Från ungefär 5 meter per sekund i svalt väder lägger appen till ett vindtätt ytterlager. Under 0°C och över 8 meter per sekund läggs även vindvantar till.' }, { heading: 'Fuktig kyla lurar', body: 'Fuktig kyla känns kallare än termometern visar. Ett extra lager kan vara klokt även när siffran i telefonen inte ser så låg ut.' }, { heading: 'De yngsta och vind', body: 'För barn under tre månader i minusgrader och stark vind rekommenderar appen att vänta tills vinden avtar.' }], tryLabel: 'Testa vind i kalkylatorn' },
    'vogn-baeresele-lek': { title: 'Vagn, bärsele eller lek', lead: 'Aktiviteten avgör hur mycket värme barnet skapar och hur mycket kläder som behövs.', sections: [{ heading: 'Vagn: barnet ligger stilla', body: 'Utan rörelse är barnet beroende av kläder och åkpåse. Vagnrekommendationen har därför ofta mer isolering än bärsele eller lek vid samma temperatur.' }, { heading: 'Bärsele: du värmer barnet', body: 'Din kroppsvärme hjälper till. Om barnet är innanför din jacka tar Babyora bort ytterkläder för att undvika överhettning.' }, { heading: 'Utelek: rörelse skapar värme', body: 'Ett barn som kryper eller går ute skapar kroppsvärme och behöver ofta lättare, rörligare kläder än ett barn som ligger stilla i vagnen.' }, { heading: 'Samma temperatur, tre svar', body: 'Därför frågar Babyora om aktivitet. Samma kalla dag kan betyda åkpåse i vagnen, tunnare jacka i selen och en robust overall för lek.' }], tryLabel: 'Byt aktivitet i kalkylatorn' },
    'sjekk-nakken': { title: 'Känn i nacken', lead: 'En rutin på tio sekunder går före alla andra regler.', sections: [{ heading: 'Så gör du', body: 'För in två fingrar bakom nacken under tröjan, inte på händer eller fötter som naturligt är svalare. Varm och torr nacke betyder att kläderna är lagom.' }, { heading: 'Tre svar, tre reaktioner', body: 'Fuktig eller svettig nacke betyder för varmt: ta av ett lager. Sval eller kall nacke betyder lägg till ett. Varm och torr betyder låt kläderna vara.' }, { heading: 'Varför detta går före appen', body: 'Väder, ålder och aktivitet ger en bra startpunkt, men bara barnets kropp visar hur dagen faktiskt känns. Nacktestet är den sista och viktigaste kontrollen.' }, { heading: 'För mycket kläder är vanligast', body: 'De flesta klär lite för varmt av omtanke. Överhettning är vanligare än nedkylning, och då gör nacktestet störst nytta.' }], tryLabel: 'Prova nacktestet' },
    'sove-ute-vinter': { title: 'Sova på vintern', lead: 'Sovsäck och rumstemperatur följer TOG-systemet, medan sömn ute i vagn har andra regler.', sections: [{ heading: 'TOG-steg inomhus', body: 'Under 16°C: 3,5 TOG med långärmad body och pyjamas. 16–20°C: 2,5 TOG. 20–24°C: 1,0 TOG. Över 24°C: 0,5 TOG eller lägre.' }, { heading: 'Två regler som alltid gäller', body: 'Använd aldrig två sovsäckar samtidigt eftersom barnet kan bli överhettat. Sovsäcken ersätter filten; använd inte båda.' }, { heading: 'Sömn ute i vagn är annorlunda', body: 'TOG-tal gäller inte utomhus. Använd åkoverall, åkpåse och mössa. Lägg aldrig en filt över suffletten eftersom den fångar värme.' }, { heading: 'Kontrollera oftare i sträng kyla', body: 'Om barnet sover ute under −7°C längre än en halvtimme, kontrollera var 30:e minut. En dunåkpåse kan vara otillräcklig.' }], tryLabel: 'Hitta rätt TOG-steg' },
    'frost-dager': { title: 'Frostdagar', lead: 'Under −10°C bör de allra yngsta helst vara inomhus.', sections: [{ heading: 'Gränsen vid −10°C', body: 'Norska råd rekommenderar att spädbarn stannar inne när det är kallare än −10°C. Under gränsen handlar det om skydd, inte om att trotsa kylan.' }, { heading: 'Balaklava och isolerad overall', body: 'I sträng kyla täcker balaklavan huvud, öron och hals, medan maximal isolering håller värmen längre. Det är steget över vanliga vinterkläder.' }, { heading: 'Korta turer och täta kontroller', body: 'Vid känns-som −10°C eller kallare: ta korta turer och kontrollera kinder, näsa och öron var 20:e minut. Vita fläckar kan vara ett tidigt tecken på förfrysning.' }, { heading: 'För de allra yngsta', body: 'Barn under tre månader bör vara ute högst en halvtimme i minusgrader. Smörj fet ansiktskräm en halvtimme innan ni går ut.' }], tryLabel: 'Se kläder för −10°C' },
    'din-garderobe-din-anbefaling': { title: 'Gör morgondagen enkel', lead: 'Plan visar kläder för i dag och i morgon, så att du kan förbereda det viktigaste.', sections: [{ heading: 'Se en dag framåt', body: 'Morgondagens plan använder timprognosen för din plats och bedömer samma fyra tider som dagens plan.' }, { heading: 'Lägg fram kläderna', body: 'När kläderna är klara blir avfärden lugnare. Använd planen som stöd och känn alltid efter på barnet.' }, { heading: 'Hitta det du redan har', body: 'Plaggbiblioteket ger en enkel översikt över lagren och vad varje plagg är avsett att göra.' }, { heading: 'Kontrollera igen före avfärd', body: 'Prognosen kan ändras. Se dagens plan precis innan ni går och justera efter aktivitet, vind och hur barnet känns.' }], tryLabel: 'Öppna plaggbiblioteket' },
  },
  da: {
    'ull-mot-huden': { title: 'Uld mod huden', lead: 'Uld regulerer varme og fugt mod huden, men passer ikke altid til alle børn.', sections: [{ heading: 'Hvorfor uld er førstevalget', body: 'Uld holder varmen, selv når den bliver fugtig, og leder fugt væk fra huden bedre end de fleste materialer. Den skal også vaskes sjældnere. Derfor foreslår Babyora uld inderst.' }, { heading: 'Prisen for fordelene', body: 'Uld koster mere, kræver skånsom vask og slides hurtigere end syntetiske stoffer. Det er en reel afvejning, ikke et kvalitetskrav, du skal nå for enhver pris.' }, { heading: 'Når bomuld er rigtigt', body: 'Nogle børn reagerer på uld mod kroppen. Børnelæger anbefaler da bambus eller bomuld inderst og uld som lag nummer to.' }, { heading: 'Ingen facitliste, kun en god start', body: 'Se, hvordan barnet reagerer de første uger. Rødme, kløe eller uro efter påklædning kan betyde, at bomuld passer bedre inderst. Uld kan stadig bruges udenpå.' }], tryLabel: 'Sammenlign uld og bomuld i tøjbiblioteket' },
    'lag-pa-lag': { title: 'Lag på lag', lead: 'Tre lag, der kan justeres, virker bedre end ét tykt stykke tøj, som ikke kan ændres.', sections: [{ heading: 'Modellen: inderst, mellem og yderst', body: 'Det inderste lag ligger mod huden og leder fugt væk. Mellemlaget giver varme. Yderlaget stopper vind og vand. Babyora bygger altid anbefalingen i denne rækkefølge.' }, { heading: 'Hvorfor lag slår volumen', body: 'Luften mellem lagene isolerer. Med tre tynde lag kan du tage ét af i en varm barnevogn eller lægge ét til i kulden uden at skifte alt.' }, { heading: 'Overtøj gør lidt alene', body: 'En vindtæt skal uden isolerende lag under holder ikke nok på varmen. Det er kombinationen, der virker.' }, { heading: 'En ekstra uldregel for de yngste', body: 'For børn under tre måneder lægger Babyora automatisk et ekstra uldlag til i koldere vejr, fordi de yngste regulerer temperaturen dårligere.' }], tryLabel: 'Byg lagene i beregneren' },
    'vind-skjult-faktor': { title: 'Vinden er den skjulte faktor', lead: 'Anbefalingen følger den temperatur, det føles som, ikke kun termometeret.', sections: [{ heading: 'Vind tager varme, du ikke kan se', body: 'To dage med samme temperatur kan føles forskellige. Fugtig kulde og vind fjerner varme fra huden hurtigere end stille, tør luft, så Babyora bruger føles-som-temperaturen.' }, { heading: 'Når vinden kræver et ekstra lag', body: 'Fra omkring 5 meter pr. sekund i køligt vejr tilføjer appen et vindtæt yderlag. Under 0°C og over 8 meter pr. sekund tilføjes også vindluffer.' }, { heading: 'Fugtig kulde snyder', body: 'Fugtig kulde føles koldere, end termometeret viser. Et ekstra lag kan være klogt, selv om tallet på telefonen ikke ser så lavt ud.' }, { heading: 'De yngste og vind', body: 'For børn under tre måneder i frost og stærk vind anbefaler appen at vente, til vinden lægger sig.' }], tryLabel: 'Test vind i beregneren' },
    'vogn-baeresele-lek': { title: 'Barnevogn, bæresele eller leg', lead: 'Aktiviteten afgør, hvor meget varme barnet selv skaber, og hvor meget tøj der er brug for.', sections: [{ heading: 'Barnevogn: barnet ligger stille', body: 'Uden bevægelse er barnet afhængigt af tøj og kørepose. Anbefalingen til barnevogn har derfor ofte mere isolering end bæresele eller leg ved samme temperatur.' }, { heading: 'Bæresele: du varmer barnet', body: 'Din kropsvarme hjælper. Hvis barnet er inden for din jakke, fjerner Babyora overtøjet for at undgå overophedning.' }, { heading: 'Udendørs leg: bevægelse skaber varme', body: 'Et barn, der kravler eller går ude, skaber kropsvarme og har ofte brug for lettere og mere bevægeligt tøj end et barn, der ligger stille.' }, { heading: 'Samme temperatur, tre svar', body: 'Derfor spørger Babyora om aktivitet. Samme kolde dag kan betyde kørepose i vognen, tyndere jakke i selen og en robust dragt til leg.' }], tryLabel: 'Skift aktivitet i beregneren' },
    'sjekk-nakken': { title: 'Tjek nakken', lead: 'En rutine på ti sekunder går forud for alle andre regler.', sections: [{ heading: 'Sådan gør du', body: 'Stik to fingre ind bag nakken under blusen, ikke på hænder eller fødder, som naturligt er køligere. En varm og tør nakke betyder, at tøjet passer.' }, { heading: 'Tre svar, tre reaktioner', body: 'Fugtig eller svedig nakke betyder for varmt: tag et lag af. Kølig eller kold nakke betyder læg et lag til. Varm og tør betyder behold tøjet.' }, { heading: 'Hvorfor dette går forud for appen', body: 'Vejr, alder og aktivitet giver en god start, men kun barnets krop viser, hvordan dagen faktisk føles. Nakketjekket er den sidste og vigtigste kontrol.' }, { heading: 'For meget tøj er mest almindeligt', body: 'De fleste klæder lidt for varmt af omsorg. Overophedning er mere almindelig end nedkøling, og her er nakketjekket mest nyttigt.' }], tryLabel: 'Prøv nakketjekket' },
    'sove-ute-vinter': { title: 'Søvn om vinteren', lead: 'Sovepose og rumtemperatur følger TOG-systemet, mens søvn ude i barnevogn har andre regler.', sections: [{ heading: 'TOG-trin indendørs', body: 'Under 16°C: 3,5 TOG med langærmet body og pyjamas. 16–20°C: 2,5 TOG. 20–24°C: 1,0 TOG. Over 24°C: 0,5 TOG eller lavere.' }, { heading: 'To regler, der altid gælder', body: 'Brug aldrig to soveposer samtidig, da barnet kan blive overophedet. Soveposen erstatter tæppet; brug ikke begge.' }, { heading: 'Søvn ude i barnevogn er anderledes', body: 'TOG-tal gælder ikke udendørs. Brug køredragt, kørepose og hue. Læg aldrig et tæppe over kalechen, da det fanger varmen.' }, { heading: 'Tjek oftere i streng kulde', body: 'Hvis barnet sover ude under −7°C i mere end en halv time, så tjek hvert 30. minut. En dunkørepose kan være utilstrækkelig.' }], tryLabel: 'Find det rigtige TOG-trin' },
    'frost-dager': { title: 'Frostdage', lead: 'Under −10°C bør de aller yngste helst være indendørs.', sections: [{ heading: 'Grænsen ved −10°C', body: 'Norske råd anbefaler, at spædbørn bliver inde, når det er koldere end −10°C. Under grænsen handler det om beskyttelse, ikke om at trodse kulden.' }, { heading: 'Balaclava og isoleret dragt', body: 'I streng kulde dækker balaclava hoved, ører og hals, mens maksimal isolering holder længere på varmen. Det er trinnet over almindeligt vintertøj.' }, { heading: 'Korte ture og hyppige tjek', body: 'Ved føles-som −10°C eller koldere: tag korte ture og tjek kinder, næse og ører hvert 20. minut. Hvide pletter kan være et tidligt tegn på forfrysning.' }, { heading: 'For de aller yngste', body: 'Børn under tre måneder bør højst være ude en halv time i frost. Smør en fed ansigtscreme på en halv time før turen.' }], tryLabel: 'Se tøj til −10°C' },
    'din-garderobe-din-anbefaling': { title: 'Gør morgendagen nem', lead: 'Plan viser tøj til i dag og i morgen, så du kan gøre det vigtigste klar.', sections: [{ heading: 'Se én dag frem', body: 'Morgendagens plan bruger timeprognosen for dit sted og vurderer de samme fire tidspunkter som dagens plan.' }, { heading: 'Læg tøjet frem', body: 'Når tøjet er klart, bliver afgangen roligere. Brug planen som støtte, og mærk altid efter på barnet.' }, { heading: 'Find det, du allerede har', body: 'Tøjbiblioteket giver et enkelt overblik over lagene og det, hver beklædningsdel skal gøre.' }, { heading: 'Tjek igen før afgang', body: 'Prognosen kan ændre sig. Se dagens plan lige før afgang, og juster efter aktivitet, vind og hvordan barnet føles.' }], tryLabel: 'Åbn tøjbiblioteket' },
  },
};

function englishFallback(lesson: Lesson): LocalizedWinterLesson {
  return {
    title: 'Winter lesson',
    lead: 'Practical guidance for keeping your child comfortable in winter.',
    sections: lesson.sections.map(() => ({
      heading: 'What to know',
      body: 'Use adjustable layers and check your child regularly for warmth or dampness.',
    })),
    tryLabel: 'Try it now',
  };
}

export function localizedWinterLesson(
  lesson: Lesson,
  language: string | null | undefined,
): LocalizedWinterLesson {
  const normalized = normalizeDeepFlowLanguage(language);
  if (normalized === 'no') {
    return {
      title: lesson.title,
      lead: lesson.lead,
      sections: lesson.sections,
      tryLabel: lesson.tryDet.label,
    };
  }
  return LESSONS[normalized][lesson.id] ?? englishFallback(lesson);
}
