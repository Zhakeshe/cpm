const cards = [
  {
    title: "Реальные матчи",
    text: "Короткий цикл: выезд на поле, Autonomous, TeleOp, замечания, снова очередь.",
  },
  {
    title: "Autonomous",
    text: "Прогон траекторий и стабильности без сюрпризов официального inspection.",
  },
  {
    title: "TeleOp",
    text: "Intake, scoring, drive и связь драйверов — всё, что ломается только в матче.",
  },
  {
    title: "Другие команды",
    text: "Можно посмотреть чужие решения по BIOBUZZ и спокойно задать вопросы.",
  },
];

export function Why() {
  return (
    <section className="border-y border-navy/10 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-semibold text-navy">Зачем приезжать</h2>
        <div className="mt-8 grid gap-x-12 gap-y-8 sm:grid-cols-2">
          {cards.map((card) => (
            <article key={card.title} className="max-w-md">
              <h3 className="text-lg font-semibold text-navy">{card.title}</h3>
              <p className="mt-2 text-[15px] leading-7 text-muted">{card.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
