import { PageHero, PAGE_HERO_TEXT } from "@/components/common/PageHero";

export function DiaryHero() {
  return (
    <PageHero
      storageKey="diary-hero-src"
      typeKey="diary-hero-type"
      badge={PAGE_HERO_TEXT.diary.badge}
      title={PAGE_HERO_TEXT.diary.title}
      subtitle={PAGE_HERO_TEXT.diary.subtitle}
    />
  );
}
