import { Clock } from "lucide-react";
import Container from "../common/Container";
import ContactForm from "./ContactForm";
import ContactChannels from "./ContactChannels";

const ContactSection = () => {
  return (
    <section className="bg-background py-16 lg:py-24">
      <Container>
        <div className="mb-8 flex items-center justify-center gap-2 text-sm text-text-muted">
          <Clock className="h-4 w-4 text-primary shrink-0" />
          <span className="font-body ">
            Respuesta garantizada en <strong className="text-primary font-semibold">24 horas hábiles</strong>
          </span>
        </div>

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
