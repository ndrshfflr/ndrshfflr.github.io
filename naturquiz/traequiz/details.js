/* TræQuiz — ekstra indhold til artsvisningen: vinterkendetegn, udbredelse,
   bemærkninger om status som hjemmehørende, forskelle på forvekslinger og kildelinks.
   Udbredelse og statusnoter bygger så vidt muligt på Naturbasen.dk, lex.dk (Den Store Danske /
   Naturen i Danmark) og dansk Wikipedia, nov. 2026. */

const DETAILS = {
  fagus: {
    winter: ['Lange, spidse, cigarformede brune knopper. Unge træer beholder ofte de visne blade vinteren over.', 'Long, pointed, cigar-shaped brown buds. Young trees often keep their dead leaves through winter.'],
    dist: ['I hele landet; Danmarks almindeligste løvtræ.', 'Throughout Denmark; the most common broadleaf tree.'],
    nb: 'art/3597/boeg',
  },
  robur: {
    winter: ['Butte, brune knopper samlet i spidsen af skuddet. Bred, knortet krone med snoede grene.', 'Blunt brown buds clustered at the shoot tip. Broad, gnarled crown with twisting branches.'],
    dist: ['I hele landet, især i skovbryn, krat og som fritstående gamle træer.', 'Throughout Denmark, especially in woodland edges, scrub and as old solitary trees.'],
    nb: 'art/4150/stilk-eg',
  },
  petraea: {
    winter: ['Knopper samlet i skudspidsen som hos stilkeg. Visne blade bliver oftere siddende vinteren over — deraf navnet.', 'Buds clustered at the shoot tip, as in English oak. Dead leaves stay on more often in winter — hence the Danish name ("winter oak").'],
    dist: ['Hist og her, især i Midtjylland, på Djursland og Bornholm.', 'Scattered, especially in central Jutland, Djursland and Bornholm.'],
    nb: 'art/4159/vinter-eg',
  },
  pendula: {
    winter: ['Tynde, hængende kviste med små harpiksvorter. Den hvide bark med sorte partier lyser op i vinterskoven.', 'Thin, hanging twigs with small resin warts. The white bark with black patches stands out in the winter woods.'],
    dist: ['I hele landet, især på tør, lysåben bund.', 'Throughout Denmark, especially on dry, open ground.'],
    nb: 'art/4741/vorte-birk',
  },
  pubescens: {
    winter: ['Dunede, mere opadrettede kviste uden vorter. Ældre træer har næsten altid heksekoste i kronen.', 'Downy, more upright twigs without warts. Older trees almost always carry witches’ brooms in the crown.'],
    dist: ['I hele landet, især på fugtig, næringsfattig bund og i moser.', 'Throughout Denmark, especially on damp, nutrient-poor ground and in bogs.'],
    nb: 'art/5817/dun-birk',
  },
  alnus: {
    winter: ['Stilkede, rødlige knopper. Små sorte "kogler" og nye hanrakler sidder på grenene hele vinteren.', 'Stalked, reddish buds. Small black "cones" and new male catkins hang on the branches all winter.'],
    dist: ['I hele landet ved søer og vandløb og i ellesumpe.', 'Throughout Denmark along lakes and streams and in alder swamps.'],
    nb: 'art/2661/roed-el',
  },
  fraxinus: {
    winter: ['Sorte, ru knopper i modsatte par — unikt blandt danske træer. Frugtklaserne hænger ofte vinteren over.', 'Black, rough buds in opposite pairs — unique among Danish trees. Seed clusters often hang on through winter.'],
    dist: ['I hele landet, men sparsomt på de magreste jorder i Jylland.', 'Throughout Denmark, but sparse on the poorest soils of Jutland.'],
    nb: 'art/4381/ask',
  },
  tilia: {
    winter: ['Mørkerøde, skæve knopper med 2-3 synlige knopskæl på zigzag-formede kviste.', 'Dark red, lopsided buds with 2-3 visible scales on zigzag twigs.'],
    dist: ['Hist og her som vild i skove på Øerne og i Sydøstjylland; ofte plantet.', 'Scattered in the wild in woods on the islands and in south-east Jutland; often planted.'],
    nb: 'art/4196/smaabladet-lind',
  },
  pinus: {
    winter: ['Stedsegrøn med nåle parvis. Rødbrun, afskallende "spejlbark" højt oppe på stammen.', 'Evergreen with needles in pairs. Red-brown, flaking "mirror bark" high up the trunk.'],
    dist: ['Plantet i hele landet, især på sandet bund.', 'Planted throughout Denmark, especially on sandy soil.'],
    native: ['Hjemmehørende, men de oprindelige danske bestande uddøde — de sidste på Læsø senest omkring 1700. Dagens skovfyr er plantet eller selvsået fra plantninger.', 'Native, but the original Danish populations died out — the last on Læsø by about 1700. Today’s Scots pines are planted or self-sown from plantations.'],
    nb: 'art/4163/skov-fyr',
  },
  avium: {
    winter: ['Blanke, brune, ægformede knopper samlet i klynger på kortskud. Rødbrun bark med tydelige tværstriber.', 'Glossy, brown, egg-shaped buds clustered on short shoots. Red-brown bark with distinct horizontal bands.'],
    dist: ['Mest i Østdanmark og talrig på Bornholm.', 'Mostly in eastern Denmark and plentiful on Bornholm.'],
    native: ['Status omdiskuteret: Den Store Danske beskriver fuglekirsebær som oprindeligt indført, men nu naturaliseret, mens andre kilder regner den for hjemmehørende.', 'Status disputed: Den Store Danske describes wild cherry as originally introduced but now naturalised, while other sources count it as native.'],
    nb: 'art/2730/fugle-kirsebaer',
  },
  sorbus: {
    winter: ['Store, mørkviolette, filthårede knopper på glatte, grå grene.', 'Large, dark violet, felted buds on smooth, grey branches.'],
    dist: ['I hele landet.', 'Throughout Denmark.'],
    nb: 'art/4172/almindelig-roen',
  },
  platanoides: {
    winter: ['Rødbrune knopper i modsatte par; topknoppen er stor og rødlig.', 'Red-brown buds in opposite pairs; the terminal bud is large and reddish.'],
    dist: ['Naturligt især på Bornholm; plantet og forvildet mange steder.', 'Naturally mainly on Bornholm; planted and naturalised in many places.'],
    nb: 'art/4171/spids-loen',
  },
  pseudoplatanus: {
    winter: ['Store, grønne knopper i modsatte par, ofte med mørk kant på skællene.', 'Large green buds in opposite pairs, often with dark-edged scales.'],
    dist: ['Meget almindelig i hele landet, bortset fra de mest næringsfattige egne.', 'Very common throughout Denmark, except the most nutrient-poor areas.'],
    native: ['Status omstridt: regnes normalt for indført fra Mellemeuropa for flere hundrede år siden, men nogle mener, den er oprindelig i Sønderjylland.', 'Status disputed: usually regarded as introduced from Central Europe several centuries ago, though some argue it is native to southern Jutland.'],
    nb: 'art/2136/ahorn',
  },
  campestre: {
    winter: ['Små, brune, dunede knopper i modsatte par. Kvistene har ofte korklister.', 'Small, brown, downy buds in opposite pairs. Twigs often have corky ridges.'],
    dist: ['Mest på Øerne og i Østjylland, på næringsrig muldbund.', 'Mostly on the islands and in eastern Jutland, on rich mould soil.'],
    nb: 'art/4195/navr',
  },
  carpinus: {
    winter: ['Slanke, spidse knopper tæt trykket ind til kvisten — som bøgens, men kortere. Visne blade sidder ofte vinteren over.', 'Slender, pointed buds pressed close to the twig — like beech buds, but shorter. Dead leaves often stay on in winter.'],
    dist: ['I hele landet, almindeligst på Bornholm og de sydlige øer.', 'Throughout Denmark, most common on Bornholm and the southern islands.'],
    nb: 'art/4400/avnboeg',
  },
  populus: {
    winter: ['Spidse, blanke, lidt klæbrige brune knopper. Grønliggrå bark med mørke, rhombeformede porer.', 'Pointed, glossy, slightly sticky brown buds. Greenish-grey bark with dark, diamond-shaped pores.'],
    dist: ['I hele landet, især på mager bund, heder og i skovbryn.', 'Throughout Denmark, especially on poor soil, heaths and woodland edges.'],
    nb: 'art/4922/baevreasp',
  },
  salix: {
    winter: ['Store, rødbrune knopper. Blomsterknopperne svulmer til sølvgrå "gæslinger" allerede i februar-marts.', 'Large, red-brown buds. The flower buds swell into silvery "pussy willows" as early as February-March.'],
    dist: ['I hele landet.', 'Throughout Denmark.'],
    nb: 'artsoegning?id=Salix+caprea&at=start',
  },
  malus: {
    winter: ['Filthårede knopper; kortskuddene ender ofte i en torn.', 'Felted buds; short shoots often end in a thorn.'],
    dist: ['Hist og her i hele landet i skovbryn, krat og hegn.', 'Scattered throughout Denmark in woodland edges, scrub and hedges.'],
    nb: 'artsoegning?id=Malus+sylvestris&at=start',
  },
  pyrus: {
    winter: ['Spidse, blanke knopper; kortskud med torne og ternet bark.', 'Pointed, glossy buds; thorny short shoots and chequered bark.'],
    dist: ['Meget sjælden; vilde forekomster er usikre.', 'Very rare; wild occurrences are uncertain.'],
    native: ['Vilde forekomster i Danmark er usikre, og Naturbasen har ingen fund registreret af arten.', 'Wild occurrences in Denmark are uncertain, and Naturbasen has no records of the species.'],
    nb: 'art/20697/pyrus-pyraster',
  },
  crataegus: {
    winter: ['Små, røde, kuglerunde knopper og 1-2 cm lange grentorne. Røde bær kan sidde vinteren over.', 'Small, red, round buds and thorns 1-2 cm long. Red haws can stay on through winter.'],
    dist: ['Meget almindelig i hele landet.', 'Very common throughout Denmark.'],
    native: ['Naturbasen angiver, at engriflet hvidtjørn formentlig ikke er oprindelig i Danmark, men indført i senmiddelalderen.', 'Naturbasen states that common hawthorn is probably not original to Denmark but was introduced in the late Middle Ages.'],
    nb: 'art/4191/%C3%A9ngriflet-hvidtjoern',
  },
  laevigata: {
    winter: ['Vinterkviste ligner engriflet hvidtjørns. Kig efter gamle bær med 2-3 sten.', 'Winter twigs look like common hawthorn’s. Look for old haws with 2-3 stones.'],
    dist: ['Almindelig i skove, skovbryn og hegn.', 'Common in woods, woodland edges and hedges.'],
    nb: 'art/4190/almindelig-hvidtjoern',
  },
  spinosa: {
    winter: ['Tætte, mørke, tornede grene med små knopper samlet på kortskud.', 'Dense, dark, thorny branches with small buds clustered on short shoots.'],
    dist: ['I hele landet i hegn, krat og skovbryn.', 'Throughout Denmark in hedges, scrub and woodland edges.'],
    nb: 'art/3433/slaaen',
  },
  corylus: {
    winter: ['Ægformede, butte, grønbrune knopper. Hanraklerne hænger allerede fra efteråret.', 'Egg-shaped, blunt, greenish-brown buds. The male catkins hang from the autumn onwards.'],
    dist: ['I hele landet i skov og hegn, ofte som underskov.', 'Throughout Denmark in woods and hedges, often as understorey.'],
    nb: 'art/4332/hassel',
  },
  juniperus: {
    winter: ['Stedsegrøn med stikkende nåle i kranse af tre og blåsorte bærkogler.', 'Evergreen with prickly needles in whorls of three and blue-black berry-cones.'],
    dist: ['Spredt i hele landet, især på heder og tørre bakker.', 'Scattered throughout Denmark, especially on heaths and dry slopes.'],
    nb: 'art/3325/ene',
  },
  taxus: {
    winter: ['Stedsegrøn med flade, mørkegrønne nåle i to rækker og grønne knopper.', 'Evergreen with flat, dark green needles in two rows and green buds.'],
    dist: ['Den eneste gamle vilde bestand står ved Munkebjerg ved Vejle Fjord; forvildet mange steder.', 'The only old wild population grows at Munkebjerg on Vejle Fjord; naturalised in many places.'],
    nb: 'art/3652/taks',
  },
  padus: {
    winter: ['Lange, spidse, brune knopper, der står ud fra kvisten. Barken lugter skarpt, når man kradser i den.', 'Long, pointed, brown buds that stand out from the twig. The bark smells sharp when scratched.'],
    dist: ['I hele landet, gerne på næringsrig, lidt fugtig bund.', 'Throughout Denmark, preferring rich, slightly damp soil.'],
    nb: 'art/4263/almindelig-haeg',
  },
  viburnum: {
    winter: ['Rødgrønne knopper i modsatte par. Klaser af røde bær bliver ofte siddende langt hen på vinteren.', 'Reddish-green buds in opposite pairs. Clusters of red berries often stay on well into winter.'],
    dist: ['I hele landet i skov, krat og hegn.', 'Throughout Denmark in woods, scrub and hedges.'],
    nb: 'art/4138/kvalkved',
  },
  ilex: {
    winter: ['Stedsegrøn med blanke, tornede blade og røde bær på hunplanterne.', 'Evergreen with glossy, spiny leaves and red berries on female plants.'],
    dist: ['Vild især i bøgeskove og krat i Østjylland; ofte plantet.', 'Wild mainly in beech woods and scrub in eastern Jutland; often planted.'],
    nb: 'art/3558/kristtorn',
  },
  ulmusglabra: {
    winter: ['Store, mørke, runde, hårede knopper på kraftige kviste.', 'Large, dark, round, hairy buds on stout twigs.'],
    dist: ['I hele landet, især på fugtig muldbund og skrænter.', 'Throughout Denmark, especially on damp mould soil and slopes.'],
    nb: 'art/3632/skov-elm',
  },
  ulmusminor: {
    winter: ['Små, mørke knopper; kvistene har ofte korklister.', 'Small, dark buds; twigs often have corky ridges.'],
    dist: ['Relativt sjælden, i det sydøstlige Danmark i strandkrat og skovbryn.', 'Fairly rare, in south-eastern Denmark in coastal scrub and woodland edges.'],
    nb: 'art/3138/smaabladet-elm',
  },
  frangula: {
    winter: ['Nøgne, brune, filthårede knopper uden knopskæl. Mørk bark med lyse, aflange korkporer.', 'Naked, brown, felted buds without scales. Dark bark with pale, elongated cork pores.'],
    dist: ['Almindelig i hele landet på sur, humusrig bund.', 'Common throughout Denmark on acidic, humus-rich soil.'],
    nb: 'art/4264/toerst',
  },
  rhamnus: {
    winter: ['Næsten modsatte, tæt tiltrykte knopper; grenene ender ofte i en torn.', 'Nearly opposite, closely pressed buds; branches often end in a thorn.'],
    dist: ['I hele landet, mest i Østjylland og på Øerne.', 'Throughout Denmark, most common in eastern Jutland and on the islands.'],
    nb: 'artsoegning?id=Rhamnus+cathartica&at=start',
  },
  euonymus: {
    winter: ['Grønne, firkantede kviste med lyse striber eller korklister; smalle, grønne knopper i modsatte par.', 'Green, four-angled twigs with pale stripes or corky ridges; narrow, green buds in opposite pairs.'],
    dist: ['Mest i Østdanmark i skovbryn og hegn.', 'Mostly in eastern Denmark in woodland edges and hedges.'],
    nb: 'art/2103/benved',
  },
};

