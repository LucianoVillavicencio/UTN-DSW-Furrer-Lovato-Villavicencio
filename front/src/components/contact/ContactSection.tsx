import Container from "../common/Container";
import ContactHeader from "./ContactHeader";
import ContactForm from "./ContactForm";
import ContactChannels from "./ContactChannels";

const ContactSection = () => {
  return (
    <section className="relative py-16 lg:py-24 bg-background overflow-hidden">
      {/* Background ambient lighting glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-150 h-87.5 bg-primary/10 blur-[120px] rounded-full" />

      <Container>
        <ContactHeader />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-7">
            <ContactForm />
          </div>

          <div className="lg:col-span-5">
            <ContactChannels />
          </div>
        </div>
      </Container>
    </section>
  );
};

export default ContactSection;
