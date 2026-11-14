/* TræQuiz — guide: lær at kende træerne */

const LEARN = {
  da: {
    navLabel: 'Guide',
    title: 'Sådan kender du et træ',
    intro: 'Man behøver ikke være botaniker for at bestemme et træ. Det handler om at stille de rigtige spørgsmål i den rigtige rækkefølge — og vide, hvor man skal kigge. Her er metoden, som quizzen er bygget oven på.',
    stepsTitle: 'Fem spørgsmål der fører dig til svaret',
    steps: [
      { head: 'Nåle eller blade?', text: 'Er det et nåletræ eller et løvtræ? Danmark har kun tre hjemmehørende nåletræer — skovfyr, ene og taks — så det første spørgsmål er hurtigt besvaret.' },
      { head: 'Hvordan sidder bladene?', text: 'Sidor bladene parvis over for hinanden på skuddet (modsatte blade), sidder de skiftende hele vejen rundt (spredte blade)? Modsatte blade har ask, løn, benved og kvalkved — næsten alle andre danske træer har spredte blade. Bladstillingen er blandt de sikreste kendetegn overhovedet.' },
      { head: 'Hvad er bladformen?', text: 'Er bladet helrandet (bøg, tørst), savtakket (birk, elm, kirsebær), lappet (eg, løn, tjørn) eller finnet sammensat (ask, røn)? Bladformgruppen indsnævrer listen til få arter på ét blik.' },
      { head: 'Kig på detaljerne', text: 'Bladrandens takker, bladets basis, stilkens længde og små kirtler. Elmen har skæv, asymmetrisk bladbasis; stilkegens blade sidder næsten uden stilk, mens nøglerne har lang stilk; fuglekirsebær har små røde kirtler ved bladstilkens basis; dunbirk er dunet på unge skud.' },
      { head: 'Bark, blomster og frugter', text: 'Hvis bladene ikke slår det fast, giver barken svar hele året — og om foråret og efteråret afslører blomster og frugter ofte arten med ét blik: rakler, nøgler, vingede frø, bær og kogler.' },
    ],
    sections: [
      {
        title: 'Bladet — dit vigtigste spor',
        paras: [
          'Fra maj til oktober fortæller bladet det meste. Kig på tre ting: formen, randen og hvordan bladene sidder på grenen. Træn øjet på de fire bladformgrupper herunder — de dækker alle 33 arter i denne quiz.',
          'Vær opmærksom på, at unge skud og skyggeblade kan se anderledes ud end normale solblade. Tag altid et blad fra midten af kronen, hvis du kan.',
        ],
        imgs: [
          { sp: 'fagus', kind: 'blade', caption: 'Helrandet · bøg' },
          { sp: 'pendula', kind: 'blade', caption: 'Savtakket · vortebirk' },
          { sp: 'robur', kind: 'blade', caption: 'Lappet · stilkeg' },
          { sp: 'fraxinus', kind: 'blade', caption: 'Finnet · ask' },
        ],
      },
      {
        title: 'Barken — kendetegnet der virker hele året',
        paras: [
          'Barken er det eneste kendetegn, du kan bruge i alle årstider — også om vinteren og på unge træer uden frugter. Kig på farve, struktur og om barken skaller af.',
          'Husk at barken ændrer sig med alderen: en ung bøg er glat og grå, en gammel bøg får tyk, furet bark. Sammenlign derfor med træer af nogenlunde samme størrelse.',
        ],
        imgs: [
          { sp: 'pendula', kind: 'bark', caption: 'Hvid og skallende · vortebirk' },
          { sp: 'robur', kind: 'bark', caption: 'Dybt furet · stilkeg' },
          { sp: 'carpinus', kind: 'bark', caption: 'Muskelagtige furer · avnbøg' },
        ],
      },
      {
        title: 'Blomster og frugter — årets højdepunkter',
        paras: [
          'Om foråret afslører blomstringen mange arter med ét blik: kirsebær og slåen stikker hvidt af mod den nøgne skov, birk og hassel hænger med gule rakler, og seljepilens sølvgrå kattepoter er blandt de første forårstegn.',
          'Om efteråret giver frugterne svaret: egens nøgler, lønnens og elmens vingede frø, rønnens bærklaser, hasselens nødder og fyrrens kogler. Frugterne er ofte mere artstypiske end bladene — en nøgle med lang stilk er stilkeg, uden stilk er det vintereg.',
        ],
        imgs: [
          { sp: 'corylus', kind: 'blomst', caption: 'Han-rakler · hassel' },
          { sp: 'tilia', kind: 'blomst', caption: 'Vinget højblad · småbladet lind' },
          { sp: 'robur', kind: 'frugt', caption: 'Nøgler med stilk · stilkeg' },
          { sp: 'pinus', kind: 'frugt', caption: 'Kogler · skovfyr' },
        ],
      },
      {
        title: 'Om vinteren: knopper, silhuet og stedsegrønt',
        paras: [
          'Uden blade kigger du på knopper, bark og træets silhuet. Askens sorte, ru knopper er unikke; bøgens knopper er lange og cigarformede; lønnens er modsatte hinanden parvis.',
          'De visne, lysebrune blade hænger ofte på bøgen hele vinteren — et sikkert vintertegn. Og to af arterne her er stedsegrønne: taks og kristtorn grønner hele vinteren.',
        ],
      },
    ],
    lookalikesTitle: 'Klassiske forvekslinger',
    lookalikesIntro: 'Fem par, som selv erfarne skovgængere blander sammen. Kend forskellen — og brug den som snydetjek i quizzen.',
    lookalikes: [
      { a: 'Stilkeg', b: 'Vintereg', text: 'Nøglerne har lang stilk hos stilkegen, men næsten ingen stilk hos vinteregen — mens det er omvendt med bladstilkene.' },
      { a: 'Vortebirk', b: 'Dunbirk', text: 'Vortebirk har spids bladspids og sorte striber i den hvide bark; dunbirk har afrundet spids, dunede skud og mere glat, grålig bark.' },
      { a: 'Engriflet hvidtjørn', b: 'Almindelig hvidtjørn', text: 'Engriflet hvidtjørn har dybe, spidse bladlapper — næsten helt ind til midten — og én sten i bærret. Almindelig hvidtjørn har grunde, runde lapper med svage takker og 2-3 sten.' },
      { a: 'Skovelm', b: 'Småbladet elm', text: 'Skovelm har store, ru blade med frøet midt i vingen. Småbladet elm har mindre, mere symmetriske blade med frøet øverst i vingen.' },
      { a: 'Spidsløn', b: 'Ær', text: 'Spidsløn har spidse lapper og røde knopper om vinteren. Ær har rundere lapper, grønne knopper og bark der skaller i plader.' },
    ],
    ctaTitle: 'Nu er du klar',
    ctaText: 'Læs kunsten ved at gøre: Start med de nemme arter på blade, og arbejd dig op. Kunststykket er at kende kendetegnene — det lærer du bedst i quizzen.',
    ctaBtn: 'Start quizzen',
    ctaList: 'Se alle 33 arter',
  },
  en: {
    navLabel: 'Guide',
    title: 'How to identify a tree',
    intro: 'You do not need to be a botanist to identify a tree. It is about asking the right questions in the right order — and knowing where to look. Here is the method this quiz is built on.',
    stepsTitle: 'Five questions that lead you to the answer',
    steps: [
      { head: 'Needles or leaves?', text: 'Is it a conifer or a broadleaf? Denmark has only three native conifers — Scots pine, juniper and yew — so the first question is quickly answered.' },
      { head: 'How are the leaves arranged?', text: 'Do the leaves sit in opposite pairs along the shoot, or do they alternate (scattered)? Opposite leaves are found on ash, maples, spindle and guelder rose — almost all other Danish trees have alternate leaves. Leaf arrangement is one of the most reliable features there is.' },
      { head: 'What is the leaf shape?', text: 'Is the leaf entire-margined (beech, alder buckthorn), serrated (birch, elm, cherry), lobed (oak, maple, hawthorn) or pinnately compound (ash, rowan)? The leaf-shape group narrows the list to a few species at a glance.' },
      { head: 'Look at the details', text: 'The teeth of the margin, the leaf base, the stalk length and small glands. Elms have an asymmetric leaf base; the English oak\u2019s leaves sit almost without a stalk while its acorns have long ones; wild cherry has small red glands at the base of the leaf stalk; downy birch has downy young shoots.' },
      { head: 'Bark, flowers and fruits', text: 'If the leaves do not settle it, the bark gives answers all year round — and in spring and autumn, flowers and fruits often reveal the species at a glance: catkins, acorns, winged seeds, berries and cones.' },
    ],
    sections: [
      {
        title: 'The leaf — your most important clue',
        paras: [
          'From May to October, the leaf tells you most of the story. Look at three things: the shape, the margin and how the leaves sit on the branch. Train your eye on the four leaf-shape groups below — they cover all 33 species in this quiz.',
          'Note that young shoots and shade leaves can look different from normal sun leaves. Always take a leaf from the middle of the crown if you can.',
        ],
        imgs: [
          { sp: 'fagus', kind: 'blade', caption: 'Entire margin · beech' },
          { sp: 'pendula', kind: 'blade', caption: 'Serrated · silver birch' },
          { sp: 'robur', kind: 'blade', caption: 'Lobed · English oak' },
          { sp: 'fraxinus', kind: 'blade', caption: 'Pinnate · ash' },
        ],
      },
      {
        title: 'The bark — the clue that works all year',
        paras: [
          'Bark is the only feature you can use in every season — also in winter and on young trees without fruit. Look at colour, structure and whether the bark peels.',
          'Remember that bark changes with age: a young beech is smooth and grey, an old beech develops thick, furrowed bark. So compare with trees of roughly the same size.',
        ],
        imgs: [
          { sp: 'pendula', kind: 'bark', caption: 'White and peeling · silver birch' },
          { sp: 'robur', kind: 'bark', caption: 'Deeply furrowed · English oak' },
          { sp: 'carpinus', kind: 'bark', caption: 'Muscular ridges · hornbeam' },
        ],
      },
      {
        title: 'Flowers and fruits — the highlights of the year',
        paras: [
          'In spring, the flowering reveals many species at a glance: cherry and blackthorn stand out white against the bare forest, birch and hazel hang with yellow catkins, and the goat willow\u2019s silvery pussy willows are among the first signs of spring.',
          'In autumn, the fruits give the answer: oak acorns, the winged seeds of maple and elm, rowan berry clusters, hazelnuts and pine cones. Fruits are often more species-typical than leaves — an acorn on a long stalk is English oak, without a stalk it is sessile oak.',
        ],
        imgs: [
          { sp: 'corylus', kind: 'blomst', caption: 'Male catkins · hazel' },
          { sp: 'tilia', kind: 'blomst', caption: 'Winged bract · small-leaved lime' },
          { sp: 'robur', kind: 'frugt', caption: 'Acorns on stalks · English oak' },
          { sp: 'pinus', kind: 'frugt', caption: 'Cones · Scots pine' },
        ],
      },
      {
        title: 'In winter: buds, silhouette and evergreens',
        paras: [
          'Without leaves, look at buds, bark and the tree\u2019s silhouette. The ash\u2019s black, rough buds are unique; the beech\u2019s buds are long and cigar-shaped; the maple\u2019s sit in opposite pairs.',
          'The withered, light brown leaves often stay on the beech all winter — a certain winter sign. And two of the species here are evergreen: yew and holly stay green all winter.',
        ],
      },
    ],
    lookalikesTitle: 'Classic mix-ups',
    lookalikesIntro: 'Five pairs that even experienced foresters confuse. Know the difference — and use it as a cheat check in the quiz.',
    lookalikes: [
      { a: 'English oak', b: 'Sessile oak', text: 'The acorns have long stalks on the English oak but almost none on the sessile oak — while it is the other way round with the leaf stalks.' },
      { a: 'Silver birch', b: 'Downy birch', text: 'Silver birch has a pointed leaf tip and black dashes in the white bark; downy birch has a rounded tip, downy shoots and smoother, greyer bark.' },
      { a: 'Common hawthorn', b: 'Midland hawthorn', text: 'The common hawthorn has deep, pointed lobes — almost to the centre. The Midland hawthorn has shallow, rounded lobes with faint teeth.' },
      { a: 'Wych elm', b: 'Field elm', text: 'Wych elm has large, rough leaves with the seed in the centre of the wing. Field elm has smaller, more symmetrical leaves with the seed near the top of the wing.' },
      { a: 'Norway maple', b: 'Sycamore', text: 'Norway maple has pointed lobes and reddish buds in winter. Sycamore has rounder lobes, green buds and bark that peels in plates.' },
    ],
    ctaTitle: 'Now you are ready',
    ctaText: 'Reading is one thing — doing is another. Start with the easy species on leaves and work your way up. The trick is knowing the key features — and you learn those best in the quiz.',
    ctaBtn: 'Start the quiz',
    ctaList: 'See all 33 species',
  },
};