/* Forskelle på forvekslingspar. Nøglen er de to arts-id'er sorteret alfabetisk og adskilt af | */
const PAIR_DIFF = {
  'crataegus|laevigata': ['Engriflet hvidtjørn har dybe, spidse bladlapper og én sten i bærret; almindelig hvidtjørn har grunde, runde lapper og 2-3 sten.', 'Common hawthorn has deep, pointed lobes and one stone per haw; Midland hawthorn has shallow, rounded lobes and 2-3 stones.'],
  'fraxinus|sorbus': ['Begge har finnede blade, men ask har modsatte blade og sorte knopper; røn har spredte blade og røde bær.', 'Both have pinnate leaves, but ash has opposite leaves and black buds; rowan has alternate leaves and red berries.'],
  'carpinus|fagus': ['Avnbøg har dobbelt savtakket bladrand og en furet, "muskuløs" stamme; bøg har helrandede blade og glat bark.', 'Hornbeam has a doubly serrated margin and a fluted, "muscular" trunk; beech has entire leaves and smooth bark.'],
  'populus|salix': ['Bævreasp har næsten runde blade på flade stilke, der bævrer i vinden; seljepil har ovale, rynkede blade med grå underside.', 'Aspen has almost round leaves on flat stalks that tremble in the wind; goat willow has oval, wrinkled leaves with a grey underside.'],
  'pendula|pubescens': ['Vortebirk har spids bladspids, hængende kviste med vorter og sorte partier i barken; dunbirk har afrundet spids og dunede skud.', 'Silver birch has a pointed leaf tip, hanging warty twigs and black patches in the bark; downy birch has a rounded tip and downy shoots.'],
  'juniperus|taxus': ['Ene har stikkende nåle i kranse af tre og blåsorte bærkogler; taks har flade, bløde nåle i to rækker og røde bær.', 'Juniper has prickly needles in whorls of three and blue-black berry-cones; yew has flat, soft needles in two rows and red berries.'],
  'avium|padus': ['Fuglekirsebær har blomster i skærme og store kirsebær; hæg har blomster i lange, hængende klaser og små sorte bær.', 'Wild cherry has flowers in umbels and large cherries; bird cherry has flowers in long, hanging racemes and small black berries.'],
  'avium|malus': ['Fuglekirsebær har blank, tværstribet bark og kirtler ved bladstilken; skovæble har ofte torne og små æbler.', 'Wild cherry has glossy, banded bark and glands at the leaf stalk; crab apple often has thorns and small apples.'],
  'avium|spinosa': ['Slåen er en tornet busk med små blade og blomster før løvspring; fuglekirsebær er et træ med store blade og blomster samtidig med løvet.', 'Blackthorn is a thorny shrub with small leaves and flowers before the leaves; wild cherry is a tree with large leaves and flowers with the leaves.'],
  'ilex|taxus': ['Begge er stedsegrønne med røde bær, men kristtorn har brede, tornede blade, og taks har nåle.', 'Both are evergreen with red berries, but holly has broad, spiny leaves and yew has needles.'],
  'platanoides|viburnum': ['Kvalkved har tre lapper og kirtler på bladstilken; spidsløn har fem spidse lapper og mælkesaft i stilken.', 'Guelder rose has three lobes and glands on the leaf stalk; Norway maple has five pointed lobes and milky sap in the stalk.'],
  'campestre|ulmusglabra': ['Navr har modsatte, lappede blade; skovelm har spredte, hele blade med skæv bladbasis.', 'Field maple has opposite, lobed leaves; wych elm has alternate, unlobed leaves with a lopsided base.'],
  'campestre|platanoides': ['Navr har små blade med butte lapper og korklister på kvistene; spidsløn har store blade med spidse, tandede lapper.', 'Field maple has small leaves with blunt lobes and corky twigs; Norway maple has large leaves with pointed, toothed lobes.'],
  'alnus|ulmusglabra': ['Rødel har butte, ofte indbugtede bladspidser og små kogler; skovelm har store, ru blade med skæv basis.', 'Alder has blunt, often notched leaf tips and small cones; wych elm has large, rough leaves with a lopsided base.'],
  'ulmusglabra|ulmusminor': ['Skovelm har store, ru blade med frøet midt i vingen; småbladet elm har mindre, mere symmetriske blade med frøet øverst i vingen.', 'Wych elm has large, rough leaves with the seed in the middle of the wing; field elm has smaller, more symmetrical leaves with the seed near the top.'],
  'malus|pyrus': ['Skovæble har runde æbler; vild pære har pæreformede frugter, blanke blade og ternet bark.', 'Crab apple has round apples; wild pear has pear-shaped fruits, glossy leaves and chequered bark.'],
  'rhamnus|spinosa': ['Begge er tornede buske med sorte frugter, men vrietorn har næsten modsatte blade med buede sidenerver; slåen har spredte blade og blåduggede frugter.', 'Both are thorny shrubs with black fruits, but buckthorn has nearly opposite leaves with curved veins; blackthorn has alternate leaves and bloomy blue fruits.'],
  'platanoides|pseudoplatanus': ['Spidsløn har spidse lapper og rødlige knopper; ær har rundere lapper, grønne knopper og bark, der skaller af i plader.', 'Norway maple has pointed lobes and reddish buds; sycamore has rounder lobes, green buds and bark that flakes in plates.'],
  'petraea|robur': ['Stilkeg har lange stilke på agernene og næsten ingen bladstilk; hos vintereg er det omvendt.', 'English oak has long-stalked acorns and almost stalkless leaves; sessile oak is the other way round.'],
};
