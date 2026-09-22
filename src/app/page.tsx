import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { About } from "@/components/about";
import { Why } from "@/components/why";
import { Format } from "@/components/format";
import { Info } from "@/components/info";
import { RegisterForm } from "@/components/register-form";
import { Faq } from "@/components/faq";
import { Footer } from "@/components/footer";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <About />
        <Why />
        <Format />
        <Info />
        <section id="register" className="bg-paper">
          <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
              Заявка
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-navy sm:text-4xl">
              Регистрация команды
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted sm:text-base">
              Заполните форму, чтобы зарегистрировать команду на K.E.R.N FTC Scrimmage.
              После отправки заявки организаторы свяжутся с капитаном команды.
            </p>
            <div className="mt-8">
              <RegisterForm />
            </div>
          </div>
        </section>
        <Faq />
      </main>
      <Footer />
    </>
  );
}
