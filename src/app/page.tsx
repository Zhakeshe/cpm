import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { About } from "@/components/about";
import { Biobuzz } from "@/components/biobuzz";
import { Why } from "@/components/why";
import { Format } from "@/components/format";
import { Venue } from "@/components/venue";
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
        <Biobuzz />
        <Why />
        <Format />
        <Venue />
        <section id="register" className="bg-[#f4f1ea]">
          <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
            <h2 className="text-3xl font-semibold text-navy">Регистрация команды</h2>
            <p className="mt-4 text-[16px] leading-7 text-muted">
              Если команда уже есть в FIRST, начните с номера или названия — подтянем карточку
              из FTCScout. Если номера ещё нет, заполните поля вручную.
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
