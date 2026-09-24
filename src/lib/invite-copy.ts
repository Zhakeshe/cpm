export const LOCALES = ["kk", "ru", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_META: Record<Locale, { short: string; native: string }> = {
  kk: { short: "ҚАЗ", native: "Қазақша" },
  ru: { short: "РУС", native: "Русский" },
  en: { short: "ENG", native: "English" },
};

export const INVITE_ROLE_IDS = [
  "ftc_member",
  "designer",
  "smm",
  "content",
  "video",
  "photo",
  "organizer",
] as const;

export type InviteRoleId = (typeof INVITE_ROLE_IDS)[number];

export const HEARD_FROM = [
  "instagram",
  "school",
  "friends",
  "teacher",
  "scrimmage",
  "other",
] as const;

export const AVAILABILITY = ["few", "steady", "all_in"] as const;

type RoleCopy = { title: string; text: string };

export type InviteCopy = {
  metaTitle: string;
  nav: { first: string; programs: string; roles: string; season: string; who: string; apply: string };
  apply: string;
  heroEyebrow: string;
  heroTitle: string;
  heroItalic: string;
  heroLead: string;
  heroBody: string;
  ctaPrimary: string;
  ctaSecondary: string;
  scrollHint: string;
  seasonChip: string;
  firstKicker: string;
  firstTitle: string;
  firstItalic: string;
  firstLead: string;
  first: { title: string; text: string }[];
  introTitle: string;
  introLead: string;
  whyKicker: string;
  whyTitle: string;
  whyItalic: string;
  benefits: { title: string; text: string }[];
  rolesKicker: string;
  rolesTitle: string;
  rolesItalic: string;
  roles: Record<InviteRoleId, RoleCopy>;
  whoKicker: string;
  whoTitle: string;
  whoItalic: string;
  whoLead: string;
  who: string[];
  pathKicker: string;
  pathTitle: string;
  pathItalic: string;
  pathLead: string;
  path: { n: string; title: string; text: string }[];
  nomsKicker: string;
  nomsTitle: string;
  nomsItalic: string;
  nomsLead: string;
  noms: { name: string; text: string }[];
  programsKicker: string;
  programsTitle: string;
  programsItalic: string;
  programsLead: string;
  programsMore: string;
  programsTeaser: string;
  programsBrand: string;
  programs: { name: string; ages: string; text: string }[];
  unisKicker: string;
  unisTitle: string;
  unisItalic: string;
  unisLead: string;
  unisGrantBadge: string;
  unis: { name: string; place: string; grant: string }[];
  partnersKicker: string;
  partnersTitle: string;
  partnersItalic: string;
  partnersLead: string;
  partners: string[];
  houston: string;
  formKicker: string;
  formTitle: string;
  formLead: string;
  fields: {
    fullName: string;
    grade: string;
    school: string;
    city: string;
    languages: string;
    phone: string;
    social: string;
    role: string;
    rolePlaceholder: string;
    availability: string;
    availabilityPlaceholder: string;
    heardFrom: string;
    heardPlaceholder: string;
    superpower: string;
    whyJoin: string;
    skills: string;
    portfolio: string;
    portfolioHint: string;
  };
  availabilityOpts: Record<(typeof AVAILABILITY)[number], string>;
  heardOpts: Record<(typeof HEARD_FROM)[number], string>;
  errors: {
    fullName: string;
    grade: string;
    school: string;
    city: string;
    languages: string;
    phone: string;
    social: string;
    role: string;
    availability: string;
    heardFrom: string;
    superpower: string;
    whyJoin: string;
    skills: string;
    portfolio: string;
    server: string;
    check: string;
    duplicate: string;
    wait: string;
  };
  submit: string;
  sending: string;
  successTitle: string;
  successText: string;
  another: string;
  closeKicker: string;
  closeTitle: string;
  closeItalic: string;
  closeText: string;
  footerNote: string;
};

const SHARED_UNIS = {
  kk: [
    {
      name: "FIRST Scholarship Program",
      place: "Халықаралық",
      grant: "800+ стипендия. FTC/FLL түлектері firstinspires.org/scholarships каталогынан өтініш береді.",
    },
    {
      name: "Nazarbayev University",
      place: "Астана",
      grant: "Need-based және merit. Жарыс портфолиосы — өтініштің күшті бөлігі, пайызды университет өзі шешеді.",
    },
    {
      name: "KBTU",
      place: "Алматы",
      grant: "Ішкі және мемлекеттік грант. STEM олимпиада мен жоба тәжірибесі есепке алынады.",
    },
    {
      name: "AITU",
      place: "Астана",
      grant: "IT бағытындағы грант пен жеңілдік. Код, робот, медиа — нақты жұмыс ретінде қосылады.",
    },
    {
      name: "SDU",
      place: "Қонаев",
      grant: "Университет гранты және жеңілдік. FIRST тәжірибесі өтінішті толықтырады.",
    },
    {
      name: "Satbayev University",
      place: "Алматы",
      grant: "Инженерлік гранттар. Механика мен программалау портфолиосы маңызды.",
    },
    {
      name: "ENU",
      place: "Астана",
      grant: "Мемлекеттік грант квотасы. Жарыс және жоба — қосымша дәлел.",
    },
  ],
  ru: [
    {
      name: "FIRST Scholarship Program",
      place: "Международный",
      grant: "800+ стипендий. Выпускники FTC/FLL подают через каталог firstinspires.org/scholarships.",
    },
    {
      name: "Nazarbayev University",
      place: "Астана",
      grant: "Need-based и merit. Портфолио сезона усиливает заявку; процент решает университет.",
    },
    {
      name: "KBTU",
      place: "Алматы",
      grant: "Внутренний и государственный грант. Учитываются олимпиады и проектный опыт.",
    },
    {
      name: "AITU",
      place: "Астана",
      grant: "IT-грант и скидки. Код, робот, медиа идут как реальная работа.",
    },
    {
      name: "SDU",
      place: "Конаев",
      grant: "Университетский грант и скидки. Опыт FIRST дополняет заявку.",
    },
    {
      name: "Satbayev University",
      place: "Алматы",
      grant: "Инженерные гранты. Важны механика и программное портфолио.",
    },
    {
      name: "ENU",
      place: "Астана",
      grant: "Квота государственного гранта. Соревнования и проект — дополнительный аргумент.",
    },
  ],
  en: [
    {
      name: "FIRST Scholarship Program",
      place: "International",
      grant: "800+ scholarships. FTC/FLL alumni apply via firstinspires.org/scholarships.",
    },
    {
      name: "Nazarbayev University",
      place: "Astana",
      grant: "Need-based and merit aid. A season portfolio strengthens the file; the university sets the award.",
    },
    {
      name: "KBTU",
      place: "Almaty",
      grant: "Internal and state grants. Olympiads and project work are considered.",
    },
    {
      name: "AITU",
      place: "Astana",
      grant: "IT grants and fee reductions. Code, robot, and media count as finished work.",
    },
    {
      name: "SDU",
      place: "Konaev",
      grant: "University grants and discounts. FIRST experience supports the application.",
    },
    {
      name: "Satbayev University",
      place: "Almaty",
      grant: "Engineering grants. Mechanics and software portfolios matter.",
    },
    {
      name: "ENU",
      place: "Astana",
      grant: "State-grant quota. Competition and project work add evidence.",
    },
  ],
} as const;

export const INVITE_COPY: Record<Locale, InviteCopy> = {
  kk: {
    metaTitle: "K.E.R.N FTC · қабылдау",
    nav: { first: "FIRST", programs: "FTC / FLL", roles: "Рөлдер", season: "Маусым", who: "Кім керек", apply: "Өтініш" },
    apply: "Өтініш беру",
    heroEyebrow: "K.E.R.N School · Астана · FTC",
    heroTitle: "Бізге келгің келе ме?",
    heroItalic: "K.E.R.N School · Астана · 2026–2027",
    heroLead:
      "Мектептегі FIRST Tech Challenge командасы. Робототехника, медиа, дизайн, ұйымдастыру.",
    heroBody:
      "Өтініш қабылданады, қаралады, содан кейін сұхбат тағайындалады. Қабылдау шектеулі.",
    ctaPrimary: "Өтініш беру",
    ctaSecondary: "FIRST деген не",
    scrollHint: "Әрі қарай ақтар",
    seasonChip: "Жаңа маусым",
    firstKicker: "01",
    firstTitle: "FIRST деген не",
    firstItalic: "For Inspiration and Recognition of Science and Technology.",
    firstLead:
      "FIRST — әлемдік робототехника жарысы. Оқушылар робот жинайды, программалайды, төреші алдында қорғайды. K.E.R.N командасы FTC-де ойнайды.",
    first: [
      {
        title: "Не үшін",
        text: "Ғылым мен техниканы жарыс арқылы үйрету. Команда, мерзім, нақты нәтиже.",
      },
      {
        title: "FLL",
        text: "FIRST LEGO League — кіші сыныптар. LEGO робот, зерттеу, төреші.",
      },
      {
        title: "FTC",
        text: "FIRST Tech Challenge — 12–18 жас. Металл робот, Autonomous және TeleOp. K.E.R.N осында.",
      },
      {
        title: "Неге маңызды",
        text: "Портфолио, стипендия каталогы, университет гранттарына нақты дәлел.",
      },
    ],
    introTitle: "K.E.R.N School FTC 2026–2027",
    introLead:
      "K.E.R.N оқушыларын FIRST жарысына жинаймыз. Жарыс күні FTC пен FLL не екенін осында көресіз. Өтініш қабылданады, қаралады, кейін сұхбат тағайындалады.",
    programsKicker: "02",
    programsTitle: "FIRST® бағдарламалары",
    programsItalic: "",
    programsLead: "Жасы мен қызығушылығына қарай оқушылар әртүрлі бағдарламаға қатыса алады.",
    programsMore: "Толығырақ",
    programsTeaser: "Тизерді көру",
    programsBrand: "FIRST® Kazakhstan",
    programs: [
      {
        name: "FIRST® LEGO® League Discover",
        ages: "4–6 жас",
        text: "FIRST® LEGO® League Discover – мектепке дейінгі балаларға LEGO конструкторымен ойын арқылы STEM әлеміне кіріспе.",
      },
      {
        name: "FIRST® LEGO® League Explore",
        ages: "6–10 жас",
        text: "FIRST® LEGO® League Explore – кіші сыныптарға арналған бағдарлама: LEGO-дан қозғалатын модель жасап, қызықты есептерді шешеді.",
      },
      {
        name: "FIRST® LEGO® League Challenge",
        ages: "10–16 жас",
        text: "FIRST® LEGO® League Challenge – робототехника жарысы: оқушылар LEGO роботын программалап, зерттеу жобасымен жұмыс істейді.",
      },
      {
        name: "FIRST® Tech Challenge",
        ages: "12–18 жас",
        text: "FIRST® Tech Challenge – жоғары деңгейлі робототехника: жасөспірімдер робот жинап, нақты есептерді шешу үшін программалауды дамытады. K.E.R.N осында.",
      },
    ],
    whyKicker: "01",
    whyTitle: "Бағдарлама",
    whyItalic: "FIRST Tech Challenge маусымының бөліктері.",
    benefits: [
      { title: "FTC жарысы", text: "FIRST ережесі бойынша робот, Autonomous және TeleOp. Жаттығу алаңы — мектепте." },
      { title: "Жауапкершілік", text: "Әр қатысушының рөлі мен мерзімі бар. Жұмыс есепке алынады." },
      { title: "Медиа", text: "Команданың ресми арналарына материал дайындау: мәтін, фото, видео." },
      { title: "Дизайн", text: "Графика, мерч және іс-шара материалдары — мектеп айдентикасы бойынша." },
      { title: "Іс-шаралар", text: "Скриммидж, outreach және ресми FTC күндері." },
      { title: "Портфолио", text: "Маусым соңында нақты жұмыс: код, жоба, медиа немесе ұйымдастыру." },
    ],
    rolesKicker: "02",
    rolesTitle: "Командаға кім керек",
    rolesItalic: "Бір өтініште бір негізгі бағыт. Карточкаларды сырғытыңыз.",
    roles: {
      ftc_member: {
        title: "FTC қатысушысы",
        text: "Роботты жинайсың, программалайсың, жүргізесің. Механика, Autonomous, TeleOp.",
      },
      designer: {
        title: "Дизайнер",
        text: "Постер, мерч, пит, айдентика — команда K.E.R.N сияқты көрінуі керек.",
      },
      smm: {
        title: "SMM менеджер",
        text: "Instagram, сторис, жоспар. Аудиториямен сөйлесіп, дауысты өсіресің.",
      },
      content: {
        title: "Контент автор",
        text: "Мәтін, сценарий, матч рекаптары. Күнді бөлісетін әңгімеге айналдырасың.",
      },
      video: {
        title: "Видеомонтажер",
        text: "Хайлайт, reveal, Reels пен TikTok-қа қысқа роликтер.",
      },
      photo: {
        title: "Фото / медиа",
        text: "Робот, адам, іс-шара. Команда шынымен қолданатын архив.",
      },
      organizer: {
        title: "Ұйымдастырушы",
        text: "Чек-лист, қонақтар, outreach, жарыс күнінің тынысы.",
      },
    },
    whoKicker: "03",
    whoTitle: "Кім өтініш бере алады",
    whoItalic: "Оқушылар. Тәжірибе міндетті емес, тәртіп міндетті.",
    whoLead: "Робототехника, медиа, дизайн немесе ұйымдастыру. Келу және жұмысты аяқтау — негізгі талап.",
    who: [
      "Осы бағыттардың біріне қызығатын оқушылар",
      "Сабақ пен команда жұмысын қатар алып жүре алатындар",
      "Мерзімді сақтайтындар",
      "Жаңа құралды үйренуге дайындар",
    ],
    pathKicker: "04",
    pathTitle: "Қабылдау тәртібі",
    pathItalic: "Үш кезең.",
    pathLead: "Барлық өтініш қаралады. Келесі кезеңге шақыру — іріктеу нәтижесі бойынша.",
    path: [
      { n: "01", title: "Өтініш", text: "Форманы толық толтырыңыз: сынып, рөл, тәжірибе." },
      { n: "02", title: "Іріктеу", text: "Команда өтінішті қарайды. Барлық үміткер шақырылмайды." },
      { n: "03", title: "Сұхбат", text: "Қысқа әңгіме: рөл, уақыт, жауапкершілік." },
    ],
    nomsKicker: "05",
    nomsTitle: "FTC номинациялары",
    nomsItalic: "Маусым жоспарының бөлігі.",
    nomsLead: "Матчтан бөлек төрешілер инженерлік дәптерді, дизайнды, outreach пен команда жұмысын бағалайды.",
    noms: [
      { name: "Inspire", text: "Команданың бүкіл бет-бейнесі." },
      { name: "Think", text: "Инженерлік дәптер мен шешім." },
      { name: "Connect", text: "Серіктестік пен outreach." },
      { name: "Innovate", text: "Өзің ойлап тапқан шешім." },
      { name: "Control", text: "Программа мен Autonomous." },
      { name: "Motivate", text: "Команданың мәдениеті." },
      { name: "Design", text: "Механикалық дизайн." },
    ],
    unisKicker: "06",
    unisTitle: "Осы университеттерге грант беріледі",
    unisItalic: "FIRST тәжірибесі өтінішті күшейтеді. Пайызды университет шешеді.",
    unisLead:
      "FIRST стипендия каталогы және Қазақстан ЖОО гранттары. Төменде — логотиппен нақты жолдар. Бұл мектептің ресми серіктестік тізімі емес.",
    unisGrantBadge: "Грант",
    unis: [...SHARED_UNIS.kk],
    partnersKicker: "07",
    partnersTitle: "FIRST серіктестері",
    partnersItalic: "Халықаралық және Қазақстандағы демеушілер.",
    partnersLead: "FIRST бағдарламасын қолдаған ұйымдар. Логотиптер — FIRST Kazakhstan сайтындағы ресми лента.",
    partners: ["FIRST", "K.E.R.N School"],
    houston: "FIRST Championship · Houston",
    formKicker: "08",
    formTitle: "Өтініш нысаны",
    formLead: "Аты-жөні, сынып, тіл, телефон, әлеуметтік желі және рөл. Жауап Instagram немесе Telegram арқылы келеді.",
    fields: {
      fullName: "Аты-жөні",
      grade: "Сынып",
      school: "Мектеп",
      city: "Қала",
      languages: "Қай тілдерде сөйлейсің",
      phone: "Телефон",
      social: "Instagram немесе Telegram",
      role: "Қызықтырған рөл",
      rolePlaceholder: "Рөлді таңда",
      availability: "Аптасына қанша уақыт бере аласың",
      availabilityPlaceholder: "Уақытты таңда",
      heardFrom: "Біз туралы қайдан білдің",
      heardPlaceholder: "Нұсқаны таңда",
      superpower: "Командаға қандай үлес қосасыз",
      whyJoin: "Неге қосылғың келеді",
      skills: "Дағдыларың / тәжірибең",
      portfolio: "Портфолио немесе жұмыс сілтемесі",
      portfolioHint: "міндетті емес",
    },
    availabilityOpts: {
      few: "Аптасына 2–3 сағат",
      steady: "Аптасына 4–6 сағат",
      all_in: "Кештер мен демалыс — толықтай",
    },
    heardOpts: {
      instagram: "Instagram",
      school: "Мектептен",
      friends: "Достардан",
      teacher: "Мұғалімнен",
      scrimmage: "K.E.R.N scrimmage",
      other: "Басқа",
    },
    errors: {
      fullName: "Аты-жөніңді жаз",
      grade: "Сыныбыңды жаз",
      school: "Мектебіңді жаз",
      city: "Қалаңды жаз",
      languages: "Тілдеріңді жаз",
      phone: "Нөмірді +7 XXX XXX XX XX форматында жаз",
      social: "Instagram немесе Telegram қос",
      role: "Рөлді таңда",
      availability: "Уақытты таңда",
      heardFrom: "Қайдан білгеніңді таңда",
      superpower: "Ерекшелігіңді қысқа жаз",
      whyJoin: "Екі-үш сөйлем жаз",
      skills: "Дағдыларыңды жаз",
      portfolio: "Сілтеме немесе @username",
      server: "Жіберілмеді. Қайта көр.",
      check: "Форманы тексер",
      duplicate: "Бұл өтініш бар.",
      wait: "Жаңа ғана жібердің. Сәл күт.",
    },
    submit: "Өтінішті жіберу",
    sending: "Жіберілуде...",
    successTitle: "Өтініш жетті",
    successText: "Қарап шығып, Instagram немесе Telegram арқылы жазамыз.",
    another: "Тағы біреуін жіберу",
    closeKicker: "Қабылдау",
    closeTitle: "Өтінішті жіберіңіз",
    closeItalic: "Қарау мерзімі — өтініш түскеннен кейін.",
    closeText: "Форманы толтырыңыз. Іріктеуден өткен үміткерлерге сұхбат уақыты хабарланады.",
    footerNote: "K.E.R.N School · Астана · FIRST Tech Challenge",
  },
  ru: {
    metaTitle: "K.E.R.N FTC · набор",
    nav: { first: "FIRST", programs: "FTC / FLL", roles: "Роли", season: "Сезон", who: "Кто нужен", apply: "Заявка" },
    apply: "Подать заявку",
    heroEyebrow: "K.E.R.N School · Астана · FTC",
    heroTitle: "Хочешь к нам?",
    heroItalic: "K.E.R.N School · Астана · 2026–2027",
    heroLead: "Школьная команда FIRST Tech Challenge. Робототехника, медиа, дизайн, организация.",
    heroBody:
      "Заявки принимаются, рассматриваются, затем назначается собеседование. Мест ограниченное число.",
    ctaPrimary: "Подать заявку",
    ctaSecondary: "Что такое FIRST",
    scrollHint: "Листай дальше",
    seasonChip: "Новый сезон",
    firstKicker: "01",
    firstTitle: "Что такое FIRST",
    firstItalic: "For Inspiration and Recognition of Science and Technology.",
    firstLead:
      "FIRST — мировая робототехника. Ученики собирают робота, пишут код, защищаются перед судьями. Команда K.E.R.N играет в FTC.",
    first: [
      {
        title: "Зачем",
        text: "Наука и техника через соревнование. Команда, сроки, конкретный результат.",
      },
      {
        title: "FLL",
        text: "FIRST LEGO League — младшие классы. Робот LEGO, исследование, судьи.",
      },
      {
        title: "FTC",
        text: "FIRST Tech Challenge — 12–18 лет. Металлический робот, Autonomous и TeleOp. Здесь K.E.R.N.",
      },
      {
        title: "Почему важно",
        text: "Портфолио, каталог стипендий, аргумент для вузовских грантов.",
      },
    ],
    introTitle: "K.E.R.N School FTC 2026–2027",
    introLead:
      "Набираем учеников K.E.R.N в FIRST. В день соревнований здесь видно, что такое FTC и FLL. Заявки принимаются, рассматриваются, затем назначается собеседование.",
    programsKicker: "02",
    programsTitle: "Программы FIRST®",
    programsItalic: "",
    programsLead: "В зависимости от возраста и интересов ученики могут участвовать в разных программах.",
    programsMore: "Подробнее",
    programsTeaser: "Посмотреть тизер",
    programsBrand: "FIRST® Kazakhstan",
    programs: [
      {
        name: "FIRST® LEGO® League Discover",
        ages: "4–6 лет",
        text: "FIRST® LEGO® League Discover – введение в мир STEM для дошкольников через игровое обучение с конструктором LEGO.",
      },
      {
        name: "FIRST® LEGO® League Explore",
        ages: "6–10 лет",
        text: "FIRST® LEGO® League Explore – программа для младших школьников, где дети создают движущиеся модели из LEGO и решают интересные задачи.",
      },
      {
        name: "FIRST® LEGO® League Challenge",
        ages: "10–16 лет",
        text: "FIRST® LEGO® League Challenge – соревнования по робототехнике, где школьники программируют роботов LEGO и работают над исследовательскими проектами.",
      },
      {
        name: "FIRST® Tech Challenge",
        ages: "12–18 лет",
        text: "FIRST® Tech Challenge – продвинутая программа по робототехнике, где подростки создают роботов и развивают навыки программирования для решения реальных задач.",
      },
    ],
    whyKicker: "01",
    whyTitle: "Программа",
    whyItalic: "Части сезона FIRST Tech Challenge.",
    benefits: [
      { title: "Соревнования FTC", text: "Робот по правилам FIRST, Autonomous и TeleOp. Поле — на площадке школы." },
      { title: "Ответственность", text: "У каждого участника есть роль и сроки. Работа учитывается." },
      { title: "Медиа", text: "Материалы для официальных каналов команды: текст, фото, видео." },
      { title: "Дизайн", text: "Графика, мерч и материалы мероприятий — в айдентике школы." },
      { title: "Мероприятия", text: "Скриммидж, outreach и официальные дни FTC." },
      { title: "Портфолио", text: "К концу сезона — конкретные работы: код, проект, медиа или организация." },
    ],
    rolesKicker: "02",
    rolesTitle: "Кто нужен команде",
    rolesItalic: "В заявке одно основное направление. Листайте карточки.",
    roles: {
      ftc_member: {
        title: "Участник FTC",
        text: "Собираешь, программируешь, ведёшь робота. Механика, Autonomous, TeleOp.",
      },
      designer: {
        title: "Дизайнер",
        text: "Постеры, мерч, пит, айдентика — команда должна выглядеть как K.E.R.N.",
      },
      smm: {
        title: "SMM-менеджер",
        text: "Instagram, сторис, план. Говоришь с аудиторией и растишь голос.",
      },
      content: {
        title: "Автор контента",
        text: "Тексты, сценарии, рекапы матчей. Превращаешь день в историю, которой делятся.",
      },
      video: {
        title: "Видеомонтажёр",
        text: "Хайлайты, reveal, короткие ролики для Reels и TikTok.",
      },
      photo: {
        title: "Фото / медиа",
        text: "Роботы, люди, события. Архив, которым команда реально пользуется.",
      },
      organizer: {
        title: "Организатор",
        text: "Чек-листы, гости, outreach, дыхание дня соревнований.",
      },
    },
    whoKicker: "03",
    whoTitle: "Кто может подать заявку",
    whoItalic: "Ученики. Опыт не обязателен, дисциплина — да.",
    whoLead: "Робототехника, медиа, дизайн или организация. Основное требование — присутствие и завершение работы.",
    who: [
      "Ученики, которым близко одно из этих направлений",
      "Те, кто совмещает учёбу и командную работу",
      "Кто соблюдает сроки",
      "Кто готов осваивать новые инструменты",
    ],
    pathKicker: "04",
    pathTitle: "Порядок отбора",
    pathItalic: "Три этапа.",
    pathLead: "Каждая заявка рассматривается. Приглашение дальше — по итогам отбора.",
    path: [
      { n: "01", title: "Заявка", text: "Заполните форму полностью: класс, роль, опыт." },
      { n: "02", title: "Отбор", text: "Команда читает заявки. Приглашаются не все." },
      { n: "03", title: "Собеседование", text: "Короткий разговор: роль, время, ответственность." },
    ],
    nomsKicker: "05",
    nomsTitle: "Номинации FTC",
    nomsItalic: "Часть плана сезона.",
    nomsLead: "Помимо матча судьи оценивают инженерный ноутбук, дизайн, outreach и работу команды.",
    noms: [
      { name: "Inspire", text: "Лицо всей команды." },
      { name: "Think", text: "Инженерный ноутбук и решения." },
      { name: "Connect", text: "Партнёры и outreach." },
      { name: "Innovate", text: "Своё решение, не копия." },
      { name: "Control", text: "Программа и Autonomous." },
      { name: "Motivate", text: "Культура команды." },
      { name: "Design", text: "Механический дизайн." },
    ],
    unisKicker: "06",
    unisTitle: "Этим университетам дают гранты",
    unisItalic: "Опыт FIRST усиливает заявку. Процент определяет вуз.",
    unisLead:
      "Каталог стипендий FIRST и гранты вузов Казахстана. Ниже — с официальными логотипами. Это не список официальных партнёров школы.",
    unisGrantBadge: "Грант",
    unis: [...SHARED_UNIS.ru],
    partnersKicker: "07",
    partnersTitle: "Партнёры FIRST",
    partnersItalic: "Международные и казахстанские спонсоры.",
    partnersLead: "Организации, которые поддерживают программы FIRST. Логотипы — с официальной ленты FIRST Kazakhstan.",
    partners: ["FIRST", "K.E.R.N School"],
    houston: "FIRST Championship · Houston",
    formKicker: "08",
    formTitle: "Форма заявки",
    formLead: "Имя, класс, языки, телефон, соцсеть и роль. Ответ придёт в Instagram или Telegram.",
    fields: {
      fullName: "Имя и фамилия",
      grade: "Класс",
      school: "Школа",
      city: "Город",
      languages: "На каких языках говоришь",
      phone: "Телефон",
      social: "Instagram или Telegram",
      role: "Интересующая роль",
      rolePlaceholder: "Выбери роль",
      availability: "Сколько времени в неделю",
      availabilityPlaceholder: "Выбери загрузку",
      heardFrom: "Откуда узнал о нас",
      heardPlaceholder: "Выбери вариант",
      superpower: "Какой вклад вы готовы внести",
      whyJoin: "Почему хочешь к нам",
      skills: "Навыки / опыт",
      portfolio: "Портфолио или ссылка на работы",
      portfolioHint: "необязательно",
    },
    availabilityOpts: {
      few: "2–3 часа в неделю",
      steady: "4–6 часов в неделю",
      all_in: "Вечера и выходные — полностью",
    },
    heardOpts: {
      instagram: "Instagram",
      school: "Из школы",
      friends: "От друзей",
      teacher: "От учителя",
      scrimmage: "K.E.R.N scrimmage",
      other: "Другое",
    },
    errors: {
      fullName: "Укажи имя и фамилию",
      grade: "Укажи класс",
      school: "Укажи школу",
      city: "Укажи город",
      languages: "Укажи языки",
      phone: "Номер в формате +7 XXX XXX XX XX",
      social: "Добавь Instagram или Telegram",
      role: "Выбери роль",
      availability: "Выбери время",
      heardFrom: "Откуда узнал — выбери",
      superpower: "Коротко напиши, чем ты особенный",
      whyJoin: "Напиши пару предложений",
      skills: "Опиши навыки",
      portfolio: "Ссылка или @username",
      server: "Не отправилось. Попробуй ещё раз.",
      check: "Проверь форму",
      duplicate: "Такая заявка уже есть.",
      wait: "Только что отправил. Подожди немного.",
    },
    submit: "Отправить заявку",
    sending: "Отправка...",
    successTitle: "Заявка ушла",
    successText: "Посмотрим и напишем в Instagram или Telegram.",
    another: "Отправить ещё одну",
    closeKicker: "Набор",
    closeTitle: "Отправьте заявку",
    closeItalic: "Рассмотрение — после поступления формы.",
    closeText: "Заполните форму. Кандидатам, прошедшим отбор, сообщат время собеседования.",
    footerNote: "K.E.R.N School · Астана · FIRST Tech Challenge",
  },
  en: {
    metaTitle: "K.E.R.N FTC · recruitment",
    nav: { first: "FIRST", programs: "FTC / FLL", roles: "Roles", season: "Season", who: "Who we need", apply: "Apply" },
    apply: "Submit application",
    heroEyebrow: "K.E.R.N School · Astana · FTC",
    heroTitle: "Want to join us?",
    heroItalic: "K.E.R.N School · Astana · 2026–2027",
    heroLead: "The school FIRST Tech Challenge team. Robotics, media, design, operations.",
    heroBody:
      "Applications are reviewed, then shortlisted candidates are invited to interview. Places are limited.",
    ctaPrimary: "Submit application",
    ctaSecondary: "What is FIRST",
    scrollHint: "Keep scrolling",
    seasonChip: "New season",
    firstKicker: "01",
    firstTitle: "What is FIRST",
    firstItalic: "For Inspiration and Recognition of Science and Technology.",
    firstLead:
      "FIRST is global student robotics. Teams build a robot, write code, and present to judges. K.E.R.N competes in FTC.",
    first: [
      {
        title: "Why it exists",
        text: "Science and engineering through competition. A team, deadlines, finished work.",
      },
      {
        title: "FLL",
        text: "FIRST LEGO League — younger students. A LEGO robot, research, judges.",
      },
      {
        title: "FTC",
        text: "FIRST Tech Challenge — ages 12–18. A metal robot, Autonomous and TeleOp. This is K.E.R.N.",
      },
      {
        title: "Why it matters",
        text: "A portfolio, the scholarship catalog, evidence for university grants.",
      },
    ],
    introTitle: "K.E.R.N School FTC 2026–2027",
    introLead:
      "We recruit K.E.R.N students into FIRST. On match day this page shows what FTC and FLL are. Applications are reviewed; shortlisted candidates are invited to interview.",
    programsKicker: "02",
    programsTitle: "FIRST® programs",
    programsItalic: "",
    programsLead: "Depending on age and interests, students can join different programs.",
    programsMore: "Learn more",
    programsTeaser: "Watch teaser",
    programsBrand: "FIRST® Kazakhstan",
    programs: [
      {
        name: "FIRST® LEGO® League Discover",
        ages: "Ages 4–6",
        text: "FIRST® LEGO® League Discover – an introduction to STEM for preschoolers through play with LEGO.",
      },
      {
        name: "FIRST® LEGO® League Explore",
        ages: "Ages 6–10",
        text: "FIRST® LEGO® League Explore – younger students build moving LEGO models and solve open problems.",
      },
      {
        name: "FIRST® LEGO® League Challenge",
        ages: "Ages 10–16",
        text: "FIRST® LEGO® League Challenge – robotics competition: students program LEGO robots and run a research project.",
      },
      {
        name: "FIRST® Tech Challenge",
        ages: "Ages 12–18",
        text: "FIRST® Tech Challenge – advanced robotics: teens build robots and grow programming skills for real tasks.",
      },
    ],
    whyKicker: "01",
    whyTitle: "Programme",
    whyItalic: "The parts of a FIRST Tech Challenge season.",
    benefits: [
      { title: "FTC competition", text: "A robot under FIRST rules, Autonomous and TeleOp. The field is at the school." },
      { title: "Accountability", text: "Each member has a role and deadlines. Work is recorded." },
      { title: "Media", text: "Material for official team channels: writing, photo, video." },
      { title: "Design", text: "Graphics, merch, and event materials within the school identity." },
      { title: "Events", text: "Scrimmage, outreach, and official FTC days." },
      { title: "Portfolio", text: "Concrete work by the end of the season: code, project, media, or operations." },
    ],
    rolesKicker: "02",
    rolesTitle: "Who the team needs",
    rolesItalic: "Choose one primary track. Swipe the cards.",
    roles: {
      ftc_member: {
        title: "FTC team member",
        text: "Build, program, drive. Mechanics, Autonomous, TeleOp.",
      },
      designer: {
        title: "Designer",
        text: "Posters, merch, pit, identity — the team should look like K.E.R.N.",
      },
      smm: {
        title: "SMM manager",
        text: "Instagram, stories, the calendar. Talk to people. Grow the voice.",
      },
      content: {
        title: "Content creator",
        text: "Captions, scripts, match recaps. Turn a day into something people share.",
      },
      video: {
        title: "Video editor",
        text: "Highlights, reveals, short cuts for Reels and TikTok.",
      },
      photo: {
        title: "Photo / media",
        text: "Robots, people, events. An archive the team actually uses.",
      },
      organizer: {
        title: "Organizer",
        text: "Checklists, guests, outreach, the pulse of match day.",
      },
    },
    whoKicker: "03",
    whoTitle: "Who may apply",
    whoItalic: "Students. Prior experience is not required; reliability is.",
    whoLead: "Robotics, media, design, or operations. Attendance and finished work are the baseline.",
    who: [
      "Students interested in one of these tracks",
      "Those who can combine schoolwork and team duties",
      "Those who keep deadlines",
      "Those willing to learn new tools",
    ],
    pathKicker: "04",
    pathTitle: "Selection",
    pathItalic: "Three stages.",
    pathLead: "Every application is read. Further invitations follow the shortlist.",
    path: [
      { n: "01", title: "Application", text: "Complete the form: grade, role, experience." },
      { n: "02", title: "Review", text: "The team reads applications. Not all candidates are invited." },
      { n: "03", title: "Interview", text: "A short conversation: role, time, responsibility." },
    ],
    nomsKicker: "05",
    nomsTitle: "FTC judged awards",
    nomsItalic: "Part of the season plan.",
    nomsLead: "Beyond the match, judges assess the engineering notebook, design, outreach, and team process.",
    noms: [
      { name: "Inspire", text: "The whole face of the team." },
      { name: "Think", text: "Engineering notebook and decisions." },
      { name: "Connect", text: "Partners and outreach." },
      { name: "Innovate", text: "A solution that is yours." },
      { name: "Control", text: "Software and Autonomous." },
      { name: "Motivate", text: "How the team lives." },
      { name: "Design", text: "Mechanical design." },
    ],
    unisKicker: "06",
    unisTitle: "These universities award grants",
    unisItalic: "FIRST work strengthens an application. The university sets the award.",
    unisLead:
      "The FIRST scholarship catalog and Kazakh university grants, shown with official marks. This is not a list of official school partners.",
    unisGrantBadge: "Grant",
    unis: [...SHARED_UNIS.en],
    partnersKicker: "07",
    partnersTitle: "FIRST partners",
    partnersItalic: "International and Kazakhstan sponsors.",
    partnersLead: "Organisations that support FIRST programmes. Logos follow the FIRST Kazakhstan partner strip.",
    partners: ["FIRST", "K.E.R.N School"],
    houston: "FIRST Championship · Houston",
    formKicker: "08",
    formTitle: "Application form",
    formLead: "Name, grade, languages, phone, social, and role. We reply on Instagram or Telegram.",
    fields: {
      fullName: "Full name",
      grade: "Grade / class",
      school: "School",
      city: "City",
      languages: "Languages you speak",
      phone: "Phone",
      social: "Instagram or Telegram",
      role: "Role of interest",
      rolePlaceholder: "Choose a role",
      availability: "Hours you can give each week",
      availabilityPlaceholder: "Choose a load",
      heardFrom: "How did you hear about us",
      heardPlaceholder: "Choose one",
      superpower: "What you would contribute",
      whyJoin: "Why do you want in",
      skills: "Skills / experience",
      portfolio: "Portfolio or work link",
      portfolioHint: "optional",
    },
    availabilityOpts: {
      few: "2–3 hours a week",
      steady: "4–6 hours a week",
      all_in: "Evenings and weekends — all in",
    },
    heardOpts: {
      instagram: "Instagram",
      school: "At school",
      friends: "Friends",
      teacher: "A teacher",
      scrimmage: "K.E.R.N scrimmage",
      other: "Other",
    },
    errors: {
      fullName: "Enter your full name",
      grade: "Enter your grade",
      school: "Enter your school",
      city: "Enter your city",
      languages: "Enter your languages",
      phone: "Use +7 XXX XXX XX XX",
      social: "Add Instagram or Telegram",
      role: "Choose a role",
      availability: "Choose your time",
      heardFrom: "Tell us how you found us",
      superpower: "Write what makes you different",
      whyJoin: "Write a couple of sentences",
      skills: "Describe your skills",
      portfolio: "A link or @username",
      server: "Could not send. Try again.",
      check: "Check the form",
      duplicate: "We already have this application.",
      wait: "You just sent this. Wait a moment.",
    },
    submit: "Submit application",
    sending: "Sending...",
    successTitle: "Application received",
    successText: "We will read it and write on Instagram or Telegram.",
    another: "Send another",
    closeKicker: "Recruitment",
    closeTitle: "Submit the form",
    closeItalic: "Review begins after the application arrives.",
    closeText: "Complete the form. Shortlisted candidates will receive an interview time.",
    footerNote: "K.E.R.N School · Astana · FIRST Tech Challenge",
  },
};

export function inviteRoleTitle(role: string, locale: Locale = "en") {
  const id = role as InviteRoleId;
  return INVITE_COPY[locale].roles[id]?.title ?? role;
}
