/**
 * La config du socle, plus UNE exception — écrite ici parce qu'elle se justifie
 * ici.
 *
 * `jsx-a11y/no-redundant-roles` signale `<ul role="list">` : le rôle est bien
 * l'implicite de l'élément, donc « redondant » au sens du DOM. Il ne l'est pas
 * au sens des lecteurs d'écran. Safari RETIRE les sémantiques de liste dès que
 * `list-style: none` s'applique — VoiceOver n'annonce plus « liste, 4 éléments »,
 * et la navigation par listes ne trouve plus rien. Le rôle explicite les rend.
 *
 * Les cinq listes visées portent toutes `list-style: none` (`src/style.css` :
 * `.sessions-list`, `.suggestion-list`, `.validated-list`,
 * `.suggestion-compare-siblings`, `.suggestion-precisions ul`). Le cas est donc
 * constant, pas ponctuel — d'où un réglage de règle plutôt que sept
 * `eslint-disable` recopiés. `li: ['listitem']` va avec : le couple se pose
 * ensemble, sinon on ne sait plus, en lisant, si l'omission est un choix.
 *
 * La règle reste `warn` et garde sa force ailleurs : un `<button role="button">`
 * serait toujours signalé.
 */
import base from '@mister-guiiug/dev-pwa-config/eslint-react';

export default [
  ...base,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'jsx-a11y/no-redundant-roles': [
        'warn',
        { ul: ['list'], ol: ['list'], li: ['listitem'] },
      ],
    },
  },
];
