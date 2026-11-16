/* TræQuiz — hjemmehørende danske træer */

/* ------------------- i18n ------------------- */

const I18N = {
  da: {
    title: 'TræQuiz — hjemmehørende danske træer',
    brandAria: 'Tilbage til forsiden',
    navQuiz: 'Quiz', navList: 'Artsliste', navGuide: 'Guide',
    guideLink: 'Ny til træer? Læs den korte guide til at kende træer →',
    langAria: 'Switch to English', langTitle: 'Dansk / English',
    muteAria: 'Slå lyd til eller fra', muteTitle: 'Lyd til/fra',
    heroKicker: '33 vilde, danske arter',
    heroTitle: 'Kender du<br>træerne?',
    heroSub: 'Alle træer i quizzen er hjemmehørende i Danmark — altså arter, der er indvandret af sig selv efter sidste istid. Ingen importerede park- og skovtræer.',
    setupWhat: 'Hvad vil du øve dig på?',
    setupLevel: 'Sværhedsgrad',
    modeAria: 'Spørgsmålstype', levelAria: 'Sværhedsgrad',
    modeBlade: 'Blade', modeBladeDesc: 'Kend træet på løvet',
    modeBark: 'Bark', modeBarkDesc: 'Kend stammen på afstand',
    modeBlomst: 'Blomster', modeBlomstDesc: 'Blomster og rakler',
    modeFrugt: 'Frugter', modeFrugtDesc: 'Bær, nødder og kogler',
    modeBlandet: 'Blandet', modeBlandetDesc: 'Lidt af hvert',
    levelAlleDesc: 'Blanding af alt',
    levelNem: 'Nem', levelNemDesc: n => `${n} almindelige arter`,
    levelMellem: 'Mellem', levelMellemDesc: n => `${n} lidt sværere`,
    levelSvaer: 'Svær', levelSvaerDesc: n => `${n} kendere`,
    startBtn: 'Start quizzen · 10 spørgsmål',
    tip: 'Tip: Brug tastaturgenveje 1-4 for at svare og Enter for at gå videre.',
    qLabel: 'Spørgsmål', pointsLabel: 'Points', streakTxt: 'i træk',
    imgAlt: 'Hvilken træart er dette?',
    factTag: 'Vidste du',
    next: 'Næste', seeResult: 'Se resultat',
    resultKicker: 'Runden er slut', pointsWord: 'points',
    statCorrectLabel: 'rigtige af 10', statStreakLabel: 'bedste streak',
    again: 'Prøv igen', changeSettings: 'Skift indstillinger', seeList: 'Se artslisten',
    missedLabel: 'Til næste gang:',
    listTitle: 'De 33 hjemmehørende træer',
    listSub: 'Arter, der er indvandret til Danmark af sig selv efter sidste istid — uden menneskers hjælp. Swipe billederne på kortene for at se blade, bark, blomster og frugter.',
    sortAria: 'Gruppér artslisten', sortLabel: 'Gruppér efter:',
    sortDefault: 'Standard', sortHyppighed: 'Almindelighed', sortStatus: 'Rødlistestatus', sortBladform: 'Bladform',
    sortMine: 'Svære for mig', sortLookalike: 'Forvekslinger',
    cardMore: 'Se alt om arten', openSpecies: n => `Åbn ${n}`,
    sheetClose: 'Luk', sheetPrev: 'Forrige art', sheetNext: 'Næste art',
    secWinter: 'Om vinteren', secDist: 'Udbredelse i Danmark', secNative: 'Status som hjemmehørende',
    secLook: 'Kan forveksles med', secStats: 'Dine svar', secSources: 'Læs mere',
    statsLine: (r, n) => `Du har svaret rigtigt ${r} af ${n} gange.`, statsNone: 'Du har ikke øvet denne art endnu.',
    quizSpecies: 'Quiz denne art og dens forvekslinger',
    sortArr: 'Bladstilling', sortHabit: 'Vækstform', sortFruit: 'Frugttype', sortFamily: 'Familie', sortHabitat: 'Levested', sortNow: 'Lige nu: blomster og frugter',
    filterArr: 'Bladstilling', filterHabit: 'Vækstform', filterFruit: 'Frugttype', filterFamily: 'Familie', filterHabitat: 'Levested',
    arrVals: { modsat: 'Modsatte blade', spredt: 'Spredte blade', naale: 'Nåletræer' },
    habitVals: { traa: 'Træ', busk: 'Busk eller lille træ' },
    fruitVals: { noed: 'Nødder og agern', vinget: 'Vingede frø', kogle: 'Kogler', baer: 'Bær og stenfrugter', kernefrugt: 'Æbler og pærer', kapsel: 'Kapsler med frø' },
    familyVals: { Fagaceae: 'Bøgefamilien', Betulaceae: 'Birkefamilien', Oleaceae: 'Olivenfamilien', Malvaceae: 'Katostfamilien', Pinaceae: 'Fyrrefamilien', Rosaceae: 'Rosenfamilien', Sapindaceae: 'Sæbebærfamilien', Salicaceae: 'Pilefamilien', Cupressaceae: 'Cypresfamilien', Taxaceae: 'Taksfamilien', Viburnaceae: 'Desmerurtfamilien', Aquifoliaceae: 'Kristtornfamilien', Ulmaceae: 'Elmefamilien', Rhamnaceae: 'Vrietornfamilien', Celastraceae: 'Benvedfamilien' },
    habitatVals: { skov: 'Skov', bryn: 'Skovbryn, krat og hegn', vaad: 'Fugtig bund', toer: 'Tør, sandet bund og hede' },
    months: ['jan.', 'feb.', 'mar.', 'apr.', 'maj', 'jun.', 'jul.', 'aug.', 'sep.', 'okt.', 'nov.', 'dec.'],
    monthsLong: ['januar', 'februar', 'marts', 'april', 'maj', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'december'],
    allYear: 'hele året',
    nowGroups: { flower: m => `Blomstrer i ${m}`, fruit: m => `Har frugter i ${m}`, none: m => `Hverken blomster eller frugter i ${m}` },
    nowNote: 'Månederne er omtrentlige for Danmark og kan flytte sig et par uger med vejret.',
    cardFlowers: 'Blomstrer', cardFruits: 'Frugter', cardHabitat: 'Levested',
    searchPh: 'Søg efter art (også latin)',
    filtersLabel: n => n ? `Filtre (${n})` : 'Filtre',
    filterBladform: 'Bladform', filterHyppighed: 'Almindelighed', filterStatus: 'Rødlistestatus', filterLevel: 'Sværhedsgrad',
    clearFilters: 'Nulstil', listEmpty: 'Ingen arter passer til din søgning.',
    listCount: (n, t) => n === t ? `${t} arter` : `${n} af ${t} arter`,
    viewCompact: 'Kompakt liste', viewCards: 'Store kort', showLess: 'Vis mindre',
    quizShown: 'Quiz de viste arter', quizThese: 'Quiz disse',
    mineGroups: { often: 'Ofte forkert', some: 'Af og til forkert', good: 'Har styr på', new: 'Ikke øvet endnu' },
    mineNote: 'Grupperne bygger på dine svar i quizzen på denne enhed.',
    correctOf: n => `rigtige af ${n}`,
    footer: 'Billeder: <a href="https://commons.wikimedia.org/" target="_blank" rel="noopener">Wikimedia Commons</a> · Arterne følger Skov- og Naturstyrelsens liste over hjemmehørende træer og buske · Rødlistestatus: <a href="https://www.naturbasen.dk/" target="_blank" rel="noopener">Danmarks Rødliste 2019</a> via Naturbasen.',
    kind: { blade: 'Blad', bark: 'Bark', blomst: 'Blomst', frugt: 'Frugt' },
    kindPlural: { blade: 'blade', bark: 'bark', blomst: 'blomster', frugt: 'frugter' },
    levelName: { nem: 'nem', mellem: 'mellem', svær: 'svær' },
    status: { LC: 'Livskraftig', EN: 'Truet', CR: 'Kritisk truet', VU: 'Sårbar', NT: 'Nær truet', NE: 'Ikke vurderet' },
    hyppighed: { 'Meget almindelig': 'Meget almindelig', 'Almindelig': 'Almindelig', 'Hist og her': 'Hist og her', 'Sjælden': 'Sjælden' },
    bladformChip: { 'Nåle': 'Nåle', 'Finnet': 'Finnede blade', 'Helrandet': 'Helrandede blade', 'Lappet': 'Lappede blade', 'Savtakket': 'Savtakkede blade' },
    chipTitleStatus: 'Rødlistestatus i Danmark (Rødliste 2019)',
    chipTitleHyp: 'Hvor almindelig arten er i Danmark',
    chipTitleBladform: 'Bladform',
    loading: 'Henter billede …',
    loadFail: 'Billedet kunne ikke hentes — prøv igen om lidt.',
    correctHead: (p, bonus) => 'Rigtigt!' + (bonus ? ` +${p} points (streak-bonus!)` : ` +${p} points`),
    wrongHead: (chosen, right) => `Desværre — det var ${chosen}. Rigtigt svar: ${right}.`,
    kick10: 'Fuldt hus!', sub10: 'Du er en ægte skovmand — bøgen bukker for dig.',
    kick8: 'Stærkt gået', sub8: 'Du kender dine træer. En enkelt genomgang af artslisten, og du er i top.',
    kick5: 'Godt på vej', sub5: 'Halvvejs der. Prøv en runde mere — eller start på nem-niveau.',
    kick3: 'Øvelse gør mester', sub3: 'Kig artslisten igennem og mærk kendetegnene — så prøv igen.',
    kick0: 'Sådan begynder alle', sub0: 'Start med de nemme arter, og byg deropfra. Du bliver skarpere for hver runde.',
    carPrev: 'Forrige billede', carNext: 'Næste billede',
    slideAlt: (kind, name) => `${kind} af ${name}`,
  },
  en: {
    title: 'TreeQuiz — native Danish trees',
    brandAria: 'Back to the front page',
    navQuiz: 'Quiz', navList: 'Species list', navGuide: 'Guide',
    guideLink: 'New to trees? Read the short guide to identifying trees →',
    langAria: 'Skift til dansk', langTitle: 'Dansk / English',
    muteAria: 'Turn sound on or off', muteTitle: 'Sound on/off',
    heroKicker: '33 wild, native species',
    heroTitle: 'Do you know<br>your trees?',
    heroSub: 'Every tree in the quiz is native to Denmark — species that arrived on their own after the last ice age. No imported park or forest trees.',
    setupWhat: 'What do you want to practise?',
    setupLevel: 'Difficulty',
    modeAria: 'Question type', levelAria: 'Difficulty',
    modeBlade: 'Leaves', modeBladeDesc: 'Know the tree by its foliage',
    modeBark: 'Bark', modeBarkDesc: 'Know the trunk from a distance',
    modeBlomst: 'Flowers', modeBlomstDesc: 'Blossoms and catkins',
    modeFrugt: 'Fruits', modeFrugtDesc: 'Berries, nuts and cones',
    modeBlandet: 'Mixed', modeBlandetDesc: 'A bit of everything',
    levelAlleDesc: 'A mix of everything',
    levelNem: 'Easy', levelNemDesc: n => `${n} common species`,
    levelMellem: 'Medium', levelMellemDesc: n => `${n} a bit harder`,
    levelSvaer: 'Hard', levelSvaerDesc: n => `${n} for experts`,
    startBtn: 'Start the quiz · 10 questions',
    tip: 'Tip: Use keyboard shortcuts 1-4 to answer and Enter to continue.',
    qLabel: 'Question', pointsLabel: 'Points', streakTxt: 'in a row',
    imgAlt: 'Which tree species is this?',
    factTag: 'Did you know',
    next: 'Next', seeResult: 'See results',
    resultKicker: 'Round finished', pointsWord: 'points',
    statCorrectLabel: 'correct out of 10', statStreakLabel: 'best streak',
    again: 'Try again', changeSettings: 'Change settings', seeList: 'See the species list',
    missedLabel: 'For next time:',
    listTitle: 'The 33 native trees',
    listSub: 'Species that arrived in Denmark on their own after the last ice age — without human help. Swipe the images on each card to see leaves, bark, flowers and fruits.',
    sortAria: 'Group the species list', sortLabel: 'Group by:',
    sortDefault: 'Default', sortHyppighed: 'Abundance', sortStatus: 'Red List status', sortBladform: 'Leaf shape',
    sortMine: 'Hard for me', sortLookalike: 'Look-alikes',
    cardMore: 'See everything about it', openSpecies: n => `Open ${n}`,
    sheetClose: 'Close', sheetPrev: 'Previous species', sheetNext: 'Next species',
    secWinter: 'In winter', secDist: 'Distribution in Denmark', secNative: 'Native status',
    secLook: 'Can be confused with', secStats: 'Your answers', secSources: 'Read more',
    statsLine: (r, n) => `You have answered correctly ${r} of ${n} times.`, statsNone: 'You have not practised this species yet.',
    quizSpecies: 'Quiz this species and its look-alikes',
    sortArr: 'Leaf arrangement', sortHabit: 'Growth form', sortFruit: 'Fruit type', sortFamily: 'Family', sortHabitat: 'Habitat', sortNow: 'Right now: flowers and fruits',
    filterArr: 'Leaf arrangement', filterHabit: 'Growth form', filterFruit: 'Fruit type', filterFamily: 'Family', filterHabitat: 'Habitat',
    arrVals: { modsat: 'Opposite leaves', spredt: 'Alternate leaves', naale: 'Conifers' },
    habitVals: { traa: 'Tree', busk: 'Shrub or small tree' },
    fruitVals: { noed: 'Nuts and acorns', vinget: 'Winged seeds', kogle: 'Cones', baer: 'Berries and drupes', kernefrugt: 'Apples and pears', kapsel: 'Seed capsules' },
    familyVals: { Fagaceae: 'Beech family', Betulaceae: 'Birch family', Oleaceae: 'Olive family', Malvaceae: 'Mallow family', Pinaceae: 'Pine family', Rosaceae: 'Rose family', Sapindaceae: 'Soapberry family', Salicaceae: 'Willow family', Cupressaceae: 'Cypress family', Taxaceae: 'Yew family', Viburnaceae: 'Viburnum family', Aquifoliaceae: 'Holly family', Ulmaceae: 'Elm family', Rhamnaceae: 'Buckthorn family', Celastraceae: 'Spindle family' },
    habitatVals: { skov: 'Woodland', bryn: 'Woodland edges, scrub and hedges', vaad: 'Damp ground', toer: 'Dry, sandy ground and heath' },
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    monthsLong: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    allYear: 'all year',
    nowGroups: { flower: m => `Flowering in ${m}`, fruit: m => `With fruits in ${m}`, none: m => `Neither flowers nor fruits in ${m}` },
    nowNote: 'Months are approximate for Denmark and can shift by a couple of weeks with the weather.',
    cardFlowers: 'Flowers', cardFruits: 'Fruits', cardHabitat: 'Habitat',
    searchPh: 'Search species (Latin too)',
    filtersLabel: n => n ? `Filters (${n})` : 'Filters',
    filterBladform: 'Leaf shape', filterHyppighed: 'Abundance', filterStatus: 'Red List status', filterLevel: 'Difficulty',
    clearFilters: 'Clear', listEmpty: 'No species match your search.',
    listCount: (n, t) => n === t ? `${t} species` : `${n} of ${t} species`,
    viewCompact: 'Compact list', viewCards: 'Large cards', showLess: 'Show less',
    quizShown: 'Quiz the species shown', quizThese: 'Quiz these',
    mineGroups: { often: 'Often wrong', some: 'Sometimes wrong', good: 'Got it', new: 'Not practised yet' },
    mineNote: 'Groups are based on your quiz answers on this device.',
    correctOf: n => `correct out of ${n}`,
    footer: 'Images: <a href="https://commons.wikimedia.org/" target="_blank" rel="noopener">Wikimedia Commons</a> · The species follow the Danish Forest and Nature Agency list of native trees and shrubs · Red List status: <a href="https://www.naturbasen.dk/" target="_blank" rel="noopener">Danish Red List 2019</a> via Naturbasen.',
    kind: { blade: 'Leaf', bark: 'Bark', blomst: 'Flower', frugt: 'Fruit' },
    kindPlural: { blade: 'leaves', bark: 'bark', blomst: 'flowers', frugt: 'fruits' },
    levelName: { nem: 'easy', mellem: 'medium', svær: 'hard' },
    status: { LC: 'Least concern', EN: 'Endangered', CR: 'Critically endangered', VU: 'Vulnerable', NT: 'Near threatened', NE: 'Not evaluated' },
    hyppighed: { 'Meget almindelig': 'Very common', 'Almindelig': 'Common', 'Hist og her': 'Scattered', 'Sjælden': 'Rare' },
    bladformChip: { 'Nåle': 'Needles', 'Finnet': 'Pinnate leaves', 'Helrandet': 'Entire leaves', 'Lappet': 'Lobed leaves', 'Savtakket': 'Serrated leaves' },
    chipTitleStatus: 'Red List status in Denmark (Red List 2019)',
    chipTitleHyp: 'How common the species is in Denmark',
    chipTitleBladform: 'Leaf shape',
    loading: 'Loading image …',
    loadFail: 'The image could not be loaded — please try again shortly.',
    correctHead: (p, bonus) => 'Correct!' + (bonus ? ` +${p} points (streak bonus!)` : ` +${p} points`),
    wrongHead: (chosen, right) => `Sorry — that was ${chosen}. Correct answer: ${right}.`,
    kick10: 'Perfect score!', sub10: 'You are a true forester — even the beech bows to you.',
    kick8: 'Strong round', sub8: 'You know your trees. One pass through the species list and you will be at the top.',
    kick5: 'Getting there', sub5: 'Halfway. Play another round — or start on the easy level.',
    kick3: 'Practice makes perfect', sub3: 'Go through the species list and take in the key features — then try again.',
    kick0: 'Everyone starts here', sub0: 'Start with the easy species and build from there. You get sharper with every round.',
    carPrev: 'Previous image', carNext: 'Next image',
    slideAlt: (kind, name) => `${kind} of ${name}`,
  },
};

