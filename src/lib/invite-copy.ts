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
  nav: { why: string; roles: string; who: string; apply: string };
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
    nav: { why: "Неге біз", roles: "Рөлдер", who: "Кімге", apply: "Өтініш" },
    apply: "Өтініш жіберу",
    heroEyebrow: "K.E.R.N School · Астана · 2026 маусым",
    heroTitle: "Командаға",
    heroItalic: "орын бар",
    heroLead: "Робот құрастыратын, контент түсіретін, бренд жасайтын және жарысты ұйымдастыратын оқушыларды іздейміз.",
    heroBody:
      "FTC — тек темір мен код емес. Бұл бір экипаж: пит, камера, дедлайн, дауыс. K.E.R.N-де сен тек мүше емессің — маусымның авторысың.",
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
    formKicker: "04  /  Өтініш",
    formTitle: "Өзіңді таныстыр.",
    formLead: "Мектебіңді, рөліңді және неге дәл сен екеніңді жаз. Әр өтінішті оқимыз.",
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
    nav: { why: "Зачем мы", roles: "Роли", who: "Кому", apply: "Заявка" },
    apply: "Оставить заявку",
    heroEyebrow: "K.E.R.N School · Астана · сезон 2026",
    heroTitle: "В команде",
    heroItalic: "есть место",
    heroLead: "Ищем учеников, которые хотят собирать роботов, снимать, делать бренд и вести сезон вместе.",
    heroBody:
      "FTC — это не только железо и код. Это экипаж: пит, камера, дедлайн, голос. В K.E.R.N ты не «участник кружка» — ты автор сезона.",
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
    formKicker: "04  /  Заявка",
    formTitle: "Расскажи о себе.",
    formLead: "Школа, роль и почему именно ты. Каждую заявку читаем.",
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
    nav: { why: "Why us", roles: "Roles", who: "Who", apply: "Apply" },
    apply: "Apply now",
    heroEyebrow: "K.E.R.N School · Astana · 2026 season",
    heroTitle: "There is a seat",
    heroItalic: "on the crew",
    heroLead: "We want students who build robots, shoot, brand, and run a season together.",
    heroBody:
      "FTC is not only metal and code. It is a crew: the pit, the camera, the deadline, the voice. At K.E.R.N you are not a club member — you author the season.",
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
    formKicker: "04  /  Application",
    formTitle: "Introduce yourself.",
    formLead: "School, role, and why it is you. We read every form.",
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
