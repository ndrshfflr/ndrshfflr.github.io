/* Dyrequiz-motor (fra TræQuiz) — bruges af PattedyrQuiz og FlagermusQuiz.
   Hver quiz leverer QUIZ (opsætning og tekster), SPECIES, PAIR_DIFF og LEARN i sine egne datafiler. */

/* ------------------- i18n ------------------- */

const I18N = {
  da: {
    brandAria: 'Tilbage til forsiden',
    navQuiz: 'Quiz', navList: 'Artsliste', navGuide: 'Guide',
    langAria: 'Switch to English', langTitle: 'Dansk / English',
    muteAria: 'Slå lyd til eller fra', muteTitle: 'Lyd til/fra',
    setupWhat: 'Hvilke dyr vil du øve dig på?',
    setupLevel: 'Sværhedsgrad',
    groupAria: 'Dyregruppe', levelAria: 'Sværhedsgrad',
    groupAll: 'Alle', groupAllDesc: n => `Alle ${n} arter`,
    groupDesc: n => `${n} arter`,
    levelNem: 'Nem', levelNemDesc: n => `${n} almindelige arter`,
    levelMellem: 'Mellem', levelMellemDesc: n => `${n} lidt sværere`,
    levelSvaer: 'Svær', levelSvaerDesc: n => `${n} for kendere`,
    levelAlle: n => `Alle ${n}`, levelAlleDesc: 'Blanding af alt',
    startBtn: n => `Start quizzen · ${n} spørgsmål`,
    tip: 'Tip: Brug tastaturgenveje 1-4 for at svare og Enter for at gå videre.',
    qLabel: 'Spørgsmål', pointsLabel: 'Points', streakTxt: 'i træk',
    imgAlt: 'Hvilken art er dette?',
    factTag: 'Vidste du',
    next: 'Næste', seeResult: 'Se resultat',
    resultKicker: 'Runden er slut', pointsWord: 'points',
    statStreakLabel: 'bedste streak',
    again: 'Prøv igen', changeSettings: 'Skift indstillinger', seeList: 'Se artslisten',
    missedLabel: 'Til næste gang:',
    sortAria: 'Gruppér artslisten', sortLabel: 'Gruppér efter:',
    sortDefault: 'Standard', sortMine: 'Svære for mig', sortLookalike: 'Forvekslinger', sortNow: 'Lige nu: dvale og parring',
    cardMore: 'Se alt om arten', openSpecies: n => `Åbn ${n}`,
    sheetClose: 'Luk', sheetPrev: 'Forrige art', sheetNext: 'Næste art',
    secKeys: 'Kendetegn', secDist: 'Udbredelse i Danmark',
    secLook: 'Kan forveksles med', secStats: 'Dine svar', secSources: 'Læs mere',
    statsLine: (r, n) => `Du har svaret rigtigt ${r} af ${n} gange.`, statsNone: 'Du har ikke øvet denne art endnu.',
    quizSpecies: 'Quiz denne art og dens forvekslinger',
    filterGroup: 'Gruppe', filterFamily: 'Familie', filterLevel: 'Sværhedsgrad', filterHyp: 'Almindelighed',
    filterOcc: 'Forekomst', filterSize: 'Størrelse', filterHabitat: 'Levested', filterActivity: 'Aktiv',
    factSize: 'Størrelse',
    months: ['jan.', 'feb.', 'mar.', 'apr.', 'maj', 'jun.', 'jul.', 'aug.', 'sep.', 'okt.', 'nov.', 'dec.'],
    monthsLong: ['januar', 'februar', 'marts', 'april', 'maj', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'december'],
    allYear: 'hele året', none: '—',
    nowGroups: { dv: m => `I dvale i ${m}`, pa: m => `Parring eller brunst i ${m}`, act: m => `Aktive i ${m}` },
    nowNote: 'Månederne er omtrentlige for Danmark og afhænger af vejret og af det enkelte dyr.',
    seasonDv: 'Dvale', seasonPa: 'Parring/brunst', seasonAct: 'Aktiv hele året',
    searchPh: 'Søg efter art (også latin)',
    filtersLabel: n => n ? `Filtre (${n})` : 'Filtre',
    clearFilters: 'Nulstil', listEmpty: 'Ingen arter passer til din søgning.',
    listCount: (n, t) => n === t ? `${t} arter` : `${n} af ${t} arter`,
    viewCompact: 'Kompakt liste', viewCards: 'Store kort',
    quizShown: 'Quiz de viste arter', quizThese: 'Quiz disse',
    mineGroups: { often: 'Ofte forkert', some: 'Af og til forkert', good: 'Har styr på', new: 'Ikke øvet endnu' },
    mineNote: 'Grupperne bygger på dine svar i quizzen på denne enhed.',
    correctOf: n => `rigtige af ${n}`,
    levelName: { nem: 'nem', mellem: 'mellem', svær: 'svær' },
    hyp: { 'meget-alm': 'Meget almindelig', alm: 'Almindelig', hist: 'Hist og her', sjaelden: 'Sjælden', 'meget-sjaelden': 'Meget sjælden' },
    loading: 'Henter billede …',
    loadFail: 'Billedet kunne ikke hentes — prøv igen om lidt.',
    correctHead: (p, bonus) => 'Rigtigt!' + (bonus ? ` +${p} points (streak-bonus!)` : ` +${p} points`),
    wrongHead: (chosen, right) => `Desværre — det var ${chosen}. Rigtigt svar: ${right}.`,
    kick10: 'Fuldt hus!', kick8: 'Stærkt gået', kick5: 'Godt på vej', kick3: 'Øvelse gør mester', kick0: 'Sådan begynder alle',
    sub8: 'En enkelt gennemgang af artslisten, og du er i top.',
    sub5: 'Halvvejs der. Prøv en runde mere — eller start på nem-niveau.',
    sub3: 'Kig artslisten igennem og mærk kendetegnene — så prøv igen.',
    sub0: 'Start med de nemme arter, og byg deropfra. Du bliver skarpere for hver runde.',
    carPrev: 'Forrige billede', carNext: 'Næste billede',
    photoBy: 'Foto', photoOf: (i, n) => `Foto ${i} af ${n}`,
    creditsTitle: 'Billedkreditering',
    creditsIntro: 'Alle fotos er fra Wikimedia Commons og bruges under de angivne licenser. Klik for at se originalen.',
    showCredits: 'Vis alle billedkrediteringer',
  },
  en: {
    brandAria: 'Back to the front page',
    navQuiz: 'Quiz', navList: 'Species list', navGuide: 'Guide',
    langAria: 'Skift til dansk', langTitle: 'Dansk / English',
    muteAria: 'Turn sound on or off', muteTitle: 'Sound on/off',
    setupWhat: 'Which animals do you want to practise?',
    setupLevel: 'Difficulty',
    groupAria: 'Animal group', levelAria: 'Difficulty',
    groupAll: 'All', groupAllDesc: n => `All ${n} species`,
    groupDesc: n => `${n} species`,
    levelNem: 'Easy', levelNemDesc: n => `${n} common species`,
    levelMellem: 'Medium', levelMellemDesc: n => `${n} a bit harder`,
    levelSvaer: 'Hard', levelSvaerDesc: n => `${n} for experts`,
    levelAlle: n => `All ${n}`, levelAlleDesc: 'A mix of everything',
    startBtn: n => `Start the quiz · ${n} questions`,
    tip: 'Tip: Use keyboard shortcuts 1-4 to answer and Enter to continue.',
    qLabel: 'Question', pointsLabel: 'Points', streakTxt: 'in a row',
    imgAlt: 'Which species is this?',
    factTag: 'Did you know',
    next: 'Next', seeResult: 'See results',
    resultKicker: 'Round finished', pointsWord: 'points',
    statStreakLabel: 'best streak',
    again: 'Try again', changeSettings: 'Change settings', seeList: 'See the species list',
    missedLabel: 'For next time:',
    sortAria: 'Group the species list', sortLabel: 'Group by:',
    sortDefault: 'Default', sortMine: 'Hard for me', sortLookalike: 'Look-alikes', sortNow: 'Right now: hibernation and mating',
    cardMore: 'See everything about it', openSpecies: n => `Open ${n}`,
    sheetClose: 'Close', sheetPrev: 'Previous species', sheetNext: 'Next species',
    secKeys: 'Key features', secDist: 'Distribution in Denmark',
    secLook: 'Can be confused with', secStats: 'Your answers', secSources: 'Read more',
    statsLine: (r, n) => `You have answered correctly ${r} of ${n} times.`, statsNone: 'You have not practised this species yet.',
    quizSpecies: 'Quiz this species and its look-alikes',
    filterGroup: 'Group', filterFamily: 'Family', filterLevel: 'Difficulty', filterHyp: 'Abundance',
    filterOcc: 'Occurrence', filterSize: 'Size', filterHabitat: 'Habitat', filterActivity: 'Active',
    factSize: 'Size',
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    monthsLong: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    allYear: 'all year', none: '—',
    nowGroups: { dv: m => `Hibernating in ${m}`, pa: m => `Mating or rutting in ${m}`, act: m => `Active in ${m}` },
    nowNote: 'Months are approximate for Denmark and depend on the weather and the individual animal.',
    seasonDv: 'Hibernation', seasonPa: 'Mating/rut', seasonAct: 'Active all year',
    searchPh: 'Search species (Latin too)',
    filtersLabel: n => n ? `Filters (${n})` : 'Filters',
    clearFilters: 'Clear', listEmpty: 'No species match your search.',
    listCount: (n, t) => n === t ? `${t} species` : `${n} of ${t} species`,
    viewCompact: 'Compact list', viewCards: 'Large cards',
    quizShown: 'Quiz the species shown', quizThese: 'Quiz these',
    mineGroups: { often: 'Often wrong', some: 'Sometimes wrong', good: 'Got it', new: 'Not practised yet' },
    mineNote: 'Groups are based on your quiz answers on this device.',
    correctOf: n => `correct out of ${n}`,
    levelName: { nem: 'easy', mellem: 'medium', svær: 'hard' },
    hyp: { 'meget-alm': 'Very common', alm: 'Common', hist: 'Scattered', sjaelden: 'Rare', 'meget-sjaelden': 'Very rare' },
    loading: 'Loading image …',
    loadFail: 'The image could not be loaded — please try again shortly.',
    correctHead: (p, bonus) => 'Correct!' + (bonus ? ` +${p} points (streak bonus!)` : ` +${p} points`),
    wrongHead: (chosen, right) => `Sorry — that was ${chosen}. Correct answer: ${right}.`,
    kick10: 'Perfect score!', kick8: 'Strong round', kick5: 'Getting there', kick3: 'Practice makes perfect', kick0: 'Everyone starts here',
    sub8: 'One pass through the species list and you will be at the top.',
    sub5: 'Halfway. Play another round — or start on the easy level.',
    sub3: 'Go through the species list and take in the key features — then try again.',
    sub0: 'Start with the easy species and build from there. You get sharper with every round.',
    carPrev: 'Previous image', carNext: 'Next image',
    photoBy: 'Photo', photoOf: (i, n) => `Photo ${i} of ${n}`,
    creditsTitle: 'Photo credits',
    creditsIntro: 'All photos are from Wikimedia Commons and are used under the licences shown. Click to see the original.',
    showCredits: 'Show all photo credits',
  },
};
// quizzens egne tekster lægges oven på de fælles
Object.assign(I18N.da, QUIZ.da);
Object.assign(I18N.en, QUIZ.en);