let LANG = 'da';
const T = k => I18N[LANG][k];
const spName = sp => LANG === 'en' ? (sp.en || sp.dk) : sp.dk;
const spText = (sp, field) => LANG === 'en' ? (sp[field + '_en'] || sp[field]) : sp[field];
const nameOf = sp => LANG === 'en' ? (sp.en || sp.dk) : sp.dk;
const sortName = sp => (LANG === 'en' ? (sp.en || sp.dk) : sp.dk);

/* ------------------- state ------------------- */

const KINDS = ['blade', 'bark', 'blomst', 'frugt'];

const S = {
  screen: 'start',
  mode: 'blade',          // blade | bark | blomst | frugt | blandet
  level: 'alle',          // alle | nem | mellem | svær
  customPool: null,       // arts-id'er når quizzen startes fra artslisten
  questions: [],
  qIndex: 0,
  score: 0,
  streak: 0,
  bestStreak: 0,
  correctCount: 0,
  answered: false,
  missed: [],
  chosenIdx: -1,
  lastPoints: 10,
  lastBonus: 0,
  muted: false,
  audioCtx: null,
};

const LEVEL_COUNT = {};
SPECIES.forEach(s => { LEVEL_COUNT[s.level] = (LEVEL_COUNT[s.level] || 0) + 1; });

