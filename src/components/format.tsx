const steps = [
  { n: "01", title: "Регистрация команды" },
  { n: "02", title: "Подтверждение участия" },
  { n: "03", title: "Подготовка робота" },
  { n: "04", title: "Scrimmage matches" },
  { n: "05", title: "Обратная связь и networking" },
];

export function Format() {
  return (
    <section id="format" className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
          Формат
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-navy sm:text-4xl">
          Как проходит участие
        </h2>
        <ol className="mt-12 grid gap-0 md:grid-cols-5">
          {steps.map((step, index) => (
            <li
              key={step.n}
              className="relative border-t border-mist px-4 py-6 md:border-l md:border-t-0 md:px-5"
            >
              {index < steps.length - 1 ? (
                <span className="absolute right-0 top-8 hidden h-px w-6 bg-gold/60 md:block" />
              ) : null}
              <p className="text-sm font-semibold tracking-[0.2em] text-gold">{step.n}</p>
              <p className="mt-3 text-base font-medium leading-6 text-navy">{step.title}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