let LANG = 'da';
try { if (localStorage.getItem(QUIZ.key + '-lang') === 'en') LANG = 'en'; } catch (e) { /* intet lager */ }
const T = k => I18N[LANG][k];
const li = () => (LANG === 'en' ? 1 : 0);
const spName = sp => LANG === 'en' ? (sp.en || sp.dk) : sp.dk;
const sortName = spName;
const tx = v => Array.isArray(v) ? (v[li()] || v[0]) : (v || '');
const valLabel = (dim, v) => { const m = (QUIZ.vals[dim] || {})[v]; return m ? m[li()] : v; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const QN = 10;

/* ------------------- state ------------------- */

const S = {
  screen: 'start',
  group: 'alle',
  level: 'alle',
  customPool: null,
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

SPECIES.forEach(sp => {
  const ph = (typeof PHOTOS !== 'undefined' && PHOTOS[sp.id]) || sp.imgs || [];
  sp.imgs = ph.filter(im => im && im.url);
});
const LEVEL_COUNT = {};
SPECIES.forEach(s => { LEVEL_COUNT[s.level] = (LEVEL_COUNT[s.level] || 0) + 1; });
// små billeder til kort og lister: 500px-udgaven af Commons-miniaturen
const small = u => (u || '').replace('/960px-', '/500px-');
const firstImg = sp => small((sp.imgs[0] || {}).url);

const $ = id => document.getElementById(id);
const screens = {
  start: $('screen-start'),
  quiz: $('screen-quiz'),
  result: $('screen-result'),
  list: $('screen-list'),
  learn: $('screen-learn'),
};

/* ------------------- sprog ------------------- */

function buildGroupChoices() {
  const box = $('groupChoices');
  const opts = [{ key: 'alle', emoji: QUIZ.allEmoji || '🐾' }].concat(QUIZ.groups);
  box.innerHTML = '';
  opts.forEach(g => {
    const n = g.key === 'alle' ? SPECIES.length : SPECIES.filter(s => s.group === g.key).length;
    const b = document.createElement('button');
    b.className = 'choice' + (S.group === g.key ? ' is-selected' : '');
    b.dataset.choiceGroup = g.key;
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', S.group === g.key ? 'true' : 'false');
    b.innerHTML = `<span class="choice-emoji" aria-hidden="true">${g.emoji || ''}</span>
      <span class="choice-label">${g.key === 'alle' ? T('groupAll') : valLabel('group', g.key)}</span>
      <span class="choice-desc">${g.key === 'alle' ? T('groupAllDesc')(n) : T('groupDesc')(n)}</span>`;
    b.addEventListener('click', () => {
      ensureAudio(); sfx.click();
      S.group = g.key;
      box.querySelectorAll('.choice').forEach(x => {
        x.classList.toggle('is-selected', x === b);
        x.setAttribute('aria-checked', x === b ? 'true' : 'false');
      });
      updateLevelCounts();
    });
    box.appendChild(b);
  });
}

function groupPool() {
  return S.group === 'alle' ? SPECIES : SPECIES.filter(s => s.group === S.group);
}

function updateLevelCounts() {
  const gp = groupPool();
  const c = l => gp.filter(s => s.level === l).length;
  $('lvlAlle').textContent = T('levelAlle')(gp.length);
  $('lvlAlleDesc').textContent = T('levelAlleDesc');
  $('lvlNem').textContent = T('levelNem');
  $('lvlNemDesc').textContent = T('levelNemDesc')(c('nem'));
  $('lvlMellem').textContent = T('levelMellem');
  $('lvlMellemDesc').textContent = T('levelMellemDesc')(c('mellem'));
  $('lvlSvaer').textContent = T('levelSvaer');
  $('lvlSvaerDesc').textContent = T('levelSvaerDesc')(c('svær'));
  document.querySelectorAll('[data-choice-level]').forEach(b => {
    const l = b.dataset.choiceLevel;
    b.disabled = l !== 'alle' && c(l) < 2;
  });
  if (S.level !== 'alle' && c(S.level) < 2) selectLevel('alle');
  $('startBtn').textContent = T('startBtn')(Math.min(QN, currentPool().length));
}

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
  document.querySelectorAll('[data-i18n-alt]').forEach(el => { el.alt = T(el.dataset.i18nAlt); });
  buildGroupChoices();
  updateLevelCounts();
  if (S.screen === 'list') renderList();
  else if (S.screen === 'learn') renderLearn();
  else if (S.screen === 'quiz') refreshQuizTexts();
  else if (S.screen === 'result') showResult(true);
}

$('langBtn').addEventListener('click', () => {
  LANG = LANG === 'da' ? 'en' : 'da';
  try { localStorage.setItem(QUIZ.key + '-lang', LANG); } catch (e) { /* ignorer */ }
  ensureAudio(); sfx.click();
  applyLang();
});

/* ------------------- audio ------------------- */

function ensureAudio() {
  if (!S.audioCtx) {
    try { S.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* ingen lyd */ }
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

function selectLevel(l) {
  S.level = l;
  document.querySelectorAll('[data-choice-level]').forEach(b => {
    const on = b.dataset.choiceLevel === l;
    b.classList.toggle('is-selected', on);
    b.setAttribute('aria-checked', on ? 'true' : 'false');
  });
}

document.querySelectorAll('[data-choice-level]').forEach(btn =>
  btn.addEventListener('click', () => {
    ensureAudio(); sfx.click();
    selectLevel(btn.dataset.choiceLevel);
    $('startBtn').textContent = T('startBtn')(Math.min(QN, currentPool().length));
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
  const look = others.filter(s => (target.lookalikes || []).includes(s.id));
  const sameGroup = others.filter(s => s.group === target.group && !look.includes(s));
  const sameLevel = others.filter(s => s.level === target.level && !look.includes(s) && !sameGroup.includes(s));
  const rest = others.filter(s => !look.includes(s) && !sameGroup.includes(s) && !sameLevel.includes(s));
  return [...shuffle(look), ...shuffle(sameGroup), ...shuffle(sameLevel), ...shuffle(rest)].slice(0, 3);
}

function currentPool() {
  const base = S.customPool ? SPECIES.filter(s => S.customPool.includes(s.id)) : groupPool();
  const pool = (S.customPool || S.level === 'alle') ? base : base.filter(s => s.level === S.level);
  return pool.filter(s => s.imgs.length);
}

function startQuiz() {
  const pool = currentPool();
  const n = Math.min(QN, pool.length);
  if (!n) { show('start'); return; }
  // små udvalg får svarmuligheder fra gruppen eller alle arter
  const distractorPool = pool.length >= 4 ? pool : (groupPool().length >= 4 && !S.customPool ? groupPool() : SPECIES);
  const picked = shuffle(pool).slice(0, n);
  S.questions = picked.map(sp => ({
    species: sp,
    imgIdx: Math.floor(Math.random() * sp.imgs.length),
    options: shuffle([sp, ...pickDistractors(sp, distractorPool)]),
  }));
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
  $('imgBadge').hidden = true;
  $('quizCredit').innerHTML = '';
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

function creditHtml(im) {
  if (!im || !im.file) return '';
  const href = 'https://commons.wikimedia.org/wiki/File:' + encodeURIComponent(im.file.replace(/ /g, '_'));
  const lic = im.license && im.license !== '?' ? ` · ${esc(im.license)}` : '';
  const who = im.author && im.author !== '?' ? im.author : 'Wikimedia Commons';
  return `${T('photoBy')}: <a href="${href}" target="_blank" rel="noopener">${esc(who)}</a>${lic}`;
}

function showQuizCredit(q) {
  const im = q.species.imgs[q.shownIdx != null ? q.shownIdx : q.imgIdx];
  $('quizCredit').innerHTML = creditHtml(im);
}

/* opdater quiz-tekster ved sprogskift uden at nulstille spørgsmålet */
function refreshQuizTexts() {
  const q = S.questions[S.qIndex];
  if (!q) return;
  $('qLabel').textContent = T('qLabel');
  $('pointsLabel').textContent = T('pointsLabel');
  $('streakTxt').textContent = T('streakTxt');
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
    $('feedbackHint').textContent = tx(q.species.keys);
    $('feedbackFact').textContent = tx(q.species.fact);
    showQuizCredit(q);
  } else {
    renderAnswers(q);
  }
}

function loadImage(q, attempt) {
  const img = $('quizImg');
  const ims = q.species.imgs;
  if (attempt >= ims.length) {
    // alle billeder fejlede — prøv en ny art (men aldrig efter der er svaret)
    const pool = currentPool();
    const used = S.questions.map(x => x.species.id);
    const fresh = S.answered ? [] : pool.filter(s => !used.includes(s.id));
    if (fresh.length) {
      const sp = fresh[Math.floor(Math.random() * fresh.length)];
      q.species = sp;
      q.imgIdx = Math.floor(Math.random() * sp.imgs.length);
      q.options = shuffle([sp, ...pickDistractors(sp, pool.length >= 4 ? pool : SPECIES)]);
      renderQuestion();
    } else {
      $('imgLoading').hidden = false;
      $('imgLoading').textContent = T('loadFail');
    }
    return;
  }
  const idx = (q.imgIdx + attempt) % ims.length;
  q.shownIdx = idx;
  const url = ims[idx].url;
  $('imgLoading').hidden = false;
  $('imgLoading').textContent = T('loading');
  img.className = '';
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

  $('feedbackHint').textContent = tx(q.species.keys);
  $('feedbackFact').textContent = tx(q.species.fact);
  showQuizCredit(q);
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

  const n = S.questions.length || 1;
  const r = S.correctCount / n;
  let sub, kicker;
  if (r === 1) { kicker = T('kick10'); sub = T('sub10'); }
  else if (r >= 0.8) { kicker = T('kick8'); sub = T('sub8'); }
  else if (r >= 0.5) { kicker = T('kick5'); sub = T('sub5'); }
  else if (r >= 0.3) { kicker = T('kick3'); sub = T('sub3'); }
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
      const chip = document.createElement('button');
      chip.className = 'missed-chip';
      const img = document.createElement('img');
      img.src = firstImg(sp);
      img.alt = '';
      img.loading = 'lazy';
      const t = document.createElement('span');
      t.textContent = spName(sp);
      chip.append(img, t);
      chip.addEventListener('click', () => { show('list'); openSheet(sp, S.missed); });
      missedBox.appendChild(chip);
    });
  }
  if (!quiet) sfx.finish();
  show('result');
}

$('againBtn').addEventListener('click', () => { ensureAudio(); sfx.click(); startQuiz(); });

/* ------------------- artsliste: søgning, filtre, grupper og visninger ------------------- */

const LEVEL_ORDER = ['nem', 'mellem', 'svær'];
const HYP_ORDER = ['meget-alm', 'alm', 'hist', 'sjaelden', 'meget-sjaelden'];
const MINE_ORDER = ['often', 'some', 'good', 'new'];
let currentSort = 'default';

const cmpName = (a, b) => sortName(a).localeCompare(sortName(b), LANG === 'da' ? 'da' : 'en');
const orderOf = dim => Object.keys(QUIZ.vals[dim] || {});

const ALL_DIMS = {
  group: { key: 'group', label: () => T('filterGroup'), order: () => QUIZ.groups.map(g => g.key), val: v => valLabel('group', v) },
  level: { key: 'level', label: () => T('filterLevel'), order: () => LEVEL_ORDER, val: v => T('levelName')[v] || v },
  hyp: { key: 'hyp', label: () => T('filterHyp'), order: () => HYP_ORDER, val: v => T('hyp')[v] || v },
  occ: { key: 'occ', label: () => T('filterOcc'), order: () => orderOf('occ'), val: v => valLabel('occ', v) },
  sizeClass: { key: 'sizeClass', label: () => T('filterSize'), order: () => orderOf('sizeClass'), val: v => valLabel('sizeClass', v) },
  habitat: { key: 'habitat', label: () => T('filterHabitat'), order: () => orderOf('habitat'), val: v => valLabel('habitat', v) },
  activity: { key: 'activity', label: () => T('filterActivity'), order: () => orderOf('activity'), val: v => valLabel('activity', v) },
  family: { key: 'family', label: () => T('filterFamily'), val: v => `${valLabel('family', v)} · ${v}`,
    order: () => [...new Set(SPECIES.map(s => s.family))].sort((a, b) => valLabel('family', a).localeCompare(valLabel('family', b), LANG === 'da' ? 'da' : 'en')) },
};
const FILTER_DIMS = QUIZ.filters.map(k => ALL_DIMS[k]);
const dimOrder = d => d.order();
const hasVal = (sp, key, v) => [].concat(sp[key]).includes(v);

const SORTS = ['default', ...QUIZ.filters.filter(k => k !== 'level'), 'lookalike', 'mine', 'now'];
const sortLabel = k => ({ default: T('sortDefault'), lookalike: T('sortLookalike'), mine: T('sortMine'), now: T('sortNow') }[k] || ALL_DIMS[k].label());

const LIST = {
  q: '',
  filters: Object.fromEntries(QUIZ.filters.map(k => [k, new Set()])),
  compact: false,
  collapsed: new Set(),
  ctrlLang: null,
};
try { LIST.compact = localStorage.getItem(QUIZ.key + '-compact') === '1'; } catch (e) { /* intet lager */ }

/* personlig statistik — gemmes kun i denne browser */
const STATS_KEY = QUIZ.key + '-stats';
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

/* måneder som korte intervaller, fx "nov.–mar." */
function formatMonths(ms) {
  if (!ms || !ms.length) return T('none');
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
  if (currentSort === 'default') {
    // standard: efter dyregruppe, i rækkefølgen fra datafilen
    return QUIZ.groups.map(g => ({ key: g.key, label: valLabel('group', g.key), items: list.filter(s => s.group === g.key) }))
      .filter(g => g.items.length);
  }

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
    const dv = list.filter(sp => (sp.dv || []).includes(m)).sort(cmpName);
    const pa = list.filter(sp => !dv.includes(sp) && (sp.pa || []).includes(m)).sort(cmpName);
    const act = list.filter(sp => !dv.includes(sp) && !pa.includes(sp)).sort(cmpName);
    return [
      { key: 'pa', label: T('nowGroups').pa(mName), items: pa },
      { key: 'act', label: T('nowGroups').act(mName), items: act },
      { key: 'dv', label: T('nowGroups').dv(mName), items: dv },
    ].filter(g => g.items.length);
  }

  const dim = ALL_DIMS[currentSort];
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
    if (present.length < 2) return;
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
    try { localStorage.setItem(QUIZ.key + '-compact', LIST.compact ? '1' : '0'); } catch (e) { /* ignorer */ }
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
  sel.setAttribute('aria-label', T('sortAria'));
  sel.innerHTML = SORTS.map(k => `<option value="${k}"${k === currentSort ? ' selected' : ''}>${sortLabel(k)}</option>`).join('');
  sel.onchange = () => { currentSort = sel.value; sfx.click(); renderGroups(); };
  ensureListControls();
  renderGroups();
  renderCredits();
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

  const groups = list.length ? buildGroups(list) : [];
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
    g.items.forEach(sp => grid.appendChild(LIST.compact ? makeRow(sp, g.items) : makeCard(sp, g.items)));
    sec.appendChild(grid);
    wrap.appendChild(sec);
  });
}