const $ = id => document.getElementById(id);
const screens = {
  start: $('screen-start'),
  quiz: $('screen-quiz'),
  result: $('screen-result'),
  list: $('screen-list'),
  learn: $('screen-learn'),
};

/* ------------------- sprog ------------------- */

function applyLang() {
  document.documentElement.lang = LANG;
  document.title = T('title');
  $('langBtn').textContent = LANG === 'da' ? 'EN' : 'DA';
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const v = T(el.dataset.i18n);
    if (typeof v === 'string') el.textContent = v;
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const v = T(el.dataset.i18nHtml);
    if (typeof v === 'string') el.innerHTML = v;
  });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    const v = T(el.dataset.i18nAria);
    if (typeof v === 'string') el.setAttribute('aria-label', v);
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const v = T(el.dataset.i18nTitle);
    if (typeof v === 'string') el.setAttribute('title', v);
  });
  document.querySelectorAll('[data-i18n-group-aria]').forEach(el => {
    const v = T(el.dataset.i18nGroupAria);
    if (typeof v === 'string') el.setAttribute('aria-label', v);
  });
  document.querySelectorAll('[data-i18n-alt]').forEach(el => {
    el.alt = T(el.dataset.i18nAlt);
  });
  // niveauer med rigtige tal
  $('lvlAlle').textContent = (LANG === 'en' ? `All ${SPECIES.length}` : `Alle ${SPECIES.length}`);
  $('lvlNem').textContent = T('levelNem');
  $('lvlNemDesc').textContent = T('levelNemDesc')(LEVEL_COUNT.nem || 0);
  $('lvlMellem').textContent = T('levelMellem');
  $('lvlMellemDesc').textContent = T('levelMellemDesc')(LEVEL_COUNT.mellem || 0);
  $('lvlSvaer').textContent = T('levelSvaer');
  $('lvlSvaerDesc').textContent = T('levelSvaerDesc')(LEVEL_COUNT.svær || 0);
  // dynamiske skærme
  if (S.screen === 'list') renderList();
  else if (S.screen === 'learn') renderLearn();
  else if (S.screen === 'quiz') refreshQuizTexts();
  else if (S.screen === 'result') showResult(true);
}

$('langBtn').addEventListener('click', () => {
  LANG = LANG === 'da' ? 'en' : 'da';
  ensureAudio(); sfx.click();
  applyLang();
});

/* ------------------- audio ------------------- */

function ensureAudio() {
  if (!S.audioCtx) {
    try { S.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* no audio */ }
  }
  if (S.audioCtx && S.audioCtx.state === 'suspended') S.audioCtx.resume();
}

function tone(freq, dur, type, vol, delay) {
  if (S.muted || !S.audioCtx) return;
  const t0 = S.audioCtx.currentTime + (delay || 0);
  const osc = S.audioCtx.createOscillator();
  const gain = S.audioCtx.createGain();
  osc.type = type || 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(vol || 0.18, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(gain).connect(S.audioCtx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

const sfx = {
  click() { tone(660, 0.05, 'triangle', 0.06); },
  correct() { tone(523, 0.12, 'sine', 0.14); tone(784, 0.16, 'sine', 0.14, 0.09); },
  wrong() { tone(220, 0.22, 'sawtooth', 0.06); tone(164, 0.28, 'sine', 0.1, 0.06); },
  finish() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'sine', 0.12, i * 0.12)); },
};

/* ------------------- navigation ------------------- */

function show(name) {
  S.screen = name;
  Object.values(screens).forEach(s => s.hidden = true);
  screens[name].hidden = false;
  window.scrollTo({ top: 0, behavior: 'instant' });
  if (name === 'list') renderList();
  if (name === 'learn') renderLearn();
}

document.querySelectorAll('[data-nav]').forEach(btn =>
  btn.addEventListener('click', () => { ensureAudio(); sfx.click(); show(btn.dataset.nav); })
);

$('muteBtn').addEventListener('click', () => {
  S.muted = !S.muted;
  $('soundOn').style.display = S.muted ? 'none' : 'block';
  $('soundOff').style.display = S.muted ? 'block' : 'none';
  if (!S.muted) { ensureAudio(); sfx.click(); }
});

/* ------------------- setup ------------------- */

document.querySelectorAll('[data-choice-mode]').forEach(btn =>
  btn.addEventListener('click', () => {
    ensureAudio(); sfx.click();
    S.mode = btn.dataset.choiceMode;
    document.querySelectorAll('[data-choice-mode]').forEach(b => {
      b.classList.toggle('is-selected', b === btn);
      b.setAttribute('aria-checked', b === btn ? 'true' : 'false');
    });
  })
);

document.querySelectorAll('[data-choice-level]').forEach(btn =>
  btn.addEventListener('click', () => {
    ensureAudio(); sfx.click();
    S.level = btn.dataset.choiceLevel;
    document.querySelectorAll('[data-choice-level]').forEach(b => {
      b.classList.toggle('is-selected', b === btn);
      b.setAttribute('aria-checked', b === btn ? 'true' : 'false');
    });
  })
);

$('startBtn').addEventListener('click', () => {
  ensureAudio(); sfx.click();
  S.customPool = null;
  startQuiz();
});

/* ------------------- quiz logic ------------------- */

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickDistractors(target, pool) {
  const others = pool.filter(s => s.id !== target.id);
  const sameLookalike = others.filter(s => (target.lookalikes || []).includes(s.id));
  const sameLevel = others.filter(s => s.level === target.level && !sameLookalike.includes(s));
  const rest = others.filter(s => !sameLookalike.includes(s) && !sameLevel.includes(s));
  const chosen = [
    ...shuffle(sameLookalike),
    ...shuffle(sameLevel),
    ...shuffle(rest),
  ].slice(0, 3);
  return chosen;
}

