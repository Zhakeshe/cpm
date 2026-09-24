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
  nav: { why: string; roles: string; season: string; who: string; apply: string };
  apply: string;
  heroEyebrow: string;
  heroTitle: string;
  heroItalic: string;
  heroLead: string;
  heroBody: string;
  ctaPrimary: string;
  ctaSecondary: string;
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
  unisKicker: string;
  unisTitle: string;
  unisItalic: string;
  unisLead: string;
  unis: { name: string; place: string }[];
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
    { name: "Nazarbayev University", place: "Астана" },
    { name: "KBTU", place: "Алматы" },
    { name: "AITU", place: "Астана" },
    { name: "SDU", place: "Қонаев" },
    { name: "Satbayev University", place: "Алматы" },
    { name: "ENU", place: "Астана" },
  ],
  ru: [
    { name: "Nazarbayev University", place: "Астана" },
    { name: "KBTU", place: "Алматы" },
    { name: "AITU", place: "Астана" },
    { name: "SDU", place: "Конаев" },
    { name: "Satbayev University", place: "Алматы" },
    { name: "ENU", place: "Астана" },
  ],
  en: [
    { name: "Nazarbayev University", place: "Astana" },
    { name: "KBTU", place: "Almaty" },
    { name: "AITU", place: "Astana" },
    { name: "SDU", place: "Konaev" },
    { name: "Satbayev University", place: "Almaty" },
    { name: "ENU", place: "Astana" },
  ],
} as const;