function occChip(sp) {
  return sp.occ && sp.occ !== QUIZ.defaultOcc ? `<span class="chip chip-occ-${sp.occ}">${valLabel('occ', sp.occ)}</span>` : '';
}

function makeRow(sp, seq) {
  const row = document.createElement('button');
  row.className = 'species-row';
  row.innerHTML = `
    <img src="${firstImg(sp)}" alt="" loading="lazy">
    <span class="row-text">
      <span class="species-name">${spName(sp)}</span>
      <span class="species-latin">${sp.latin}</span>
    </span>
    <span class="row-chips">
      <span class="chip">${T('hyp')[sp.hyp] || ''}</span>
      ${occChip(sp)}
    </span>`;
  row.addEventListener('click', () => openSheet(sp, seq));
  return row;
}

/* kort i gitteret: et overblik — hele arten åbnes i et ark */
function makeCard(sp, seq) {
  const card = document.createElement('article');
  card.className = 'species-card preview';
  card.tabIndex = 0;
  card.setAttribute('role', 'button');
  card.setAttribute('aria-label', T('openSpecies')(spName(sp)));
  card.innerHTML = `
    <div class="card-photo"><img src="${firstImg(sp)}" alt="" loading="lazy"></div>
    <div class="species-body">
      <div class="species-title-row">
        <span class="species-name">${spName(sp)}</span>
        <span class="level-badge level-${sp.level}">${T('levelName')[sp.level] || sp.level}</span>
      </div>
      <span class="species-latin">${sp.latin}</span>
      <div class="prop-chips">
        <span class="chip">${valLabel('group', sp.group)}</span>
        <span class="chip">${T('hyp')[sp.hyp] || ''}</span>
        ${occChip(sp)}
      </div>
      <p class="species-fact clamp">${tx(sp.keys)}</p>
      <span class="card-more">${T('cardMore')} →</span>
    </div>`;
  const open = () => openSheet(sp, seq);
  card.addEventListener('click', open);
  card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  return card;
}