function startQuiz() {
  let pool = S.customPool
    ? SPECIES.filter(s => S.customPool.includes(s.id))
    : (S.level === 'alle' ? SPECIES : SPECIES.filter(s => s.level === S.level));
  // i en bestemt billedtype skal kun arter med billeder af den type med
  let mode = S.mode;
  if (mode !== 'blandet') {
    const withImgs = pool.filter(s => (s.imgs[mode] || []).length);
    if (withImgs.length >= 2 || !S.customPool) pool = withImgs;
    else mode = 'blandet';
  }
  const n = Math.min(10, pool.length);
  if (!n) { show('start'); return; }
  // små udvalg fra artslisten får svarmuligheder fra alle arter
  const distractorPool = pool.length >= 4 ? pool : SPECIES;
  const picked = shuffle(pool).slice(0, n);
  S.questions = picked.map(sp => {
    let kind = mode;
    if (mode === 'blandet') {
      const kinds = KINDS.filter(k => (sp.imgs[k] || []).length);
      kind = kinds[Math.floor(Math.random() * kinds.length)] || 'blade';
    }
    return {
      species: sp,
      kind,
      imgIdx: Math.floor(Math.random() * sp.imgs[kind].length),
      options: shuffle([sp, ...pickDistractors(sp, distractorPool)]),
    };
  });
  S.qIndex = 0;
  S.score = 0;
  S.streak = 0;
  S.bestStreak = 0;
  S.correctCount = 0;
  S.missed = [];
  show('quiz');
  renderQuestion();
}

function renderQuestion() {
  S.answered = false;
  S.chosenIdx = -1;
  const q = S.questions[S.qIndex];
  $('qNum').textContent = S.qIndex + 1;
  $('qTotal').textContent = S.questions.length;
  $('progressFill').style.width = ((S.qIndex) / S.questions.length * 100) + '%';
  $('score').textContent = S.score;
  $('streakPill').hidden = S.streak < 2;
  $('streak').textContent = S.streak;
  $('feedback').hidden = true;
  $('nextBtn').textContent = S.qIndex === S.questions.length - 1 ? T('seeResult') : T('next');
  $('imgBadge').textContent = T('kind')[q.kind];

  renderAnswers(q);
  loadImage(q, 0);
}

function renderAnswers(q) {
  const answers = $('answers');
  answers.innerHTML = '';
  q.options.forEach((sp, i) => {
    const b = document.createElement('button');
    b.className = 'answer';
    b.innerHTML = `<span class="key">${i + 1}</span><span>${spName(sp)}<span class="latin">${sp.latin}</span></span>`;
    b.addEventListener('click', () => answer(i));
    answers.appendChild(b);
  });
}

/* opdater quiz-tekster ved sprogskift uden at nulstille spørgsmålet */
function refreshQuizTexts() {
  const q = S.questions[S.qIndex];
  if (!q) return;
  $('qLabel').textContent = T('qLabel');
  $('pointsLabel').textContent = T('pointsLabel');
  $('streakTxt').textContent = T('streakTxt');
  $('imgBadge').textContent = T('kind')[q.kind];
  $('nextBtn').textContent = S.qIndex === S.questions.length - 1 ? T('seeResult') : T('next');
  const buttons = [...document.querySelectorAll('.answer')];
  if (S.answered && buttons.length) {
    buttons.forEach((b, j) => {
      b.disabled = true;
      b.innerHTML = `<span class="key">${j + 1}</span><span>${spName(q.options[j])}<span class="latin">${q.options[j].latin}</span></span>`;
      if (q.options[j].id === q.species.id) b.classList.add('correct');
      else if (j === S.chosenIdx) b.classList.add('wrong');
      else b.classList.add('dimmed');
    });
    if (q.options[S.chosenIdx] && q.options[S.chosenIdx].id === q.species.id) {
      $('feedbackHead').textContent = T('correctHead')(S.lastPoints || 10, S.lastBonus || 0);
    } else {
      $('feedbackHead').textContent = T('wrongHead')(spName(q.options[S.chosenIdx] || q.options[0]), spName(q.species));
    }
    $('feedbackHint').textContent = spText(q.species, q.kind);
    $('feedbackFact').textContent = spText(q.species, 'fakta');
  } else {
    renderAnswers(q);
  }
}

function loadImage(q, attempt) {
  const img = $('quizImg');
  const urls = q.species.imgs[q.kind] || [];
  if (attempt >= urls.length) {
    // alle billeder fejlede — prøv en ny art med samme billedtype (men aldrig efter der er svaret)
    let pool = S.customPool
      ? SPECIES.filter(s => S.customPool.includes(s.id))
      : (S.level === 'alle' ? SPECIES : SPECIES.filter(s => s.level === S.level));
    const used = S.questions.map(x => x.species.id);
    const fresh = S.answered ? [] : pool.filter(s => !used.includes(s.id) && (s.imgs[q.kind] || []).length);
    if (fresh.length) {
      const sp = fresh[Math.floor(Math.random() * fresh.length)];
      q.species = sp;
      q.imgIdx = Math.floor(Math.random() * sp.imgs[q.kind].length);
      q.options = shuffle([sp, ...pickDistractors(sp, pool.length >= 4 ? pool : SPECIES)]);
      renderQuestion();
    } else {
      $('imgLoading').hidden = false;
      $('imgLoading').textContent = T('loadFail');
    }
    return;
  }
  const url = urls[(q.imgIdx + attempt) % urls.length];
  $('imgLoading').hidden = false;
  $('imgLoading').textContent = T('loading');
  img.className = isScanUrl(url) ? 'img-contain' : '';
  img.onload = () => { $('imgLoading').hidden = true; };
  img.onerror = () => loadImage(q, attempt + 1);
  img.src = url;
  if (img.complete && img.naturalWidth > 0) $('imgLoading').hidden = true;
}

function answer(i) {
  if (S.answered) return;
  S.answered = true;
  S.chosenIdx = i;
  ensureAudio();
  const q = S.questions[S.qIndex];
  const chosen = q.options[i];
  const correct = chosen.id === q.species.id;
  recordAnswer(q.species.id, correct);
  const buttons = [...document.querySelectorAll('.answer')];
  buttons.forEach((b, j) => {
    b.disabled = true;
    if (q.options[j].id === q.species.id) b.classList.add('correct');
    else if (j === i) b.classList.add('wrong');
    else b.classList.add('dimmed');
  });

  if (correct) {
    S.streak += 1;
    S.bestStreak = Math.max(S.bestStreak, S.streak);
    S.correctCount += 1;
    const bonus = Math.min(S.streak - 1, 5) * 2;
    S.score += 10 + bonus;
    S.lastPoints = 10 + bonus; S.lastBonus = bonus;
    sfx.correct();
    $('feedbackHead').textContent = T('correctHead')(10 + bonus, bonus);
  } else {
    S.streak = 0;
    S.missed.push(q.species);
    sfx.wrong();
    $('feedbackHead').textContent = T('wrongHead')(spName(chosen), spName(q.species));
  }

  $('feedbackHint').textContent = spText(q.species, q.kind);
  $('feedbackFact').textContent = spText(q.species, 'fakta');
  const fb = $('feedback');
  fb.classList.toggle('was-wrong', !correct);
  fb.hidden = false;
  fb.scrollIntoView({ behavior: 'smooth', block: 'center' });
  $('score').textContent = S.score;
}

$('nextBtn').addEventListener('click', () => {
  if (!S.answered) return;
  sfx.click();
  if (S.qIndex < S.questions.length - 1) {
    S.qIndex += 1;
    renderQuestion();
  } else {
    showResult();
  }
});

/* ------------------- result ------------------- */

