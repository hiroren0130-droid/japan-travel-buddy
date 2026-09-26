import ContactContent from "./ContactContent";
import { DEFAULT_LOCALE } from "@/lib/locale";
import { getMessages } from "@/lib/messages";

const messages = getMessages(DEFAULT_LOCALE).contactPage;

export const metadata = {
  title: messages.metadata.title,
  description: messages.metadata.description,
};

export default function ContactPage() {
  return <ContactContent />;
}
