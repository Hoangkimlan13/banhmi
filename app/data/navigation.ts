import { dictionary, type Locale } from "../i18n";

export function getNavItems(locale: Locale) {
  const t = dictionary[locale];

  return [
    { href: "/", label: t.home },
    { href: "/menu", label: t.menu },
    { href: "/store", label: t.store },
    { href: "/about", label: t.about },
    { href: "/news", label: t.news },
    { href: "/contact", label: t.contact },
  ];
}

export const navItems = getNavItems("en");
