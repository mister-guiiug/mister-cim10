import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { verifierCode, type Classification } from '../../lib/code-format';
import { useI18n } from '../../i18n';
import type { ICD10Code } from '../../types/index';

/** Ce que le formulaire rend quand il accepte la saisie. */
export interface SaisieCode {
  /** Le code sous sa forme normalisée (`a000` → `A00.0`). */
  code: string;
  label: string;
  /** Bien formé mais absent du référentiel embarqué : signalé, pas bloqué. */
  horsReferentiel: boolean;
}

export interface CodeEntryFormProps {
  classification: Classification;
  initialCode?: string;
  initialLabel?: string;
  /**
   * Les codes déjà retenus AILLEURS. En modification, le diagnostic lui-même
   * n'y est pas : garder son propre code n'est pas un doublon.
   */
  existingCodes: Set<string>;
  submitLabel: string;
  onSubmit: (saisie: SaisieCode) => void;
  onCancel: () => void;
}

/**
 * Code + libellé, contrôlés : la saisie manuelle ET la modification d'un code
 * retenu passent par ici, pour que « le même contrôle » le reste.
 *
 * QUAND DIRE QU'UNE FORME EST FAUSSE. Pas à la première lettre : « E » n'est
 * pas une erreur, c'est un début. L'erreur de forme attend que le champ soit
 * quitté ou le formulaire soumis, puis suit la frappe. Le doublon, lui, se dit
 * tout de suite — il ne dépend pas de ce qui reste à taper.
 *
 * LE BOUTON D'ENVOI N'EST JAMAIS DÉSACTIVÉ. Un bouton grisé ne dit pas
 * pourquoi ; soumis, le formulaire le dit, et remet le focus sur le champ
 * fautif.
 */
