import { MovementNote } from '../../src';

describe('MovementNote', () => {
  test('tryCreate returns a value object for a valid note', () => {
    const result = MovementNote.tryCreate('Pago no débito');

    expect(result.isOk).toBe(true);
    expect(result.instance).toBeInstanceOf(MovementNote);
    expect(result.instance.value).toBe('Pago no débito');
  });

  test('tryCreate trims surrounding spaces', () => {
    const result = MovementNote.tryCreate('  parcela única  ');

    expect(result.isOk).toBe(true);
    expect(result.instance.value).toBe('parcela única');
  });

  test('tryCreate accepts the minimum and maximum lengths', () => {
    expect(MovementNote.tryCreate('a').isOk).toBe(true);
    expect(MovementNote.tryCreate('a'.repeat(500)).isOk).toBe(true);
  });

  test('tryCreate fails with MOVEMENT_NOTE_TOO_LONG above the maximum length', () => {
    const result = MovementNote.tryCreate('a'.repeat(501));

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain('MOVEMENT_NOTE_TOO_LONG');
  });

  test('tryCreate fails with MOVEMENT_NOTE_TOO_SHORT for an empty string', () => {
    const result = MovementNote.tryCreate('');

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain('MOVEMENT_NOTE_TOO_SHORT');
  });

  test('create returns a value object for a valid note', () => {
    const note = MovementNote.create('Conta de luz');

    expect(note.value).toBe('Conta de luz');
  });

  test('create throws when the note is invalid', () => {
    expect(() => MovementNote.create('')).toThrow('MOVEMENT_NOTE_TOO_SHORT');
  });
});