/* samlet billedkreditering nederst i artslisten */
function renderCredits() {
  const box = $('creditsBox');
  if (!box) return;
  box.innerHTML = `<details><summary>${T('showCredits')}</summary>
    <p class="list-note">${T('creditsIntro')}</p>
    <ul class="credit-list">${SPECIES.slice().sort(cmpName).map(sp => sp.imgs.map(im =>
      `<li><strong>${spName(sp)}</strong> — ${creditHtml(im)}</li>`).join('')).join('')}</ul></details>`;
}

/* ------------------- artsark: hele arten på én skærm ------------------- */

const SHEET = { seq: [], idx: 0, imgIdx: 0, open: false };

function openSheet(sp, seq) {
  ensureAudio(); sfx.click();
  SHEET.seq = seq && seq.length ? seq : [sp];
  SHEET.idx = Math.max(0, SHEET.seq.indexOf(sp));
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
  SHEET.imgIdx = 0;
  sfx.click();
  renderSheet();
  $('sheet').querySelector('.sheet-scroll').scrollTop = 0;
}

function photoGo(delta) {
  const sp = SHEET.seq[SHEET.idx];
  const n = sp.imgs.length;
  if (n < 2) return;
  SHEET.imgIdx = (SHEET.imgIdx + delta + n) % n;
  renderSheetPhoto();
}