export function CodeEntryForm({
  classification,
  initialCode = '',
  initialLabel = '',
  existingCodes,
  submitLabel,
  onSubmit,
  onCancel,
}: CodeEntryFormProps) {
  const { t } = useI18n();
  const id = useId();
  const [code, setCode] = useState(initialCode);
  const [label, setLabel] = useState(initialLabel);
  const [controle, setControle] = useState(false);
  const [libelleExige, setLibelleExige] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const labelRef = useRef<HTMLInputElement>(null);

  // CE FORMULAIRE N'EXISTE QUE PARCE QU'ON VIENT DE LE DEMANDER — « Ajouter un
  // code », « Modifier ». Le focus va là où l'attention est déjà ; ne pas le
  // poser obligerait à tabuler jusqu'au champ qu'on a demandé à remplir. En
  // modification, le code est sélectionné : on vient le remplacer.
  // Au montage seulement : refocaliser à chaque rendu volerait le curseur.
  const modification = useRef(initialCode !== '');
  useEffect(() => {
    codeRef.current?.focus();
    if (modification.current) codeRef.current?.select();
  }, []);

  // Échap annule, où que soit le focus dans le formulaire. L'écoute est posée
  // à la main : un `onKeyDown` sur le <form> ferait d'un point de repère un
  // élément interactif aux yeux des outils d'accessibilité.
  const annulerRef = useRef(onCancel);
  useEffect(() => {
    annulerRef.current = onCancel;
  });
  useEffect(() => {
    const form = formRef.current;
    if (form === null) return;
    const surTouche = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.isComposing || e.defaultPrevented) return;
      e.preventDefault();
      annulerRef.current();
    };
    form.addEventListener('keydown', surTouche);
    return () => form.removeEventListener('keydown', surTouche);
  }, []);

  const verdict = verifierCode(code, classification);
  const valide = verdict.statut === 'valide' ? verdict : null;
  const doublon = valide !== null && existingCodes.has(valide.code);
  const reference = valide?.reference ?? null;

  let erreurCode: string | null = null;
  if (doublon) erreurCode = t('validated.duplicate');
  else if (controle && verdict.statut === 'vide') {
    erreurCode = t('codeEntry.errorEmpty');
  } else if (controle && verdict.statut === 'invalide') {
    erreurCode =
      classification === 'cim11'
        ? t('codeEntry.errorFormatIcd11')
        : t('codeEntry.errorFormat');
  }
  const erreurLibelle =
    libelleExige && label.trim() === '' && reference === null
      ? t('codeEntry.labelRequired')
      : null;

  // Le référentiel embarqué est de la CIM-10 : pour un code CIM-11, il n'a
  // rien à dire, ni pour, ni contre.
  const statut =
    classification === 'cim10' && valide !== null && !doublon
      ? reference
        ? t('codeEntry.known', { label: reference.label })
        : t('codeEntry.unknown')
      : '';

  const idErreurCode = `${id}-code-erreur`;
  const idStatut = `${id}-statut`;
  const idErreurLibelle = `${id}-libelle-erreur`;
  const decritCode =
    [erreurCode ? idErreurCode : null, statut ? idStatut : null]
      .filter(Boolean)
      .join(' ') || undefined;

  /**
   * La forme normalisée remplace la saisie en quittant le champ : on voit ce
   * qui sera enregistré. Un code connu apporte son libellé s'il n'y en a pas.
   */
  const quitterCode = () => {
    if (code.trim() === '') return;
    setControle(true);
    if (valide === null) return;
    setCode(valide.code);
    if (reference !== null && label.trim() === '') setLabel(reference.label);
  };

  const choisir = (entree: ICD10Code) => {
    setCode(entree.code);
    setLabel(entree.label);
    codeRef.current?.focus();
  };

  const soumettre = (e: FormEvent) => {
    e.preventDefault();
    setControle(true);
    if (valide === null || doublon) {
      codeRef.current?.focus();
      return;
    }
    const libelle = label.trim() || reference?.label || '';
    if (libelle === '') {
      setLibelleExige(true);
      labelRef.current?.focus();
      return;
    }
    onSubmit({
      code: valide.code,
      label: libelle,
      horsReferentiel: classification === 'cim10' && reference === null,
    });
  };

  return (
    <form
      ref={formRef}
      className="manual-entry-form"
      onSubmit={soumettre}
      noValidate
    >
      <div className="manual-entry-row">
        <input
          ref={codeRef}
          type="text"
          className="manual-entry-code"
          placeholder={
            classification === 'cim11'
              ? t('codeEntry.codePlaceholderIcd11')
              : t('validated.codePlaceholder')
          }
          aria-label={
            classification === 'cim11'
              ? t('codeEntry.codeAriaIcd11')
              : t('validated.codeAria')
          }
          aria-invalid={erreurCode !== null}
          aria-describedby={decritCode}
          value={code}
          onChange={e => setCode(e.target.value)}
          onBlur={quitterCode}
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="characters"
        />
        <input
          ref={labelRef}
          type="text"
          className="manual-entry-label"
          placeholder={t('validated.labelPlaceholder')}
          aria-label={t('validated.labelAria')}
          aria-invalid={erreurLibelle !== null}
          aria-describedby={erreurLibelle ? idErreurLibelle : undefined}
          value={label}
          onChange={e => setLabel(e.target.value)}
        />
      </div>
      {erreurCode && (
        <p id={idErreurCode} className="hint error" role="alert">
          {erreurCode}
        </p>
      )}
      {erreurLibelle && (
        <p id={idErreurLibelle} className="hint error" role="alert">
          {erreurLibelle}
        </p>
      )}
      {/* Présente dès le montage, même vide : une région qui apparaît au
          moment où elle parle n'est souvent pas lue. Les boutons restent
          DEHORS — dans une région vivante, ils seraient lus à chaque
          changement. */}
      <p id={idStatut} className="hint code-entry-status" role="status">
        {statut}
      </p>
      {reference !== null && label.trim() !== reference.label && (
        <button
          type="button"
          className="ghost code-entry-take-label"
          onClick={() => setLabel(reference.label)}
        >
          {t('codeEntry.useReferenceLabel')}
        </button>
      )}
      {valide !== null && reference === null && valide.proches.length > 0 && (
        <div className="code-entry-near">
          <p className="hint code-entry-near-title">
            {t('codeEntry.nearTitle')}
          </p>
          <ul
            className="code-entry-near-list"
            role="list"
            aria-label={t('codeEntry.nearAria')}
          >
            {valide.proches.map(p => (
              <li key={p.code}>
                <button
                  type="button"
                  className="ghost code-entry-near-btn"
                  onClick={() => choisir(p)}
                >
                  <strong className="suggestion-compare-code">{p.code}</strong>{' '}
                  <span>{p.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="toolbar">
        <button type="submit" className="primary">
          {submitLabel}
        </button>
        <button type="button" className="ghost" onClick={onCancel}>
          {t('common.cancel')}
        </button>
      </div>
    </form>
  );
}
