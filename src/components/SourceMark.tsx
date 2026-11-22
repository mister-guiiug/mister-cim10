/**
 * Marque visuelle d'un référentiel : livre pour le dictionnaire CIM-10
 * embarqué, nuage pour l'OMS (CIM-11). Pas de lucide : le reste de l'app
 * dessine ses icônes en SVG inline (micro, étoile, croix).
 */
interface SourceMarkProps {
  source: 'local' | 'api';
  /** Taille du carré viewBox, en px CSS. */
  size?: number;
  className?: string;
}

export function SourceMark({ source, size = 14, className }: SourceMarkProps) {
  return (
    <svg
      className={className}
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {source === 'api' ? (
        // Nuage : la classification arrive par la passerelle / le réseau.
        <path d="M12.4 12.5H4.6A2.6 2.6 0 0 1 4.3 7.4 3.5 3.5 0 0 1 11 6.2a2.2 2.2 0 0 1 1.4 6.3z" />
      ) : (
        // Livre ouvert : le dictionnaire embarqué dans la page.
        <>
          <path d="M2.5 3.2h4.2A2.3 2.3 0 0 1 9 5.5v7.3a1.6 1.6 0 0 0-1.5-1.1H2.5z" />
          <path d="M13.5 3.2H9.3A2.3 2.3 0 0 0 7 5.5v7.3a1.6 1.6 0 0 1 1.5-1.1h5z" />
        </>
      )}
    </svg>
  );
}
