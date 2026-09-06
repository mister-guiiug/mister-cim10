import { useState, type FormEvent } from 'react';
import { MAX_SESSIONS } from '../../lib/app-store';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useDialog } from '../../hooks/useDialog';
import { useI18n } from '../../i18n';

/**
 * Les dossiers enregistrés — « retrouver celui d'hier ».
 *
 * CE QUI MANQUAIT. L'app ne gardait qu'UN plan de travail : le compte-rendu en
 * cours et ses diagnostics retenus. Passer au patient suivant voulait dire
 * « Nouvelle session », donc effacer le précédent — sans moyen d'y revenir.
 * `LS_KEYS.SESSIONS` était annoncé « réservé » dans le README, mais n'existait
 * plus dans le code : la fonction n'avait même pas de place où atterrir.
 *
 * CINQ PLACES, ET PAS UNE DE PLUS. C'est le chiffre que le README annonçait
 * déjà, et il n'est pas arbitraire : au-delà, une liste plate sans recherche ni
 * dossiers cesse d'être un raccourci pour devenir un second problème de
 * rangement. Un nom déjà pris remplace son entrée au lieu d'en manger une
 * seconde.
 */
export function SessionsPanel() {
  const sessions = useWorkspaceStore(s => s.sessions);
  const saveSession = useWorkspaceStore(s => s.saveSession);
  const openSession = useWorkspaceStore(s => s.openSession);
  const deleteSession = useWorkspaceStore(s => s.deleteSession);
  const crText = useWorkspaceStore(s => s.crText);
  const validated = useWorkspaceStore(s => s.validated);
  const dialog = useDialog();
  const { t, locale } = useI18n();

  const [name, setName] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Rien à enregistrer tant que le plan de travail est vide : un dossier sans
  // compte-rendu ni diagnostic n'est pas un dossier.
  const hasWork = crText.trim() !== '' || validated.length > 0;
  const canSave = hasWork && name.trim() !== '';

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    const result = saveSession(name);
    if (!result.ok) return;
    setName('');
    setFeedback(result.replaced ? t('sessions.replaced') : t('sessions.saved'));
  };

  const handleOpen = async (id: string, sessionName: string) => {
    if (
      await dialog.confirm(t('sessions.openConfirm', { name: sessionName }))
    ) {
      openSession(id);
      setFeedback(t('sessions.opened', { name: sessionName }));
    }
  };

  const handleDelete = async (id: string, sessionName: string) => {
    if (
      await dialog.confirm(t('sessions.deleteConfirm', { name: sessionName }))
    ) {
      deleteSession(id);
      setFeedback(t('sessions.deleted', { name: sessionName }));
    }
  };

  const dateFormat = locale === 'fr' ? 'fr-FR' : 'en-GB';

  return (
    <details className="sessions-block">
      <summary className="sessions-summary">
        <span className="sessions-summary-title">{t('sessions.title')}</span>
        <span className="sessions-summary-hint">
          {sessions.length > 1
            ? t('sessions.countMany', { count: sessions.length })
            : t('sessions.countOne', { count: sessions.length })}
        </span>
      </summary>
      <div className="sessions-body">
        <form className="sessions-save-row" onSubmit={handleSave}>
          <input
            type="text"
            className="session-name-inp"
            placeholder={t('sessions.namePlaceholder')}
            aria-label={t('sessions.nameAria')}
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={60}
          />
          <button type="submit" className="secondary" disabled={!canSave}>
            {t('sessions.save')}
          </button>
        </form>
        {!hasWork && <p className="hint">{t('sessions.nothingToSave')}</p>}
        {sessions.length >= MAX_SESSIONS && (
          <p className="hint">{t('sessions.full', { max: MAX_SESSIONS })}</p>
        )}
        {feedback && (
          <p className="hint" role="status">
            {feedback}
          </p>
        )}
        {sessions.length === 0 ? (
          <p className="sessions-empty">{t('sessions.empty')}</p>
        ) : (
          <ul className="sessions-list" role="list">
            {sessions.map(session => (
              <li key={session.id} className="session-item">
                <span className="session-info">
                  <span className="session-name">{session.name}</span>
                  <span className="session-meta">
                    {t('sessions.meta', {
                      date: new Date(session.savedAt).toLocaleString(
                        dateFormat
                      ),
                      count: session.validated.length,
                    })}
                  </span>
                </span>
                <span className="session-actions">
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => void handleOpen(session.id, session.name)}
                  >
                    {t('sessions.open')}
                  </button>
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => void handleDelete(session.id, session.name)}
                  >
                    {t('common.remove')}
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}
