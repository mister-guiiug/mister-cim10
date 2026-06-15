/**
 * Barre de navigation inférieure (mobile-first), sur le principe de miss-supaboss :
 * toujours visible, accessible au pouce, item actif mis en avant. Couvre les
 * routes principales ; le tiroir (en-tête) reste pour le thème et le statut.
 */
import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';

interface NavItem {
  to: string;
  label: string;
  end: boolean;
  icon: ReactNode;
}

const HomeIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
  </svg>
);

const SettingsIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v3M12 20v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M1 12h3M20 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
  </svg>
);

const HelpIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M9.2 9a2.8 2.8 0 0 1 5.4 1c0 1.8-2.6 2.2-2.6 4" />
    <line x1="12" y1="17.5" x2="12.01" y2="17.5" />
  </svg>
);

const ITEMS: NavItem[] = [
  { to: '/', label: 'Accueil', end: true, icon: HomeIcon },
  { to: '/parametres', label: 'Paramètres', end: false, icon: SettingsIcon },
  { to: '/aide', label: 'Aide', end: false, icon: HelpIcon },
];

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Navigation principale">
      {ITEMS.map(({ to, label, end, icon }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `bottom-nav-item${isActive ? ' is-active' : ''}`
          }
        >
          <span className="bottom-nav-icon">{icon}</span>
          <span className="bottom-nav-label">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
