const steps = [
  "Заявка через форму — капитана пишут в WhatsApp.",
  "Подтверждение слота, когда будет известен список команд.",
  "Робот и драйверы к дню мероприятия. Полный inspection как на qualifier не обещаем заранее.",
  "Матчи на поле BIOBUZZ и короткое обсуждение после.",
];

export function Format() {
  return (
    <section id="format" className="bg-[#f4f1ea]">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[240px_1fr]">
        <h2 className="text-2xl font-semibold text-navy">Как это проходит</h2>
        <ol className="space-y-5">
          {steps.map((step, index) => (
            <li key={step} className="flex gap-4 text-[16px] leading-7 text-ink/80">
              <span className="w-6 shrink-0 font-semibold text-navy">{index + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
