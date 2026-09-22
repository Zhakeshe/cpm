import { Bot, Gamepad2, MessagesSquare, Trophy } from "lucide-react";

const cards = [
  {
    icon: Trophy,
    title: "Реальные матчи",
    text: "Проверка робота в условиях, приближенных к официальным FTC-матчам.",
  },
  {
    icon: Bot,
    title: "Autonomous",
    text: "Возможность протестировать Autonomous и стабильность программы.",
  },
  {
    icon: Gamepad2,
    title: "TeleOp",
    text: "Проверка управления, механизмов и стратегии команды.",
  },
  {
    icon: MessagesSquare,
    title: "FTC Community",
    text: "Общение и обмен опытом с другими FTC-командами.",
  },
];

export function Why() {
  return (
    <section className="bg-paper">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
          Преимущества
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-navy sm:text-4xl">
          Почему стоит участвовать
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <article
              key={card.title}
              className="border border-mist bg-white p-6 transition duration-200 hover:-translate-y-0.5 hover:border-navy/20 hover:shadow-[0_12px_40px_rgba(6,45,89,0.08)]"
            >
              <card.icon className="text-navy" size={22} />
              <h3 className="mt-4 text-lg font-semibold text-navy">{card.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{card.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
