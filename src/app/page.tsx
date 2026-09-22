import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { About } from "@/components/about";
import { Biobuzz } from "@/components/biobuzz";
import { Venue } from "@/components/venue";
import { RegisterForm } from "@/components/register-form";
import { Footer } from "@/components/footer";
import { EVENT } from "@/lib/constants";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <About />
        <Biobuzz />
        <Venue />
        <section id="register" className="bg-paper">
          <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-20">
            <h2 className="text-3xl font-semibold tracking-[-0.03em] text-navy">
              Регистрация команды
            </h2>
            <p className="mt-3 text-[16px] leading-7 text-muted">
              Старт {EVENT.dateLabel} в {EVENT.timeLabel}. Введите номер или название —
              карточку подтянем из FTCScout. Если команды ещё нет в FIRST, заполните
              поля сами.
            </p>
            <div className="mt-8">
              <RegisterForm />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
