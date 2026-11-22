/**
 * Badge CIM-10 / CIM-11 avec l'icône du référentiel. Un seul endroit pour
 * suggestions, retenus et favoris — le titre long reste en `title`.
 */
import { useI18n } from '../i18n';
import { SourceMark } from './SourceMark';

interface SourceBadgeProps {
  source?: 'local' | 'api';
}

export function SourceBadge({ source = 'local' }: SourceBadgeProps) {
  const { t } = useI18n();
  const api = source === 'api';
  return (
    <span
      className={`source-badge source-badge--${source}`}
      title={api ? t('results.sourceApiTitle') : t('results.sourceLocalTitle')}
    >
      <SourceMark source={source} size={12} />
      {api ? t('results.badgeIcd11') : t('results.badgeIcd10')}
    </span>
  );
}
