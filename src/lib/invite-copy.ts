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

export const INVITE_COPY: Record<Locale, InviteCopy> = {
  kk: {
    metaTitle: "K.E.R.N FTC командасына қосыл",
    nav: { why: "Неге біз", roles: "Рөлдер", season: "Маусым", who: "Кімге", apply: "Өтініш" },
    apply: "Өтініш жіберу",
    heroEyebrow: "K.E.R.N School · Астана · 2026 маусым",
    heroTitle: "Командаға",
    heroItalic: "орын бар",
    heroLead: "Бұл үйірме емес. Өтініш → іріктеу → сұхбат. Tesla сияқты: бір экипаж, бір стандарт, бәрінен бөлек.",
    heroBody:
      "FTC — темір мен код қана емес. Номинация, топ университет, серіктес, Houston. K.E.R.N-де сен маусымның авторысың.",
    ctaPrimary: "Өтініш жіберу",
    ctaSecondary: "Рөлдерді көру",
    whyKicker: "01  /  Неге бізбен",
    whyTitle: "Мектеп үйірмесі емес.",
    whyItalic: "Нағыз маусым.",
    benefits: [
      { title: "Нағыз FTC", text: "Жарыс роботы, FIRST өрісі, Autonomous пен TeleOp — жаттығу емес, жұмыс процесі." },
      { title: "Команда және лидерлік", text: "Рөліңді аласың, дедлайн ұстайсың, кіші топты жүргізесің." },
      { title: "Медиа тәжірибе", text: "Тірі команда үшін түсіресің, жазасың, жариялайсың — сынып жобасы емес." },
      { title: "Дизайн және бренд", text: "Мерч, сторис, пит-графика — K.E.R.N дауысын сен саласың." },
      { title: "Жарыстар мен іс-шаралар", text: "Скриммидж, outreach, ресми FTC күндері — алаңда боласың." },
      { title: "Портфолио", text: "Маусым соңында көрсетуге болатын жұмыс: фото, монтаж, код, ұйымдастыру." },
    ],
    rolesKicker: "02  /  Кім керек",
    rolesTitle: "Робототехника.",
    rolesItalic: "Және оны көрсететін адамдар.",
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
    whoKicker: "03  /  Кім өтініш бере алады",
    whoTitle: "Портфолио міндетті емес.",
    whoItalic: "Көзқарас міндетті.",
    whoLead: "Робототехника, медиа, дизайн немесе іс-шара — қайсысы жақын болса да. Маңыздысы: келесің және бітіресің.",
    who: [
      "Робототехника, медиа, дизайн немесе командалық жұмысқа қызығатын оқушылар",
      "Жауапты және уәдесін ұстайтындар",
      "Командада жұмыс істеп, дедлайнға үлгеретіндер",
      "Жаңа құралды үйренуге ашықтар",
    ],
    pathKicker: "04  /  Қалай өтесің",
    pathTitle: "Өтініш жеткіліксіз.",
    pathItalic: "Іріктеу бар.",
    pathLead: "Кім көбірек келсе, соғұрлым қатаң қараймыз. Кейін — сұхбат.",
    path: [
      { n: "01", title: "Өтініш", text: "Форманы адал толтыр. Мектеп, рөл, не әкелесің." },
      { n: "02", title: "Іріктеу", text: "Әр өтінішті оқимыз. Бәрі өтпейді — және ол дұрыс." },
      { n: "03", title: "Сұхбат", text: "Қысқа әңгіме. Көзқарас, жауапкершілік, командаға сай ма." },
    ],
    nomsKicker: "05  /  Номинациялар",
    nomsTitle: "Жүлде үшін де",
    nomsItalic: "жиналамыз.",
    nomsLead: "FTC — тек матч емес. Judge-тар көретін жұмыс: код, бренд, outreach, басқару.",
    noms: [
      { name: "Inspire", text: "Команданың бүкіл бет-бейнесі." },
      { name: "Think", text: "Инженерлік дәптер мен шешім." },
      { name: "Connect", text: "Серіктестік пен outreach." },
      { name: "Innovate", text: "Өзің ойлап тапқан шешім." },
      { name: "Control", text: "Программа мен Autonomous." },
      { name: "Motivate", text: "Команданың мәдениеті." },
      { name: "Design", text: "Механикалық дизайн." },
    ],
    unisKicker: "06  /  Топ университет",
    unisTitle: "Маусымнан кейін",
    unisItalic: "жол ашық.",
    unisLead: "FTC портфолиосы — NU, KBTU, AITU және әрі қарай. Біз жалған серіктестік жазбаймыз. Жолды көрсетеміз.",
    unis: [
      { name: "Nazarbayev University", place: "Астана" },
      { name: "KBTU", place: "Алматы" },
      { name: "AITU", place: "Астана" },
      { name: "SDU", place: "Қонаев" },
      { name: "Satbayev University", place: "Алматы" },
      { name: "ENU", place: "Астана" },
    ],
    partnersKicker: "07  /  Спонсорлар",
    partnersTitle: "Кіммен тұрамыз.",
    partnersItalic: "Кіммен өсеміз.",
    partnersLead: "Мектеп, FIRST, маусым серіктесі. Tesla сияқты бренд емес — сондай деңгейдегі тәртіп.",
    partners: ["K.E.R.N School", "FIRST", "BIOBUZZ · RTX", "Маусым серіктесі"],
    houston: "North star · FIRST Championship · Houston",
    formKicker: "08  /  Өтініш",
    formTitle: "Өзіңді таныстыр.",
    formLead: "Мектеп, рөл, неге дәл сен. Әр өтініш оқылады. Кейін — іріктеу және сұхбат.",
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
      superpower: "Сенің ерекшелігің — командаға не әкелесің",
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
    closeKicker: "Соңғы қадам",
    closeTitle: "K.E.R.N FTC-тің",
    closeItalic: "бөлігі бол",
    closeText: "Форманы толтыр — біз хабарласамыз. Логотип сол қалпы, команда жаңа.",
    footerNote: "K.E.R.N School · Астана · FIRST Tech Challenge",
  },
  ru: {
    metaTitle: "В команду K.E.R.N FTC",
    nav: { why: "Зачем мы", roles: "Роли", season: "Сезон", who: "Кому", apply: "Заявка" },
    apply: "Оставить заявку",
    heroEyebrow: "K.E.R.N School · Астана · сезон 2026",
    heroTitle: "В команде",
    heroItalic: "есть место",
    heroLead: "Это не кружок. Заявка → отбор → собеседование. Как Tesla: один экипаж, один стандарт, не как все.",
    heroBody:
      "FTC — не только железо и код. Номинации, топ-университеты, партнёры, Houston. В K.E.R.N ты автор сезона.",
    ctaPrimary: "Оставить заявку",
    ctaSecondary: "Смотреть роли",
    whyKicker: "01  /  Зачем с нами",
    whyTitle: "Не школьный кружок.",
    whyItalic: "Настоящий сезон.",
    benefits: [
      { title: "Настоящий FTC", text: "Соревновательный робот, поле FIRST, Autonomous и TeleOp — рабочий процесс, не макет." },
      { title: "Команда и лидерство", text: "Берёшь роль, держишь дедлайн, ведёшь небольшую группу." },
      { title: "Медиа-опыт", text: "Снимаешь, пишешь и публикуешь для живой команды — не для оценки в четверти." },
      { title: "Дизайн и бренд", text: "Мерч, сторис, графика питa — голос K.E.R.N собираешь ты." },
      { title: "События и старты", text: "Скриммидж, outreach, официальные дни FTC — ты на площадке." },
      { title: "Портфолио", text: "К концу сезона есть что показать: фото, монтаж, код, организация." },
    ],
    rolesKicker: "02  /  Кого ищем",
    rolesTitle: "Робототехника.",
    rolesItalic: "И те, кто её показывает.",
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
    whoKicker: "03  /  Кто может подать",
    whoTitle: "Портфолио не обязательно.",
    whoItalic: "Взгляд — да.",
    whoLead: "Робототехника, медиа, дизайн или ивенты — что ближе. Главное: приходишь и доделываешь.",
    who: [
      "Ученики, которым близки роботы, медиа, дизайн или командная работа",
      "Ответственные, кто держит слово",
      "Готовые работать в команде и в срок",
      "Открытые к новым инструментам",
    ],
    pathKicker: "04  /  Как проходишь",
    pathTitle: "Заявки мало.",
    pathItalic: "Есть отбор.",
    pathLead: "Чем больше заявок — тем жёстче смотрим. Потом собеседование.",
    path: [
      { n: "01", title: "Заявка", text: "Честно заполни форму. Школа, роль, что принесёшь." },
      { n: "02", title: "Отбор", text: "Каждую заявку читаем. Проходят не все — так и должно быть." },
      { n: "03", title: "Собеседование", text: "Короткий разговор. Взгляд, ответственность, подходишь ли экипажу." },
    ],
    nomsKicker: "05  /  Номинации",
    nomsTitle: "Собираемся и",
    nomsItalic: "под судей.",
    nomsLead: "FTC — не только матч. То, что видят судьи: код, бренд, outreach, управление.",
    noms: [
      { name: "Inspire", text: "Лицо всей команды." },
      { name: "Think", text: "Инженерный ноутбук и решения." },
      { name: "Connect", text: "Партнёры и outreach." },
      { name: "Innovate", text: "Своё решение, не копия." },
      { name: "Control", text: "Программа и Autonomous." },
      { name: "Motivate", text: "Культура команды." },
      { name: "Design", text: "Механический дизайн." },
    ],
    unisKicker: "06  /  Топ-университеты",
    unisTitle: "После сезона",
    unisItalic: "дорога дальше.",
    unisLead: "Портфолио FTC открывает NU, KBTU, AITU и дальше. Мы не рисуем фейковые партнёрства. Показываем трек.",
    unis: [
      { name: "Nazarbayev University", place: "Астана" },
      { name: "KBTU", place: "Алматы" },
      { name: "AITU", place: "Астана" },
      { name: "SDU", place: "Конаев" },
      { name: "Satbayev University", place: "Алматы" },
      { name: "ENU", place: "Астана" },
    ],
    partnersKicker: "07  /  Спонсоры",
    partnersTitle: "С кем стоим.",
    partnersItalic: "С кем растём.",
    partnersLead: "Школа, FIRST, партнёр сезона. Не бренд Tesla — дисциплина такого уровня.",
    partners: ["K.E.R.N School", "FIRST", "BIOBUZZ · RTX", "Партнёр сезона"],
    houston: "North star · FIRST Championship · Houston",
    formKicker: "08  /  Заявка",
    formTitle: "Расскажи о себе.",
    formLead: "Школа, роль, почему именно ты. Каждую заявку читаем. Дальше — отбор и собеседование.",
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
      superpower: "Чем ты отличаешься — что принесёшь команде",
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
    closeKicker: "Последний шаг",
    closeTitle: "Стань частью",
    closeItalic: "K.E.R.N FTC",
    closeText: "Заполни форму — мы свяжемся. Логотип тот же. Команда — новая глава.",
    footerNote: "K.E.R.N School · Астана · FIRST Tech Challenge",
  },
  en: {
    metaTitle: "Join the K.E.R.N FTC team",
    nav: { why: "Why us", roles: "Roles", season: "Season", who: "Who", apply: "Apply" },
    apply: "Apply now",
    heroEyebrow: "K.E.R.N School · Astana · 2026 season",
    heroTitle: "There is a seat",
    heroItalic: "on the crew",
    heroLead: "This is not a club. Apply → shortlist → interview. Tesla energy: one crew, one bar, not like everyone.",
    heroBody:
      "FTC is more than metal and code. Awards, top universities, partners, Houston. At K.E.R.N you author the season.",
    ctaPrimary: "Apply now",
    ctaSecondary: "See the roles",
    whyKicker: "01  /  Why with us",
    whyTitle: "Not a school club.",
    whyItalic: "A real season.",
    benefits: [
      { title: "Real FTC", text: "Competition robot, FIRST field, Autonomous and TeleOp — a working loop, not a mock." },
      { title: "Crew and leadership", text: "Own a role, keep a deadline, lead a small group." },
      { title: "Media that ships", text: "Film, write, and post for a live team — not a graded classroom brief." },
      { title: "Design and brand", text: "Merch, stories, pit graphics — you shape how K.E.R.N looks." },
      { title: "Events and match days", text: "Scrimmage, outreach, official FTC days — you are on the floor." },
      { title: "A portfolio", text: "Leave the season with proof: photos, edits, code, ops." },
    ],
    rolesKicker: "02  /  Who we need",
    rolesTitle: "Robotics.",
    rolesItalic: "And the people who show it.",
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
    whoKicker: "03  /  Who can apply",
    whoTitle: "No portfolio required.",
    whoItalic: "A point of view is.",
    whoLead: "Robotics, media, design, or events — whichever is yours. What matters: you show up and you finish.",
    who: [
      "Students drawn to robots, media, design, or working with a crew",
      "People who keep their word",
      "Ready to work in a team and hit a deadline",
      "Open to tools you have not used yet",
    ],
    pathKicker: "04  /  How you get in",
    pathTitle: "A form is not enough.",
    pathItalic: "There is a cut.",
    pathLead: "The more people apply, the tighter we read. Then an interview.",
    path: [
      { n: "01", title: "Apply", text: "Fill the form honestly. School, role, what you bring." },
      { n: "02", title: "Shortlist", text: "We read every file. Not everyone gets through — that is the point." },
      { n: "03", title: "Interview", text: "A short conversation. Point of view, grit, fit for the crew." },
    ],
    nomsKicker: "05  /  Awards",
    nomsTitle: "We build for",
    nomsItalic: "the judges too.",
    nomsLead: "FTC is not only the match. It is what judges see: code, brand, outreach, control.",
    noms: [
      { name: "Inspire", text: "The whole face of the team." },
      { name: "Think", text: "Engineering notebook and decisions." },
      { name: "Connect", text: "Partners and outreach." },
      { name: "Innovate", text: "A solution that is yours." },
      { name: "Control", text: "Software and Autonomous." },
      { name: "Motivate", text: "How the team lives." },
      { name: "Design", text: "Mechanical design." },
    ],
    unisKicker: "06  /  Top universities",
    unisTitle: "After the season",
    unisItalic: "the track stays open.",
    unisLead: "An FTC portfolio points to NU, KBTU, AITU and beyond. We do not invent partners. We show the road.",
    unis: [
      { name: "Nazarbayev University", place: "Astana" },
      { name: "KBTU", place: "Almaty" },
      { name: "AITU", place: "Astana" },
      { name: "SDU", place: "Konaev" },
      { name: "Satbayev University", place: "Almaty" },
      { name: "ENU", place: "Astana" },
    ],
    partnersKicker: "07  /  Sponsors",
    partnersTitle: "Who we stand with.",
    partnersItalic: "Who we grow with.",
    partnersLead: "The school, FIRST, a season partner. Not a Tesla logo — that level of discipline.",
    partners: ["K.E.R.N School", "FIRST", "BIOBUZZ · RTX", "Season partner"],
    houston: "North star · FIRST Championship · Houston",
    formKicker: "08  /  Application",
    formTitle: "Introduce yourself.",
    formLead: "School, role, why it is you. We read every form. Next: shortlist and interview.",
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
      superpower: "What is yours — what do you bring the crew",
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
    closeKicker: "Last step",
    closeTitle: "Become part of",
    closeItalic: "K.E.R.N FTC",
    closeText: "Fill the form — we will reach out. Same crest. New chapter.",
    footerNote: "K.E.R.N School · Astana · FIRST Tech Challenge",
  },
};

export function inviteRoleTitle(role: string, locale: Locale = "en") {
  const id = role as InviteRoleId;
  return INVITE_COPY[locale].roles[id]?.title ?? role;
}
