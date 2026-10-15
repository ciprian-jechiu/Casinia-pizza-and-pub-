import { notFound } from "next/navigation";
import { hasLocale } from "@/lib/i18n";
import { IntroScene } from "@/components/home/IntroScene";
import { StoryScene } from "@/components/home/StoryScene";
import { EventsScene } from "@/components/home/EventsScene";
import { ReviewsScene } from "@/components/home/ReviewsScene";
import { FinaleScene } from "@/components/home/FinaleScene";
import { StepScroll } from "@/components/home/StepScroll";

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <>
      <IntroScene />
      <StoryScene />
      <EventsScene />
      <ReviewsScene />
      <FinaleScene />
      <StepScroll />
    </>
  );
}
