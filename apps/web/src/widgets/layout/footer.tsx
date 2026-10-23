import facebookIcon from '../../assets/images/svg/facebook.svg';
import githubIcon from '../../assets/images/svg/github.svg';
import linkedinIcon from '../../assets/images/svg/linkedin.svg';
import telegramIcon from '../../assets/images/svg/telegram.svg';

const links = [
  { href: 'https://github.com/ramach05', icon: githubIcon, label: 'GitHub' },
  { href: 'https://www.facebook.com/ramach05', icon: facebookIcon, label: 'Facebook' },
  { href: 'https://t.me/ramach05', icon: telegramIcon, label: 'Telegram' },
  { href: 'https://www.linkedin.com/in/ramach05/', icon: linkedinIcon, label: 'LinkedIn' },
];

export function Footer() {
  return (
    <footer className="mt-8 flex flex-col items-center gap-2 pb-6 text-lg">
      <div>&copy;{new Date().getFullYear()} Roman Kovalenko</div>
      <nav aria-label="Author links">
        <ul className="flex gap-3">
          {links.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="block rounded p-1 hover:bg-ring-soft"
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
