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
    sortAria: 'Sortér artslisten', sortLabel: 'Sortér efter:',
    sortDefault: 'Standard', sortHyppighed: 'Almindelighed', sortStatus: 'Rødlistestatus', sortBladform: 'Bladform',
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
    sortAria: 'Sort the species list', sortLabel: 'Sort by:',
    sortDefault: 'Default', sortHyppighed: 'Abundance', sortStatus: 'Red List status', sortBladform: 'Leaf shape',
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
  let pool = S.level === 'alle' ? SPECIES : SPECIES.filter(s => s.level === S.level);
  // i en bestemt billedtype skal kun arter med billeder af den type med
  if (S.mode !== 'blandet') pool = pool.filter(s => (s.imgs[S.mode] || []).length);
  const n = Math.min(10, pool.length);
  if (!n) { show('start'); return; }
  const picked = shuffle(pool).slice(0, n);
  S.questions = picked.map(sp => {
    let kind = S.mode;
    if (S.mode === 'blandet') {
      const kinds = KINDS.filter(k => (sp.imgs[k] || []).length);
      kind = kinds[Math.floor(Math.random() * kinds.length)] || 'blade';
    }
    return {
      species: sp,
      kind,
      imgIdx: Math.floor(Math.random() * sp.imgs[kind].length),
      options: shuffle([sp, ...pickDistractors(sp, pool)]),
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
    // alle billeder fejlede — prøv en ny art med samme billedtype
    let pool = S.level === 'alle' ? SPECIES : SPECIES.filter(s => s.level === S.level);
    if (S.mode !== 'blandet') pool = pool.filter(s => (s.imgs[S.mode] || []).length);
    const used = S.questions.map(x => x.species.id);
    const fresh = pool.filter(s => !used.includes(s.id) && (s.imgs[q.kind] || []).length);
    if (fresh.length) {
      const sp = fresh[Math.floor(Math.random() * fresh.length)];
      q.species = sp;
      q.imgIdx = Math.floor(Math.random() * sp.imgs[q.kind].length);
      q.options = shuffle([sp, ...pickDistractors(sp, pool)]);
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

/* ------------------- artsliste: sortering + karrusel ------------------- */

const HYPPIGHED_ORDER = ['Meget almindelig', 'Almindelig', 'Hist og her', 'Sjælden'];
const STATUS_ORDER = ['EN', 'CR', 'VU', 'NT', 'NE', 'LC'];
const BLADFORM_ORDER = ['Nåle', 'Finnet', 'Helrandet', 'Lappet', 'Savtakket'];
let currentSort = 'default';

const SORT_FNS = {
  default: null,
  hyppighed: (a, b) => HYPPIGHED_ORDER.indexOf(a.hyppighed) - HYPPIGHED_ORDER.indexOf(b.hyppighed)
    || sortName(a).localeCompare(sortName(b), LANG === 'da' ? 'da' : 'en'),
  status: (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)
    || sortName(a).localeCompare(sortName(b), LANG === 'da' ? 'da' : 'en'),
  bladform: (a, b) => BLADFORM_ORDER.indexOf(a.bladform) - BLADFORM_ORDER.indexOf(b.bladform)
    || sortName(a).localeCompare(sortName(b), LANG === 'da' ? 'da' : 'en'),
};

const isScanUrl = u => /herbarium|illustration|handbook/i.test(u);

function renderList() {
  const grid = $('speciesGrid');
  grid.innerHTML = '';

  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.sort === currentSort);
    btn.onclick = () => { currentSort = btn.dataset.sort; sfx.click(); renderList(); };
  });

  let list = [...SPECIES];
  const fn = SORT_FNS[currentSort];
  if (fn) list.sort(fn);

  const kindLabel = T('kind');

  // Gruppering: ved sortering vises en overskrift pr. gruppe med antal arter
  const GROUP_LABEL = {
    hyppighed: v => T('hyppighed')[v] || v,
    status: v => `${T('status')[v] || v} · ${v}`,
    bladform: v => T('bladformChip')[v] || v,
  };
  const groupKey = currentSort === 'default' ? null : currentSort;
  let lastGroup = null;

  list.forEach(sp => {
    if (groupKey && sp[groupKey] !== lastGroup) {
      lastGroup = sp[groupKey];
      const n = list.filter(x => x[groupKey] === lastGroup).length;
      const h = document.createElement('h3');
      h.className = 'species-group-head';
      h.textContent = `${GROUP_LABEL[groupKey](lastGroup)} (${n})`;
      grid.appendChild(h);
    }
    const card = document.createElement('article');
    card.className = 'species-card';

    const slides = [];
    KINDS.forEach(k => {
      (sp.imgs[k] || []).forEach(u => slides.push({ url: u, kind: k }));
    });
    const statusTxt = `${sp.status} · ${T('status')[sp.status] || ''}`;

    card.innerHTML = `
      <div class="carousel">
        <div class="carousel-track">
          ${slides.map((s, i) => `
            <figure class="slide${isScanUrl(s.url) ? ' contain' : ''}">
              <img src="${s.url}" alt="${T('slideAlt')(kindLabel[s.kind], spName(sp))}" ${i ? 'loading="lazy"' : ''}>
              <span class="slide-tag">${kindLabel[s.kind]}</span>
            </figure>`).join('')}
        </div>
        ${slides.length > 1 ? `
          <button class="car-btn car-prev" aria-label="${T('carPrev')}">&#8249;</button>
          <button class="car-btn car-next" aria-label="${T('carNext')}">&#8250;</button>` : ''}
        <span class="car-count">1/${slides.length}</span>
      </div>
      <div class="species-body">
        <div class="species-title-row">
          <span class="species-name">${spName(sp)}</span>
          <span class="level-badge level-${sp.level}">${T('levelName')[sp.level] || sp.level}</span>
        </div>
        <span class="species-latin">${sp.latin}</span>
        <div class="prop-chips">
          <span class="chip chip-status-${sp.status}" title="${T('chipTitleStatus')}">${statusTxt}</span>
          <span class="chip" title="${T('chipTitleHyp')}">${T('hyppighed')[sp.hyppighed] || sp.hyppighed}</span>
          <span class="chip" title="${T('chipTitleBladform')}">${T('bladformChip')[sp.bladform] || sp.bladform}</span>
        </div>
        <p class="species-fact">${spText(sp, 'blade')}</p>
        <p class="species-fact">${spText(sp, 'bark')}</p>
        ${(sp.imgs.blomst || []).length ? `<p class="species-fact"><strong>${kindLabel.blomst}:</strong> ${spText(sp, 'blomst')}</p>` : ''}
        ${(sp.imgs.frugt || []).length ? `<p class="species-fact"><strong>${kindLabel.frugt}:</strong> ${spText(sp, 'frugt')}</p>` : ''}
        <p class="species-fact"><strong>${T('factTag')}:</strong> ${spText(sp, 'fakta')}</p>
      </div>`;

    const track = card.querySelector('.carousel-track');
    const count = card.querySelector('.car-count');
    const updateCount = () => {
      const idx = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
      count.textContent = `${Math.min(idx + 1, slides.length)}/${slides.length}`;
    };
    track.addEventListener('scroll', updateCount, { passive: true });
    const prev = card.querySelector('.car-prev');
    const next = card.querySelector('.car-next');
    if (prev) prev.addEventListener('click', () => track.scrollBy({ left: -track.clientWidth, behavior: 'smooth' }));
    if (next) next.addEventListener('click', () => track.scrollBy({ left: track.clientWidth, behavior: 'smooth' }));

    grid.appendChild(card);
  });
}

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
