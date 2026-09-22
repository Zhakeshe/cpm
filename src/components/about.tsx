export function About() {
  return (
    <section id="about" className="bg-[#f4f1ea]">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-semibold text-navy sm:text-[2.4rem] sm:leading-tight">
            Что такое FTC Scrimmage
          </h2>
          <p className="mt-6 text-[17px] leading-8 text-ink/80">
            K.E.R.N Scrimmage — это тренировочные матчи для школьных FTC-команд.
            Не отборочный турнир FIRST и не квалификация: поле, судья по ситуации,
            время на перенастройку робота.
          </p>
          <p className="mt-4 text-[17px] leading-8 text-ink/80">
            Имеет смысл приехать, если нужно проверить программу Autonomous,
            управление в TeleOp или просто понять, как команда работает под таймером.
          </p>
        </div>
      </div>
    </section>
  );
}
