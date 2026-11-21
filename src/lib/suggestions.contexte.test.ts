import { describe, expect, it } from 'vitest';
import { suggestFromText } from './suggestions';

/**
 * CE QUE CE FICHIER TIENT : un compte-rendu se lit en phrases, pas en
 * caractères.
 *
 * Relevé le 21/11/2026 sur la version en ligne, avant correction :
 *
 *   « Fibrillation auriculaire paroxystique. »  → I48.0, et C91.0 (leucémie)
 *   « Installation de la patiente en chambre. » → C91.0
 *   « Diabète de type 2 sous metformine. »      → E11.9, et E10.9 (type 1)
 *   « Pas de fièvre. »                          → R50.9 à 70 %
 *   « Antécédent d'insuffisance cardiaque. »    → I50.0 à 94 %, comme actuelle
 */

const resultats = (texte: string) =>
  suggestFromText(texte).sort((a, b) => b.confidence - a.confidence);
const codes = (texte: string) => resultats(texte).map(r => r.code);
const trouve = (texte: string, code: string) =>
  resultats(texte).find(r => r.code === code);

describe('un terme se reconnaît mot à mot, pas comme un fragment', () => {
  it.each([
    // « lla », synonyme de la leucémie lymphoïde aiguë, est DANS ces mots.
    ['Fibrillation auriculaire paroxystique.', 'C91.0'],
    ['Installation de la patiente en chambre.', 'C91.0'],
    ['Intervalle libre de six heures.', 'C91.0'],
  ])('%s ne propose pas %s', (texte, interdit) => {
    expect(codes(texte)).not.toContain(interdit);
  });

  it('le pluriel reste reconnu', () => {
    expect(codes('Lombalgies chroniques.')).toContain('M54.5');
    expect(codes('Insuffisances cardiaques répétées.')).toContain('I50.0');
  });

  it('la LLA écrite en toutes lettres, elle, sort toujours', () => {
    expect(codes('LLA en rémission.')).toContain('C91.0');
  });
});

describe('un chiffre du terme doit figurer tel quel', () => {
  it('« type 2 » ne propose pas le type 1, ni l’inverse', () => {
    const t2 = codes('Diabète de type 2 sous metformine.');
    expect(t2).toContain('E11.9');
    expect(t2).not.toContain('E10.9');
    const t1 = codes('Diabète de type 1.');
    expect(t1).toContain('E10.9');
    expect(t1).not.toContain('E11.9');
  });

  it('le chiffre doit suivre son mot, pas traîner dans la phrase', () => {
    // Le « 1 » du comprimé n'est pas le « 1 » du type.
    expect(codes('Diabète de type 2, 1 comprimé le soir.')).not.toContain(
      'E10.9'
    );
  });

  it('une abréviation du terme aussi : « tb pulmonaire » n’est pas « pulmonaire »', () => {
    expect(codes('Œdème pulmonaire cardiogénique.')).not.toContain('A15.9');
    expect(codes('TB pulmonaire.')).toContain('A15.9');
  });
});