function showResult(quiet) {
  $('finalScore').textContent = S.score;
  $('statCorrect').textContent = S.correctCount;
  $('statCorrect').nextElementSibling.textContent = T('correctOf')(S.questions.length);
  $('statStreak').textContent = S.bestStreak;

  let sub, kicker;
  const c = S.correctCount;
  if (c === 10) { kicker = T('kick10'); sub = T('sub10'); }
  else if (c >= 8) { kicker = T('kick8'); sub = T('sub8'); }
  else if (c >= 5) { kicker = T('kick5'); sub = T('sub5'); }
  else if (c >= 3) { kicker = T('kick3'); sub = T('sub3'); }
  else { kicker = T('kick0'); sub = T('sub0'); }
  $('resultKicker').textContent = kicker;
  $('resultSub').textContent = sub;

  const missedBox = $('resultMissed');
  missedBox.innerHTML = '';
  if (S.missed.length) {
    const label = document.createElement('p');
    label.style.cssText = 'width:100%;font-size:0.8rem;color:var(--muted);margin-bottom:0.5rem;';
    label.textContent = T('missedLabel');
    missedBox.appendChild(label);
    S.missed.forEach(sp => {
      const chip = document.createElement('span');
      chip.className = 'missed-chip';
      const img = document.createElement('img');
      img.src = sp.imgs.blade[0];
      img.alt = '';
      img.loading = 'lazy';
      const t = document.createElement('span');
      t.textContent = spName(sp);
      chip.append(img, t);
      missedBox.appendChild(chip);
    });
  }
  if (!quiet) sfx.finish();
  show('result');
}

$('againBtn').addEventListener('click', () => { ensureAudio(); sfx.click(); startQuiz(); });

/* ------------------- artsliste: søgning, filtre, grupper og visninger ------------------- */

const HYPPIGHED_ORDER = ['Meget almindelig', 'Almindelig', 'Hist og her', 'Sjælden'];
const STATUS_ORDER = ['EN', 'CR', 'VU', 'NT', 'NE', 'LC'];
const BLADFORM_ORDER = ['Nåle', 'Finnet', 'Helrandet', 'Lappet', 'Savtakket'];
const LEVEL_ORDER = ['nem', 'mellem', 'svær'];
const MINE_ORDER = ['often', 'some', 'good', 'new'];
let currentSort = 'default';

const LIST = {
  q: '',
  filters: { bladform: new Set(), hyppighed: new Set(), status: new Set(), level: new Set(), arr: new Set(), habit: new Set(), fruit: new Set(), habitat: new Set(), family: new Set() },
  compact: false,
  collapsed: new Set(),
  expanded: new Set(),
  ctrlLang: null,
};
try { LIST.compact = localStorage.getItem('tq-compact') === '1'; } catch (e) { /* ingen lager */ }

/* personlig statistik — gemmes kun i denne browser */
const STATS_KEY = 'tq-stats';
function loadStats() {
  try { return JSON.parse(localStorage.getItem(STATS_KEY)) || {}; } catch (e) { return {}; }
}
function recordAnswer(id, correct) {
  const st = loadStats();
  const r = st[id] || { seen: 0, wrong: 0 };
  r.seen += 1;
  if (!correct) r.wrong += 1;
  st[id] = r;
  try { localStorage.setItem(STATS_KEY, JSON.stringify(st)); } catch (e) { /* ignorer */ }
}
function mastery(sp, st) {
  const r = st[sp.id];
  if (!r || !r.seen) return 'new';
  const rate = r.wrong / r.seen;
  if (rate >= 0.34) return 'often';
  if (rate > 0) return 'some';
  return 'good';
}

const cmpName = (a, b) => sortName(a).localeCompare(sortName(b), LANG === 'da' ? 'da' : 'en');
const FILTER_DIMS = [
  { key: 'bladform', order: BLADFORM_ORDER, label: () => T('filterBladform'), val: v => T('bladformChip')[v] || v },
  { key: 'hyppighed', order: HYPPIGHED_ORDER, label: () => T('filterHyppighed'), val: v => T('hyppighed')[v] || v },
  { key: 'status', order: STATUS_ORDER, label: () => T('filterStatus'), val: v => `${T('status')[v] || v} · ${v}` },
  { key: 'level', order: LEVEL_ORDER, label: () => T('filterLevel'), val: v => T('levelName')[v] || v },
  { key: 'arr', order: ['modsat', 'spredt', 'naale'], label: () => T('filterArr'), val: v => T('arrVals')[v] || v },
  { key: 'habit', order: ['traa', 'busk'], label: () => T('filterHabit'), val: v => T('habitVals')[v] || v },
  { key: 'fruit', order: ['noed', 'vinget', 'kogle', 'baer', 'kernefrugt', 'kapsel'], label: () => T('filterFruit'), val: v => T('fruitVals')[v] || v },
  { key: 'habitat', order: ['skov', 'bryn', 'vaad', 'toer'], label: () => T('filterHabitat'), val: v => T('habitatVals')[v] || v },
  { key: 'family', label: () => T('filterFamily'), val: v => `${T('familyVals')[v] || v} · ${v}`,
    order: () => [...new Set(SPECIES.map(s => s.family))].sort((a, b) => (T('familyVals')[a] || a).localeCompare(T('familyVals')[b] || b, LANG === 'da' ? 'da' : 'en')) },
];
const dimOrder = d => (typeof d.order === 'function' ? d.order() : d.order);
const hasVal = (sp, key, v) => [].concat(sp[key]).includes(v);

const SORTS = ['default', 'hyppighed', 'status', 'bladform', 'arr', 'habit', 'fruit', 'family', 'habitat', 'lookalike', 'mine', 'now'];
const SORT_LABEL_KEY = { default: 'sortDefault', hyppighed: 'sortHyppighed', status: 'sortStatus', bladform: 'sortBladform', arr: 'sortArr', habit: 'sortHabit', fruit: 'sortFruit', family: 'sortFamily', habitat: 'sortHabitat', lookalike: 'sortLookalike', mine: 'sortMine', now: 'sortNow' };

/* måneder som korte intervaller, fx "sep.–okt." eller "okt.–mar." */
function formatMonths(ms) {
  if (!ms || !ms.length) return '';
  if (ms.length >= 12) return T('allYear');
  const on = m => ms.includes(((m - 1 + 12) % 12) + 1);
  const names = T('months');
  const runs = [];
  for (let m = 1; m <= 12; m++) {
    if (on(m) && !on(m - 1)) {
      let e = m;
      while (on(e + 1)) e++;
      const end = ((e - 1) % 12) + 1;
      runs.push(end === m ? names[m - 1] : `${names[m - 1]}–${names[end - 1]}`);
    }
  }
  return runs.join(', ');
}

function matches(sp) {
  const q = LIST.q.trim().toLowerCase();
  if (q && ![sp.dk, sp.en, sp.latin].some(n => (n || '').toLowerCase().includes(q))) return false;
  return FILTER_DIMS.every(d => !LIST.filters[d.key].size || [].concat(sp[d.key]).some(v => LIST.filters[d.key].has(v)));
}
const activeFilterCount = () => FILTER_DIMS.reduce((n, d) => n + LIST.filters[d.key].size, 0);

function buildGroups(list) {
  if (currentSort === 'default') return [{ key: 'all', label: null, items: list }];

  if (currentSort === 'lookalike') {
    const ids = new Set(list.map(s => s.id));
    const seen = new Set();
    const groups = [];
    list.forEach(a => (a.lookalikes || []).forEach(bid => {
      if (!ids.has(bid)) return;
      const key = [a.id, bid].sort().join('|');
      if (seen.has(key)) return;
      seen.add(key);
      const b = SPECIES.find(s => s.id === bid);
      const pair = [a, b].sort(cmpName);
      groups.push({ key, label: `${spName(pair[0])} ↔ ${spName(pair[1])}`, items: pair, showCount: false });
    }));
    return groups.sort((x, y) => x.label.localeCompare(y.label, LANG === 'da' ? 'da' : 'en'));
  }

  if (currentSort === 'mine') {
    const st = loadStats();
    const rate = sp => { const r = st[sp.id]; return r && r.seen ? r.wrong / r.seen : 0; };
    return MINE_ORDER.map(k => ({
      key: k,
      label: T('mineGroups')[k],
      items: list.filter(sp => mastery(sp, st) === k).sort((a, b) => rate(b) - rate(a) || cmpName(a, b)),
    })).filter(g => g.items.length);
  }

  if (currentSort === 'now') {
    const m = new Date().getMonth() + 1;
    const mName = T('monthsLong')[m - 1];
    const fl = list.filter(sp => (sp.fl || []).includes(m)).sort(cmpName);
    const fr = list.filter(sp => (sp.fr || []).includes(m)).sort(cmpName);
    const none = list.filter(sp => !fl.includes(sp) && !fr.includes(sp)).sort(cmpName);
    return [
      { key: 'flower', label: T('nowGroups').flower(mName), items: fl },
      { key: 'fruit', label: T('nowGroups').fruit(mName), items: fr },
      { key: 'none', label: T('nowGroups').none(mName), items: none },
    ].filter(g => g.items.length);
  }

  const dim = FILTER_DIMS.find(d => d.key === currentSort);
  return dimOrder(dim).map(v => ({
    key: v,
    label: dim.val(v),
    items: list.filter(sp => hasVal(sp, dim.key, v)).sort(cmpName),
  })).filter(g => g.items.length);
}

