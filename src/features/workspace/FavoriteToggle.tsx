import { useAnnouncer } from '@mister-guiiug/dev-pwa-config/react/a11y';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { MAX_FAVORIS, type ResultatBascule } from '../../lib/favoris';
import { useI18n } from '../../i18n';

interface FavoriteToggleProps {
  code: string;
  label: string;
  source?: 'local' | 'api';
  /**
   * Où dire ce qui s'est passé. Par défaut la région d'annonce de l'app ; le
   * panneau des suggestions passe la sienne, qui annonce déjà « retenu » et
   * « rejeté » — deux régions qui parlent en même temps se couvrent.
   */
  onAnnounce?: (message: string) => void;
  /**
   * Après la bascule. Le panneau des favoris s'en sert : y retirer un favori
   * fait disparaître la ligne — et l'étoile qui avait le focus avec elle.
   */
  onToggled?: (resultat: ResultatBascule) => void;
}

/**
 * L'étoile : met un code en favori, ou l'en retire.
 *
 * UN BOUTON BASCULE, donc un nom FIXE (« Favori E11.9 ») et un état porté par
 * `aria-pressed`. Changer le nom selon l'état (« Ajouter… » / « Retirer… »)
 * ferait entendre une action là où il y a un état, et l'état serait dit deux
 * fois. Le code est dans le nom : dans une liste de dix étoiles, « Favori »
 * seul ne dirait pas laquelle on tient.
 *
 * LISTE PLEINE : l'étoile reste focalisable (`aria-disabled`, pas `disabled`)
 * pour pouvoir dire POURQUOI elle ne fait rien. Un bouton désactivé se tait, et
 * perd le focus sous le doigt de qui venait de l'atteindre.
 */
export function FavoriteToggle({
  code,
  label,
  source = 'local',
  onAnnounce,
  onToggled,
}: FavoriteToggleProps) {
  const estFavori = useWorkspaceStore(s =>
    s.favorites.some(f => f.code === code)
  );
  const nombre = useWorkspaceStore(s => s.favorites.length);
  const plein = !estFavori && nombre >= MAX_FAVORIS;
  const toggleFavorite = useWorkspaceStore(s => s.toggleFavorite);
  const annoncer = useAnnouncer();
  const { t } = useI18n();

  const dire = (message: string, urgent = false) => {
    if (onAnnounce) onAnnounce(message);
    else annoncer(message, urgent ? 'assertive' : 'polite');
  };

  const basculer = () => {
    const resultat = toggleFavorite({ code, label, source });
    if (resultat === 'ajoute') dire(t('favorites.added', { code }));
    else if (resultat === 'retire') dire(t('favorites.removed', { code }));
    else dire(t('favorites.full', { max: MAX_FAVORIS }), true);
    onToggled?.(resultat);
  };

  return (
    <button
      type="button"
      className={`ghost star-toggle${estFavori ? ' is-favorite' : ''}`}
      aria-pressed={estFavori}
      aria-disabled={plein || undefined}
      aria-label={t('favorites.toggleAria', { code })}
      title={
        plein
          ? t('favorites.full', { max: MAX_FAVORIS })
          : estFavori
            ? t('favorites.remove')
            : t('favorites.add')
      }
      onClick={basculer}
    >
      <svg
        aria-hidden="true"
        width={16}
        height={16}
        viewBox="0 0 16 16"
        fill={estFavori ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={1.3}
        strokeLinejoin="round"
      >
        <path d="M8 1.6l1.93 3.92 4.32.63-3.13 3.05.74 4.3L8 11.47l-3.86 2.03.74-4.3L1.75 6.15l4.32-.63z" />
      </svg>
    </button>
  );
}