describe('une mention niée ne devient pas une suggestion', () => {
  // Chaque ligne porte son témoin : la même mention, affirmée, SORT. Sans
  // lui, un test de négation passe aussi quand le terme n'est jamais reconnu.
  it.each([
    ['Pas de fièvre.', 'Fièvre.', 'R50.9'],
    ['Absence de diabète de type 2.', 'Diabète de type 2.', 'E11.9'],
    ['Apyrétique, sans dyspnée.', 'Apyrétique, dyspnée.', 'R06.0'],
    ['Ni fièvre ni dyspnée.', 'Fièvre et dyspnée.', 'R06.0'],
    ['Embolie pulmonaire éliminée.', 'Embolie pulmonaire.', 'I26.9'],
    ['Tabagisme : non.', 'Tabagisme : oui.', 'F17.2'],
    ['Aucun tabagisme.', 'Tabagisme actif.', 'F17.2'],
    [
      'Cardiopathie hypertensive sans insuffisance cardiaque.',
      'Cardiopathie hypertensive avec insuffisance cardiaque.',
      'I50.0',
    ],
  ])('%s → pas de %s', (niee, affirmee, code) => {
    expect(codes(affirmee)).toContain(code);
    expect(codes(niee)).not.toContain(code);
  });

  it('la négation s’arrête à la virgule, au « mais » et au point', () => {
    expect(codes('Pas de douleur thoracique mais une dyspnée.')).toContain(
      'R06.0'
    );
    expect(codes('Pas de fièvre, dyspnée d’effort.')).toContain('R06.0');
    expect(codes('Pas de fièvre. Dyspnée.')).toContain('R06.0');
  });

  it('une mention affirmée l’emporte sur une mention niée du même code', () => {
    expect(codes('Pas de fièvre hier, fièvre à 39 ce jour.')).toContain(
      'R50.9'
    );
  });

  it('ce qui a la forme d’une négation sans en avoir le sens', () => {
    // « non » après la mention ne nie que s'il la clôt.
    expect(codes('HTA non contrôlée.')).toContain('I10');
    expect(codes('Sans doute une pneumopathie.')).toContain('J18.9');
  });
});

describe('un antécédent reste proposé, signalé et classé plus bas', () => {
  it('« antécédent de » : signalé, et sous la même mention actuelle', () => {
    const atcd = trouve('Antécédent d’insuffisance cardiaque.', 'I50.0');
    const actuel = trouve('Insuffisance cardiaque.', 'I50.0');
    expect(atcd?.contexte).toBe('antecedent');
    expect(actuel?.contexte).toBeUndefined();
    expect(atcd!.confidence).toBeLessThan(actuel!.confidence);
  });

  it('la portée court jusqu’à la fin de la phrase, virgules comprises', () => {
    const r = resultats('ATCD : HTA, diabète de type 2. Douleur thoracique.');
    expect(r.find(x => x.code === 'I10')?.contexte).toBe('antecedent');
    expect(r.find(x => x.code === 'E11.9')?.contexte).toBe('antecedent');
    expect(r.find(x => x.code === 'R07.4')?.contexte).toBeUndefined();
  });

  it('« consulte pour » ramène au présent', () => {
    const r = resultats('Antécédent d’HTA, consulte pour douleur thoracique.');
    expect(r.find(x => x.code === 'I10')?.contexte).toBe('antecedent');
    expect(r.find(x => x.code === 'R07.4')?.contexte).toBeUndefined();
  });

  it('une en-tête « Antécédents : » seule ouvre une section, jusqu’à la ligne vide', () => {
    const r = resultats(
      'Antécédents :\nHTA\nDiabète de type 2\n\nMotif : pneumopathie'
    );
    expect(r.find(x => x.code === 'I10')?.contexte).toBe('antecedent');
    expect(r.find(x => x.code === 'E11.9')?.contexte).toBe('antecedent');
    expect(r.find(x => x.code === 'J18.9')?.contexte).toBeUndefined();
  });

  it('une maladie d’un proche est signalée familiale', () => {
    expect(
      trouve('Antécédents familiaux : cancer du sein.', 'C50.9')?.contexte
    ).toBe('familial');
    expect(trouve('Cancer du sein chez sa mère.', 'C50.9')?.contexte).toBe(
      'familial'
    );
  });

  it('« jeune fille » parle de la patiente, pas d’un proche', () => {
    expect(
      trouve('Jeune fille de 16 ans, asthmatique.', 'J45.9')?.contexte
    ).toBeUndefined();
  });
});

describe('l’extrait est le passage du compte-rendu, tel qu’écrit', () => {
  it('accents et casse compris : c’est lui qu’on surligne', () => {
    expect(trouve('Patient DIABÉTIQUE de type 2.', 'E11.9')?.extrait).toBe(
      'DIABÉTIQUE de type 2'
    );
    expect(trouve('Fièvre à 39.', 'R50.9')?.extrait).toBe('Fièvre');
  });

  it('« œ » rejoint « oe »', () => {
    expect(codes('Oedème pulmonaire cardiogénique.')).toContain('I50.0');
  });
});