function ensureListControls(force) {
  if (!force && LIST.ctrlLang === LANG) return;
  LIST.ctrlLang = LANG;
  const box = $('listControls');
  box.innerHTML = `
    <input type="search" class="list-search" id="listSearch" autocomplete="off">
    <details class="list-filters" id="listFilters">
      <summary id="filtersSummary"></summary>
      <div class="filter-dims"></div>
    </details>
    <div class="list-toolbar">
      <span class="list-count" id="listCount"></span>
      <button class="linklike" id="clearFilters"></button>
      <span class="toolbar-spacer"></span>
      <button class="sort-btn" id="viewToggle"></button>
      <button class="sort-btn quiz-shown" id="quizShownBtn"></button>
    </div>
    <p class="list-note" id="mineNote" hidden></p>`;

  const search = $('listSearch');
  search.placeholder = T('searchPh');
  search.setAttribute('aria-label', T('searchPh'));
  search.value = LIST.q;
  search.addEventListener('input', () => { LIST.q = search.value; renderGroups(); });

  const dims = box.querySelector('.filter-dims');
  FILTER_DIMS.forEach(d => {
    const present = dimOrder(d).filter(v => SPECIES.some(sp => hasVal(sp, d.key, v)));
    const row = document.createElement('div');
    row.className = 'filter-dim';
    row.innerHTML = `<span class="filter-dim-label">${d.label()}</span><div class="filter-chips"></div>`;
    const chips = row.querySelector('.filter-chips');
    present.forEach(v => {
      const b = document.createElement('button');
      b.className = 'filter-chip';
      b.textContent = d.val(v);
      const sync = () => {
        const on = LIST.filters[d.key].has(v);
        b.classList.toggle('on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      };
      sync();
      b.addEventListener('click', () => {
        const set = LIST.filters[d.key];
        set.has(v) ? set.delete(v) : set.add(v);
        sync(); sfx.click(); renderGroups();
      });
      chips.appendChild(b);
    });
    dims.appendChild(row);
  });

  $('clearFilters').textContent = T('clearFilters');
  $('clearFilters').addEventListener('click', () => {
    LIST.q = ''; search.value = '';
    FILTER_DIMS.forEach(d => LIST.filters[d.key].clear());
    sfx.click(); ensureListControls(true); renderGroups();
  });
  $('viewToggle').addEventListener('click', () => {
    LIST.compact = !LIST.compact;
    LIST.expanded.clear();
    try { localStorage.setItem('tq-compact', LIST.compact ? '1' : '0'); } catch (e) { /* ignorer */ }
    sfx.click(); renderGroups();
  });
  $('quizShownBtn').textContent = T('quizShown');
  $('quizShownBtn').addEventListener('click', () => quizFromList(SPECIES.filter(matches)));
}

function quizFromList(items) {
  if (items.length < 2) return;
  ensureAudio(); sfx.click();
  S.customPool = items.map(s => s.id);
  startQuiz();
}

function renderList() {
  const sel = $('sortSelect');
  sel.innerHTML = SORTS.map(k => `<option value="${k}"${k === currentSort ? ' selected' : ''}>${T(SORT_LABEL_KEY[k])}</option>`).join('');
  sel.onchange = () => { currentSort = sel.value; sfx.click(); renderGroups(); };
  ensureListControls();
  renderGroups();
  if (SHEET.open) renderSheet();
}

function renderGroups() {
  const wrap = $('speciesGrid');
  wrap.innerHTML = '';
  const list = SPECIES.filter(matches);
  const nf = activeFilterCount();

  $('filtersSummary').textContent = T('filtersLabel')(nf);
  $('listCount').textContent = T('listCount')(list.length, SPECIES.length);
  $('clearFilters').hidden = !nf && !LIST.q;
  $('viewToggle').textContent = LIST.compact ? T('viewCards') : T('viewCompact');
  $('quizShownBtn').disabled = list.length < 2;
  $('mineNote').hidden = currentSort !== 'mine' && currentSort !== 'now';
  $('mineNote').textContent = currentSort === 'now' ? T('nowNote') : T('mineNote');

  if (!list.length) {
    wrap.innerHTML = `<p class="list-empty">${T('listEmpty')}</p>`;
    return;
  }

  const groups = buildGroups(list);
  if (!groups.length) {
    wrap.innerHTML = `<p class="list-empty">${T('listEmpty')}</p>`;
    return;
  }

  groups.forEach(g => {
    const sec = document.createElement('section');
    sec.className = 'species-group';
    const gid = currentSort + ':' + g.key;

    if (g.label) {
      const head = document.createElement('div');
      head.className = 'species-group-head';
      const toggle = document.createElement('button');
      toggle.className = 'group-toggle';
      const title = g.showCount === false ? g.label : `${g.label} (${g.items.length})`;
      const setState = () => {
        const c = LIST.collapsed.has(gid);
        sec.classList.toggle('collapsed', c);
        toggle.setAttribute('aria-expanded', c ? 'false' : 'true');
        toggle.innerHTML = `<span class="group-caret" aria-hidden="true">${c ? '▸' : '▾'}</span>`;
        const t = document.createElement('span');
        t.textContent = title;
        toggle.appendChild(t);
      };
      toggle.addEventListener('click', () => {
        LIST.collapsed.has(gid) ? LIST.collapsed.delete(gid) : LIST.collapsed.add(gid);
        sfx.click(); setState();
      });
      head.appendChild(toggle);
      if (g.items.length >= 2) {
        const qb = document.createElement('button');
        qb.className = 'group-quiz';
        qb.textContent = T('quizThese');
        qb.addEventListener('click', () => quizFromList(g.items));
        head.appendChild(qb);
      }
      sec.appendChild(head);
      setState();
    }

    const grid = document.createElement('div');
    grid.className = 'species-grid' + (LIST.compact ? ' compact' : '');
    g.items.forEach(sp => {
      grid.appendChild(LIST.compact ? makeRow(sp, g.items) : makeCard(sp, g.items));
    });
    sec.appendChild(grid);
    wrap.appendChild(sec);
  });
}

function makeRow(sp, seq) {
  const row = document.createElement('button');
  row.className = 'species-row';
  const thumb = (sp.imgs.blade || [])[0] || '';
  row.innerHTML = `
    <img src="${thumb}" alt="" loading="lazy">
    <span class="row-text">
      <span class="species-name">${spName(sp)}</span>
      <span class="species-latin">${sp.latin}</span>
    </span>
    <span class="row-chips">
      <span class="chip chip-status-${sp.status}">${sp.status}</span>
      <span class="chip">${T('bladformChip')[sp.bladform] || sp.bladform}</span>
    </span>`;
  row.addEventListener('click', () => openSheet(sp, seq));
  return row;
}

const isScanUrl = u => /herbarium|illustration|handbook/i.test(u);

/* kort i gitteret: et overblik — hele arten åbnes i et ark */
function makeCard(sp, seq) {
  const card = document.createElement('article');
  card.className = 'species-card preview';
  card.tabIndex = 0;
  card.setAttribute('role', 'button');
  card.setAttribute('aria-label', T('openSpecies')(spName(sp)));
  const img = (sp.imgs.blade || [])[0] || KINDS.map(k => (sp.imgs[k] || [])[0]).find(Boolean) || '';
  card.innerHTML = `
    <div class="card-photo${isScanUrl(img) ? ' contain' : ''}"><img src="${img}" alt="" loading="lazy"></div>
    <div class="species-body">
      <div class="species-title-row">
        <span class="species-name">${spName(sp)}</span>
        <span class="level-badge level-${sp.level}">${T('levelName')[sp.level] || sp.level}</span>
      </div>
      <span class="species-latin">${sp.latin}</span>
      <div class="prop-chips">
        <span class="chip chip-status-${sp.status}">${sp.status} · ${T('status')[sp.status] || ''}</span>
        <span class="chip">${T('hyppighed')[sp.hyppighed] || sp.hyppighed}</span>
        <span class="chip">${T('bladformChip')[sp.bladform] || sp.bladform}</span>
      </div>
      <p class="species-fact clamp">${spText(sp, 'blade')}</p>
      <span class="card-more">${T('cardMore')} →</span>
    </div>`;
  const open = () => openSheet(sp, seq);
  card.addEventListener('click', open);
  card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  return card;
}

/* ------------------- artsark: hele arten på én skærm ------------------- */

const SHEET = { seq: [], idx: 0, kind: 'blade', imgIdx: 0, open: false };

function openSheet(sp, seq) {
  ensureAudio(); sfx.click();
  SHEET.seq = seq && seq.length ? seq : [sp];
  SHEET.idx = Math.max(0, SHEET.seq.indexOf(sp));
  SHEET.kind = KINDS.find(k => (sp.imgs[k] || []).length) || 'blade';
  SHEET.imgIdx = 0;
  SHEET.open = true;
  $('sheet').hidden = false;
  document.body.classList.add('sheet-open');
  renderSheet();
  $('sheet').querySelector('.sheet-close').focus();
}

function closeSheet() {
  SHEET.open = false;
  $('sheet').hidden = true;
  document.body.classList.remove('sheet-open');
}

function sheetGo(delta) {
  const n = SHEET.seq.length;
  if (n < 2) return;
  SHEET.idx = (SHEET.idx + delta + n) % n;
  const sp = SHEET.seq[SHEET.idx];
  SHEET.kind = KINDS.find(k => (sp.imgs[k] || []).length) || 'blade';
  SHEET.imgIdx = 0;
  sfx.click();
  renderSheet();
  $('sheet').querySelector('.sheet-scroll').scrollTop = 0;
}

function photoGo(delta) {
  const sp = SHEET.seq[SHEET.idx];
  const n = (sp.imgs[SHEET.kind] || []).length;
  if (n < 2) return;
  SHEET.imgIdx = (SHEET.imgIdx + delta + n) % n;
  renderSheetPhoto();
}

function renderSheetPhoto() {
  const sp = SHEET.seq[SHEET.idx];
  const urls = sp.imgs[SHEET.kind] || [];
  const url = urls[SHEET.imgIdx] || '';
  const box = $('sheet').querySelector('.sheet-photo');
  box.classList.toggle('contain', isScanUrl(url));
  const img = box.querySelector('img');
  img.src = url;
  img.alt = T('slideAlt')(T('kind')[SHEET.kind], spName(sp));
  box.querySelector('.car-count').textContent = `${SHEET.imgIdx + 1}/${urls.length}`;
  box.querySelectorAll('.ph-btn').forEach(b => { b.hidden = urls.length < 2; });
  $('sheet').querySelectorAll('.photo-tab').forEach(t => {
    const on = t.dataset.kind === SHEET.kind;
    t.classList.toggle('on', on);
    t.setAttribute('aria-selected', on ? 'true' : 'false');
  });
}

function seasonStrip(sp) {
  const names = T('months');
  const cells = names.map((m, i) => {
    const fl = (sp.fl || []).includes(i + 1);
    const fr = (sp.fr || []).includes(i + 1);
    const now = new Date().getMonth() === i;
    return `<span class="season-cell${fl ? ' fl' : ''}${fr ? ' fr' : ''}${now ? ' now' : ''}" title="${T('monthsLong')[i]}">
      <span class="season-bar"></span><span class="season-m">${m.charAt(0).toUpperCase()}</span></span>`;
  }).join('');
  return `<div class="season" role="img" aria-label="${T('cardFlowers')}: ${formatMonths(sp.fl)}. ${T('cardFruits')}: ${formatMonths(sp.fr)}.">
      <div class="season-row">${cells}</div>
      <div class="season-legend">
        <span><i class="sw sw-fl"></i>${T('cardFlowers')}: ${formatMonths(sp.fl)}</span>
        <span><i class="sw sw-fr"></i>${T('cardFruits')}: ${formatMonths(sp.fr)}</span>
      </div>
    </div>`;
}

function renderSheet() {
  if (!SHEET.open) return;
  const sp = SHEET.seq[SHEET.idx];
  const D = DETAILS[sp.id] || {};
  const li = LANG === 'en' ? 1 : 0;
  const kindLabel = T('kind');
  const kinds = KINDS.filter(k => (sp.imgs[k] || []).length);
  const st = loadStats()[sp.id];

  const facts = [
    [T('filterFamily'), `${T('familyVals')[sp.family] || sp.family} <i>${sp.family}</i>`],
    [T('filterArr'), T('arrVals')[sp.arr]],
    [T('filterHabit'), T('habitVals')[sp.habit]],
    [T('filterBladform'), T('bladformChip')[sp.bladform] || sp.bladform],
    [T('filterFruit'), T('fruitVals')[sp.fruit]],
    [T('filterHyppighed'), T('hyppighed')[sp.hyppighed] || sp.hyppighed],
    [T('filterStatus'), `<span class="chip chip-status-${sp.status}">${sp.status} · ${T('status')[sp.status] || ''}</span>`],
    [T('filterHabitat'), (sp.habitat || []).map(h => T('habitatVals')[h]).join(', ')],
  ].filter(f => f[1]);

  const sections = [
    [kindLabel.blade, spText(sp, 'blade')],
    [kindLabel.bark, spText(sp, 'bark')],
    [kindLabel.blomst, (sp.imgs.blomst || []).length || sp.blomst ? spText(sp, 'blomst') : ''],
    [kindLabel.frugt, (sp.imgs.frugt || []).length || sp.frugt ? spText(sp, 'frugt') : ''],
    [T('secWinter'), D.winter ? D.winter[li] : ''],
    [T('secDist'), D.dist ? D.dist[li] : ''],
    [T('factTag'), spText(sp, 'fakta')],
  ].filter(s => s[1]);

  const looks = (sp.lookalikes || []).map(id => SPECIES.find(s => s.id === id)).filter(Boolean);
  const pairText = other => {
    const d = PAIR_DIFF[[sp.id, other.id].sort().join('|')];
    return d ? d[li] : spText(other, 'blade');
  };

  const nbUrl = D.nb ? `https://www.naturbasen.dk/${D.nb}` : `https://www.naturbasen.dk/artsoegning?id=${encodeURIComponent(sp.latin)}&at=start`;
  const wikiUrl = `https://da.wikipedia.org/w/index.php?search=${encodeURIComponent(sp.latin)}`;

  const panel = $('sheet').querySelector('.sheet-panel');
  panel.innerHTML = `
    <div class="sheet-top">
      <button class="sheet-nav" data-go="-1" aria-label="${T('sheetPrev')}" ${SHEET.seq.length < 2 ? 'hidden' : ''}>‹</button>
      <span class="sheet-pos">${SHEET.seq.length > 1 ? `${SHEET.idx + 1} / ${SHEET.seq.length}` : ''}</span>
      <button class="sheet-nav" data-go="1" aria-label="${T('sheetNext')}" ${SHEET.seq.length < 2 ? 'hidden' : ''}>›</button>
      <span class="toolbar-spacer"></span>
      <button class="sheet-close" aria-label="${T('sheetClose')}">✕</button>
    </div>
    <div class="sheet-scroll">
      <header class="sheet-head">
        <div class="species-title-row">
          <h2 class="sheet-name">${spName(sp)}</h2>
          <span class="level-badge level-${sp.level}">${T('levelName')[sp.level] || sp.level}</span>
        </div>
        <span class="species-latin">${sp.latin}</span>
      </header>

      <div class="sheet-photo">
        <img alt="">
        <button class="ph-btn ph-prev" aria-label="${T('carPrev')}">‹</button>
        <button class="ph-btn ph-next" aria-label="${T('carNext')}">›</button>
        <span class="car-count"></span>
      </div>
      <div class="photo-tabs" role="tablist">
        ${kinds.map(k => `<button class="photo-tab" role="tab" data-kind="${k}">${kindLabel[k]} <span class="tab-n">${sp.imgs[k].length}</span></button>`).join('')}
      </div>

      <dl class="facts">${facts.map(f => `<div class="fact"><dt>${f[0]}</dt><dd>${f[1]}</dd></div>`).join('')}</dl>

      ${seasonStrip(sp)}

      ${D.native ? `<div class="native-note"><strong>${T('secNative')}:</strong> ${D.native[li]}</div>` : ''}

      ${sections.map(s => `<section class="sheet-sec"><h3>${s[0]}</h3><p>${s[1]}</p></section>`).join('')}

      ${looks.length ? `<section class="sheet-sec">
        <h3>${T('secLook')}</h3>
        <div class="look-list">
          ${looks.map(o => `<button class="look-item" data-id="${o.id}">
              <img src="${(o.imgs.blade || [])[0] || ''}" alt="" loading="lazy">
              <span><strong>${spName(o)}</strong><span class="look-diff">${pairText(o)}</span></span>
            </button>`).join('')}
        </div>
      </section>` : ''}

      <section class="sheet-sec sheet-stats">
        <h3>${T('secStats')}</h3>
        <p>${st && st.seen ? T('statsLine')(st.seen - st.wrong, st.seen) : T('statsNone')}</p>
        <button class="btn-primary sheet-quiz">${T('quizSpecies')}</button>
      </section>

      <section class="sheet-sec sheet-sources">
        <h3>${T('secSources')}</h3>
        <p><a href="${nbUrl}" target="_blank" rel="noopener">Naturbasen</a> · <a href="${wikiUrl}" target="_blank" rel="noopener">Wikipedia (dansk)</a></p>
      </section>
    </div>`;

  panel.querySelector('.sheet-close').addEventListener('click', () => { sfx.click(); closeSheet(); });
  panel.querySelectorAll('.sheet-nav').forEach(b => b.addEventListener('click', () => sheetGo(+b.dataset.go)));
  panel.querySelector('.ph-prev').addEventListener('click', () => photoGo(-1));
  panel.querySelector('.ph-next').addEventListener('click', () => photoGo(1));
  panel.querySelectorAll('.photo-tab').forEach(t => t.addEventListener('click', () => {
    SHEET.kind = t.dataset.kind; SHEET.imgIdx = 0; sfx.click(); renderSheetPhoto();
  }));
  panel.querySelectorAll('.look-item').forEach(b => b.addEventListener('click', () => {
    const o = SPECIES.find(s => s.id === b.dataset.id);
    const inSeq = SHEET.seq.indexOf(o);
    if (inSeq >= 0) { SHEET.idx = inSeq; } else { SHEET.seq = [o]; SHEET.idx = 0; }
    SHEET.kind = KINDS.find(k => (o.imgs[k] || []).length) || 'blade';
    SHEET.imgIdx = 0;
    sfx.click(); renderSheet();
    $('sheet').querySelector('.sheet-scroll').scrollTop = 0;
  }));
  panel.querySelector('.sheet-quiz').addEventListener('click', () => {
    let pool = [sp, ...looks];
    if (pool.length < 4) {
      const extra = shuffle(SPECIES.filter(s => !pool.includes(s) && s.level === sp.level)).slice(0, 4 - pool.length);
      pool = pool.concat(extra);
    }
    closeSheet();
    quizFromList(pool);
  });

  // swipe: på billedet skifter det billede, ellers art
  const scroller = panel.querySelector('.sheet-scroll');
  let sx = 0, sy = 0, onPhoto = false;
  scroller.addEventListener('touchstart', e => {
    const t = e.touches[0]; sx = t.clientX; sy = t.clientY;
    onPhoto = !!e.target.closest('.sheet-photo');
  }, { passive: true });
  scroller.addEventListener('touchend', e => {
    const t = e.changedTouches[0];
    const dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (onPhoto) photoGo(dx < 0 ? 1 : -1);
    else sheetGo(dx < 0 ? 1 : -1);
  }, { passive: true });

  renderSheetPhoto();
}

document.addEventListener('keydown', e => {
  if (!SHEET.open) return;
  if (e.key === 'Escape') closeSheet();
  else if (e.key === 'ArrowRight') sheetGo(1);
  else if (e.key === 'ArrowLeft') sheetGo(-1);
});
$('sheet').addEventListener('click', e => { if (e.target.id === 'sheet') closeSheet(); });


/* ------------------- guide: lær at kende træerne ------------------- */

function renderLearn() {
  const L = LEARN[LANG];
  $('learnTitle').textContent = L.title;
  $('learnIntro').textContent = L.intro;

  // fem trin
  const steps = $('learnSteps');
  steps.innerHTML = '';
  const stepsHead = document.createElement('h3');
  stepsHead.className = 'learn-h3';
  stepsHead.textContent = L.stepsTitle;
  steps.appendChild(stepsHead);
  L.steps.forEach((st, i) => {
    const el = document.createElement('div');
    el.className = 'learn-step';
    el.innerHTML = `<span class="learn-step-num">${i + 1}</span>
      <div><strong>${st.head}</strong> <span>${st.text}</span></div>`;
    steps.appendChild(el);
  });

  // afsnit med billeder
  const body = $('learnBody');
  body.innerHTML = '';
  L.sections.forEach(sec => {
    const wrap = document.createElement('section');
    wrap.className = 'learn-section';
    const h = document.createElement('h3');
    h.className = 'learn-h3';
    h.textContent = sec.title;
    wrap.appendChild(h);
    sec.paras.forEach(p => {
      const el = document.createElement('p');
      el.className = 'learn-p';
      el.textContent = p;
      wrap.appendChild(el);
    });
    if (sec.imgs && sec.imgs.length) {
      const grid = document.createElement('div');
      grid.className = 'learn-imgs';
      sec.imgs.forEach(im => {
        const sp = SPECIES.find(s => s.id === im.sp);
        if (!sp || !(sp.imgs[im.kind] || []).length) return;
        const url = sp.imgs[im.kind][0];
        const fig = document.createElement('figure');
        fig.className = 'learn-img' + (isScanUrl(url) ? ' contain' : '');
        fig.innerHTML = `<img src="${url}" alt="${im.caption}" loading="lazy">
          <figcaption>${im.caption}</figcaption>`;
        grid.appendChild(fig);
      });
      if (grid.children.length) wrap.appendChild(grid);
    }
    body.appendChild(wrap);
  });

  // forvekslinger
  const la = document.createElement('section');
  la.className = 'learn-section';
  const laHead = document.createElement('h3');
  laHead.className = 'learn-h3';
  laHead.textContent = L.lookalikesTitle;
  la.appendChild(laHead);
  const laIntro = document.createElement('p');
  laIntro.className = 'learn-p';
  laIntro.textContent = L.lookalikesIntro;
  la.appendChild(laIntro);
  const laGrid = document.createElement('div');
  laGrid.className = 'lookalike-grid';
  L.lookalikes.forEach(pair => {
    const card = document.createElement('div');
    card.className = 'lookalike-card';
    card.innerHTML = `<div class="lookalike-names">${pair.a} <span class="vs">↔</span> ${pair.b}</div>
      <p>${pair.text}</p>`;
    laGrid.appendChild(card);
  });
  la.appendChild(laGrid);
  body.appendChild(la);

  // CTA
  const cta = $('learnCta');
  cta.innerHTML = '';
  const ctaIn = document.createElement('div');
  ctaIn.className = 'learn-cta-card';
  const ctaH = document.createElement('h3');
  ctaH.textContent = L.ctaTitle;
  const ctaP = document.createElement('p');
  ctaP.textContent = L.ctaText;
  const ctaBtns = document.createElement('div');
  ctaBtns.className = 'result-actions';
  const b1 = document.createElement('button');
  b1.className = 'btn-primary';
  b1.textContent = L.ctaBtn;
  b1.addEventListener('click', () => { ensureAudio(); sfx.click(); show('start'); });
  const b2 = document.createElement('button');
  b2.className = 'btn-ghost';
  b2.textContent = L.ctaList;
  b2.addEventListener('click', () => { ensureAudio(); sfx.click(); show('list'); });
  ctaBtns.append(b1, b2);
  ctaIn.append(ctaH, ctaP, ctaBtns);
  cta.appendChild(ctaIn);
}

/* ------------------- keyboard ------------------- */

document.addEventListener('keydown', e => {
  if (S.screen !== 'quiz') return;
  if (['1', '2', '3', '4'].includes(e.key) && !S.answered) {
    answer(Number(e.key) - 1);
  } else if ((e.key === 'Enter' || e.key === ' ') && S.answered) {
    e.preventDefault();
    $('nextBtn').click();
  }
});

/* ------------------- init ------------------- */

applyLang();
