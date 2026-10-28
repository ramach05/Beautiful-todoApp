import { useTranslation } from 'react-i18next';

import { facebookIcon, githubIcon, linkedinIcon, telegramIcon } from '@/shared/ui/assets';

const links = [
  { href: 'https://github.com/ramach05', icon: githubIcon, label: 'GitHub' },
  { href: 'https://www.facebook.com/ramach05', icon: facebookIcon, label: 'Facebook' },
  { href: 'https://t.me/ramach05', icon: telegramIcon, label: 'Telegram' },
  { href: 'https://www.linkedin.com/in/ramach05/', icon: linkedinIcon, label: 'LinkedIn' },
];

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="mt-8 flex flex-col items-center gap-2 pb-6 text-lg">
      <div>&copy;{new Date().getFullYear()} Roman Kovalenko</div>
      <nav aria-label={t('footer.links_aria')}>
        <ul className="flex gap-3">
          {links.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                target="_blank"
                rel="noreferrer"
                aria-label={link.label}
                className="lift focus-ring block rounded-full p-1.5 hover:bg-ring-soft"
              >
                <img src={link.icon} alt={link.label} className="size-6" />
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </footer>
  );
}
