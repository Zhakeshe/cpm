export function About() {
  return (
    <section id="about" className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
              О мероприятии
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-navy sm:text-4xl">
              Что такое FTC Scrimmage?
            </h2>
          </div>
          <div className="space-y-5 text-base leading-8 text-muted">
            <p>
              K.E.R.N FTC Scrimmage — это тренировочные матчи для FTC-команд,
              где участники могут проверить робота, стратегию и программирование
              в условиях, максимально приближенных к настоящему соревнованию.
            </p>
            <p>
              Scrimmage помогает командам найти слабые места до официальных турниров,
              обменяться опытом и улучшить взаимодействие внутри команды.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