function renderSheetPhoto() {
  const sp = SHEET.seq[SHEET.idx];
  const im = sp.imgs[SHEET.imgIdx] || {};
  const box = $('sheet').querySelector('.sheet-photo');
  const img = box.querySelector('img');
  img.src = im.url || '';
  img.alt = T('photoOf')(SHEET.imgIdx + 1, sp.imgs.length) + ' — ' + spName(sp);
  box.querySelector('.car-count').textContent = `${SHEET.imgIdx + 1}/${sp.imgs.length}`;
  box.querySelectorAll('.ph-btn').forEach(b => { b.hidden = sp.imgs.length < 2; });
  $('sheet').querySelector('.sheet-credit').innerHTML = creditHtml(im);
}

function seasonStrip(sp) {
  const dv = sp.dv || [], pa = sp.pa || [];
  if (!dv.length && !pa.length) return '';
  const names = T('months');
  const cells = names.map((m, i) => {
    const d = dv.includes(i + 1), p = pa.includes(i + 1);
    const now = new Date().getMonth() === i;
    return `<span class="season-cell${d ? ' dv' : ''}${p ? ' pa' : ''}${now ? ' now' : ''}" title="${T('monthsLong')[i]}">
      <span class="season-bar"></span><span class="season-m">${m.charAt(0).toUpperCase()}</span></span>`;
  }).join('');
  const leg = [];
  if (dv.length) leg.push(`<span><i class="sw sw-dv"></i>${T('seasonDv')}: ${formatMonths(dv)}</span>`);
  if (pa.length) leg.push(`<span><i class="sw sw-pa"></i>${T('seasonPa')}: ${formatMonths(pa)}</span>`);
  return `<div class="season" role="img" aria-label="${leg.join('. ').replace(/<[^>]+>/g, '')}">
      <div class="season-row">${cells}</div>
      <div class="season-legend">${leg.join('')}</div>
    </div>`;
}

