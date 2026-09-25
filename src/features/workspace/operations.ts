import type { useI18n } from '../../i18n';
import type { OperationRetenus } from '../../store/workspaceStore';

type Traduire = ReturnType<typeof useI18n>['t'];

/**
 * Ce qu'une opération sur les retenus a fait, en quelques mots : c'est ce que
 * disent « Annulé : … » et « Rétabli : … », et l'info-bulle des deux boutons.
 * Sans elle, un lecteur d'écran entendrait « Annulé » sans savoir QUOI.
 */
export function decrireOperation(op: OperationRetenus, t: Traduire): string {
  switch (op.type) {
    case 'ajout':
      return op.codes.length === 1
        ? t('history.op.addOne', { code: op.codes[0] ?? '' })
        : t('history.op.addMany', { count: op.codes.length });
    case 'retrait':
      return t('history.op.remove', { code: op.code });
    case 'modification':
      return op.ancien === op.nouveau
        ? t('history.op.edit', { code: op.nouveau })
        : t('history.op.replace', { ancien: op.ancien, nouveau: op.nouveau });
    case 'note':
      return t('history.op.note', { code: op.code });
    case 'deplacement':
      return t('history.op.move', { code: op.code });
    case 'vidage':
      return t('history.op.clear', { count: op.nombre });
  }
}