export const INVITE_COPY: Record<Locale, InviteCopy> = {
  kk: {
    metaTitle: "K.E.R.N FTC · қабылдау",
    nav: { why: "Бағдарлама", roles: "Рөлдер", season: "Маусым", who: "Талаптар", apply: "Өтініш" },
    apply: "Өтініш беру",
    heroEyebrow: "K.E.R.N School · Астана",
    heroTitle: "K.E.R.N FTC",
    heroItalic: "Командаға қабылдау · 2026–2027",
    heroLead:
      "FIRST Tech Challenge бағдарламасы бойынша мектеп командасына қабылдау ашық. Робототехника, медиа, дизайн және ұйымдастыру бағыттары.",
    heroBody:
      "Өтініш қабылданады, қаралады, содан кейін сұхбат тағайындалады. Қабылдау шектеулі.",
    ctaPrimary: "Өтініш беру",
    ctaSecondary: "Бағдарлама",
    whyKicker: "01",
    whyTitle: "Не үшін қатысасыз",
    whyItalic: "Маусым бойына нақты жұмыс.",
    benefits: [
      { title: "FTC жарысы", text: "FIRST ережесі бойынша робот, Autonomous және TeleOp. Жаттығу алаңы — мектепте." },
      { title: "Жауапкершілік", text: "Әр қатысушының рөлі мен мерзімі бар. Жұмыс есепке алынады." },
      { title: "Медиа", text: "Команданың ресми арналарына материал дайындау: мәтін, фото, видео." },
      { title: "Дизайн", text: "Графика, мерч және іс-шара материалдары — мектеп айдентикасы бойынша." },
      { title: "Іс-шаралар", text: "Скриммидж, outreach және ресми FTC күндері." },
      { title: "Портфолио", text: "Маусым соңында нақты жұмыс: код, жоба, медиа немесе ұйымдастыру." },
    ],
    rolesKicker: "02",
    rolesTitle: "Қандай рөлдер бар",
    rolesItalic: "Бір өтініште бір негізгі бағыт.",
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
      { n: "01", title: "Өтініш", text: "Форманы толық толтырыңыз: мектеп, рөл, тәжірибе." },
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
    unisTitle: "Білім беру жолы",
    unisItalic: "FTC тәжірибесі университет өтінішіне қосылады.",
    unisLead: "Төмендегі жоғары оқу орындары — бағыт, ресми серіктестік тізімі емес.",
    unis: [...SHARED_UNIS.kk],
    partnersKicker: "07",
    partnersTitle: "Серіктестер",
    partnersItalic: "Мектеп және FIRST экожүйесі.",
    partnersLead: "Маусымдық демеушілер бөлек көрсетіледі. Tesla немесе өзге брендпен байланыс жоқ.",
    partners: ["K.E.R.N School", "FIRST", "BIOBUZZ · RTX", "Маусым серіктесі"],
    houston: "FIRST Championship · Houston",
    formKicker: "08",
    formTitle: "Өтініш нысаны",
    formLead: "Барлық міндетті өрісті толтырыңыз. Жауап Instagram немесе Telegram арқылы жіберіледі.",
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
    nav: { why: "Программа", roles: "Роли", season: "Сезон", who: "Требования", apply: "Заявка" },
    apply: "Подать заявку",
    heroEyebrow: "K.E.R.N School · Астана",
    heroTitle: "K.E.R.N FTC",
    heroItalic: "Набор в команду · 2026–2027",
    heroLead:
      "Открыт набор в школьную команду FIRST Tech Challenge. Направления: робототехника, медиа, дизайн и организация.",
    heroBody:
      "Заявки принимаются, рассматриваются, затем назначается собеседование. Мест ограниченное число.",
    ctaPrimary: "Подать заявку",
    ctaSecondary: "О программе",
    whyKicker: "01",
    whyTitle: "Что даёт участие",
    whyItalic: "Работа в течение сезона, не разовое занятие.",
    benefits: [
      { title: "Соревнования FTC", text: "Робот по правилам FIRST, Autonomous и TeleOp. Поле — на площадке школы." },
      { title: "Ответственность", text: "У каждого участника есть роль и сроки. Работа учитывается." },
      { title: "Медиа", text: "Материалы для официальных каналов команды: текст, фото, видео." },
      { title: "Дизайн", text: "Графика, мерч и материалы мероприятий — в айдентике школы." },
      { title: "Мероприятия", text: "Скриммидж, outreach и официальные дни FTC." },
      { title: "Портфолио", text: "К концу сезона — конкретные работы: код, проект, медиа или организация." },
    ],
    rolesKicker: "02",
    rolesTitle: "Роли в команде",
    rolesItalic: "В заявке укажите одно основное направление.",
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
      { n: "01", title: "Заявка", text: "Заполните форму полностью: школа, роль, опыт." },
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
    unisTitle: "Образовательный трек",
    unisItalic: "Опыт FTC учитывается при поступлении.",
    unisLead: "Перечисленные вузы — ориентир, а не список официальных партнёров.",
    unis: [...SHARED_UNIS.ru],
    partnersKicker: "07",
    partnersTitle: "Партнёры",
    partnersItalic: "Школа и экосистема FIRST.",
    partnersLead: "Сезонные спонсоры указываются отдельно. Связи с Tesla или иными брендами нет.",
    partners: ["K.E.R.N School", "FIRST", "BIOBUZZ · RTX", "Партнёр сезона"],
    houston: "FIRST Championship · Houston",
    formKicker: "08",
    formTitle: "Форма заявки",
    formLead: "Заполните все обязательные поля. Ответ придёт в Instagram или Telegram.",
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
    nav: { why: "Programme", roles: "Roles", season: "Season", who: "Requirements", apply: "Apply" },
    apply: "Submit application",
    heroEyebrow: "K.E.R.N School · Astana",
    heroTitle: "K.E.R.N FTC",
    heroItalic: "Team recruitment · 2026–2027",
    heroLead:
      "Applications are open for the school FIRST Tech Challenge team. Tracks: robotics, media, design, and operations.",
    heroBody:
      "Applications are reviewed, then shortlisted candidates are invited to interview. Places are limited.",
    ctaPrimary: "Submit application",
    ctaSecondary: "Programme",
    whyKicker: "01",
    whyTitle: "What the season includes",
    whyItalic: "Sustained work across the year, not a one-off class.",
    benefits: [
      { title: "FTC competition", text: "A robot under FIRST rules, Autonomous and TeleOp. The field is at the school." },
      { title: "Accountability", text: "Each member has a role and deadlines. Work is recorded." },
      { title: "Media", text: "Material for official team channels: writing, photo, video." },
      { title: "Design", text: "Graphics, merch, and event materials within the school identity." },
      { title: "Events", text: "Scrimmage, outreach, and official FTC days." },
      { title: "Portfolio", text: "Concrete work by the end of the season: code, project, media, or operations." },
    ],
    rolesKicker: "02",
    rolesTitle: "Roles",
    rolesItalic: "Select one primary track in the form.",
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
      { n: "01", title: "Application", text: "Complete the form: school, role, experience." },
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
    unisTitle: "Academic path",
    unisItalic: "FTC work can support later applications.",
    unisLead: "The universities below are a reference, not a list of official partners.",
    unis: [...SHARED_UNIS.en],
    partnersKicker: "07",
    partnersTitle: "Partners",
    partnersItalic: "The school and the FIRST programme.",
    partnersLead: "Season sponsors are listed separately. There is no affiliation with Tesla or similar brands.",
    partners: ["K.E.R.N School", "FIRST", "BIOBUZZ · RTX", "Season partner"],
    houston: "FIRST Championship · Houston",
    formKicker: "08",
    formTitle: "Application form",
    formLead: "Complete every required field. We reply on Instagram or Telegram.",
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