function renderSheet() {
  if (!SHEET.open) return;
  const sp = SHEET.seq[SHEET.idx];
  const st = loadStats()[sp.id];

  const facts = [
    [T('filterGroup'), valLabel('group', sp.group)],
    [T('filterFamily'), `${valLabel('family', sp.family)} <i>${sp.family}</i>`],
    [T('factSize'), tx(sp.size)],
    [T('filterHyp'), T('hyp')[sp.hyp]],
    [T('filterOcc'), valLabel('occ', sp.occ)],
    [T('filterHabitat'), (sp.habitat || []).map(h => valLabel('habitat', h)).join(', ')],
    QUIZ.filters.includes('activity') ? [T('filterActivity'), valLabel('activity', sp.activity)] : null,
  ].filter(f => f && f[1]);

  const sections = [
    [T('secKeys'), tx(sp.keys)],
    [T('secDist'), tx(sp.dist)],
    [T('factTag'), tx(sp.fact)],
  ].filter(s => s[1]);

  const looks = (sp.lookalikes || []).map(id => SPECIES.find(s => s.id === id)).filter(Boolean);
  const pairText = other => {
    const d = PAIR_DIFF[[sp.id, other.id].sort().join('|')];
    return d ? d[li()] : tx(other.keys);
  };

  const nbUrl = `https://www.naturbasen.dk/artsoegning?id=${encodeURIComponent(sp.latin)}&at=start`;
  const wikiUrl = `https://${LANG === 'en' ? 'en' : 'da'}.wikipedia.org/w/index.php?search=${encodeURIComponent(sp.latin)}`;

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
      <p class="sheet-credit photo-credit"></p>

      <dl class="facts">${facts.map(f => `<div class="fact"><dt>${f[0]}</dt><dd>${f[1]}</dd></div>`).join('')}</dl>

      ${seasonStrip(sp)}

      ${sections.map(s => `<section class="sheet-sec"><h3>${s[0]}</h3><p>${s[1]}</p></section>`).join('')}

      ${looks.length ? `<section class="sheet-sec">
        <h3>${T('secLook')}</h3>
        <div class="look-list">
          ${looks.map(o => `<button class="look-item" data-id="${o.id}">
              <img src="${firstImg(o)}" alt="" loading="lazy">
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
        <p><a href="${nbUrl}" target="_blank" rel="noopener">Naturbasen</a> · <a href="${wikiUrl}" target="_blank" rel="noopener">Wikipedia</a></p>
      </section>
    </div>`;

  panel.querySelector('.sheet-close').addEventListener('click', () => { sfx.click(); closeSheet(); });
  panel.querySelectorAll('.sheet-nav').forEach(b => b.addEventListener('click', () => sheetGo(+b.dataset.go)));
  panel.querySelector('.ph-prev').addEventListener('click', () => photoGo(-1));
  panel.querySelector('.ph-next').addEventListener('click', () => photoGo(1));
  panel.querySelectorAll('.look-item').forEach(b => b.addEventListener('click', () => {
    const o = SPECIES.find(s => s.id === b.dataset.id);
    const inSeq = SHEET.seq.indexOf(o);
    if (inSeq >= 0) { SHEET.idx = inSeq; } else { SHEET.seq = [o]; SHEET.idx = 0; }
    SHEET.imgIdx = 0;
    sfx.click(); renderSheet();
    $('sheet').querySelector('.sheet-scroll').scrollTop = 0;
  }));
  panel.querySelector('.sheet-quiz').addEventListener('click', () => {
    let pool = [sp, ...looks];
    if (pool.length < 4) {
      const same = shuffle(SPECIES.filter(s => !pool.includes(s) && s.group === sp.group));
      pool = pool.concat(same.slice(0, 4 - pool.length));
    }
    if (pool.length < 4) pool = pool.concat(shuffle(SPECIES.filter(s => !pool.includes(s))).slice(0, 4 - pool.length));
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

/* ------------------- guide ------------------- */

function renderLearn() {
  const L = LEARN[LANG];
  $('learnTitle').textContent = L.title;
  $('learnIntro').textContent = L.intro;

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
      sec.imgs.forEach(sid => {
        const sp = SPECIES.find(s => s.id === sid);
        if (!sp || !sp.imgs.length) return;
        const fig = document.createElement('figure');
        fig.className = 'learn-img';
        fig.innerHTML = `<img src="${small(sp.imgs[0].url)}" alt="${esc(spName(sp))}" loading="lazy">
          <figcaption>${spName(sp)}</figcaption>`;
        fig.addEventListener('click', () => { show('list'); openSheet(sp, [sp]); });
        grid.appendChild(fig);
      });
      if (grid.children.length) wrap.appendChild(grid);
    }
    body.appendChild(wrap);
  });

  // forvekslinger: hentes fra PAIR_DIFF
  const la = document.createElement('section');
  la.className = 'learn-section';
  la.innerHTML = `<h3 class="learn-h3">${L.lookalikesTitle}</h3><p class="learn-p">${L.lookalikesIntro}</p>`;
  const laGrid = document.createElement('div');
  laGrid.className = 'lookalike-grid';
  L.lookalikes.forEach(key => {
    const [a, b] = key.split('|').map(id => SPECIES.find(s => s.id === id));
    const d = PAIR_DIFF[key];
    if (!a || !b || !d) return;
    const card = document.createElement('button');
    card.className = 'lookalike-card';
    card.innerHTML = `<div class="lookalike-names">${spName(a)} <span class="vs">↔</span> ${spName(b)}</div><p>${d[li()]}</p>`;
    card.addEventListener('click', () => quizFromList(a.lookalikes.includes(b.id) ? [a, b, ...SPECIES.filter(s => s !== a && s !== b && s.group === a.group).slice(0, 2)] : [a, b]));
    laGrid.appendChild(card);
  });
  la.appendChild(laGrid);
  body.appendChild(la);

  const cta = $('learnCta');
  cta.innerHTML = `<div class="learn-cta-card"><h3>${L.ctaTitle}</h3><p>${L.ctaText}</p>
    <div class="result-actions"><button class="btn-primary" id="ctaQuiz">${L.ctaBtn}</button>
    <button class="btn-ghost" id="ctaList">${L.ctaList}</button></div></div>`;
  $('ctaQuiz').addEventListener('click', () => { ensureAudio(); sfx.click(); show('start'); });
  $('ctaList').addEventListener('click', () => { ensureAudio(); sfx.click(); show('list'); });
}

/* ------------------- keyboard ------------------- */

document.addEventListener('keydown', e => {
  if (S.screen !== 'quiz' || SHEET.open) return;
  if (['1', '2', '3', '4'].includes(e.key) && !S.answered) {
    answer(Number(e.key) - 1);
  } else if ((e.key === 'Enter' || e.key === ' ') && S.answered) {
    e.preventDefault();
    $('nextBtn').click();
  }
});

/* ------------------- init ------------------- */

(function initHero() {
  const sp = SPECIES.find(s => s.id === QUIZ.heroSpecies) || SPECIES[0];
  const im = sp.imgs[QUIZ.heroImg || 0] || sp.imgs[0];
  if (im) {
    $('heroImg').src = im.url;
    $('heroCredit').innerHTML = creditHtml(im);
  }
})();
applyLang();
