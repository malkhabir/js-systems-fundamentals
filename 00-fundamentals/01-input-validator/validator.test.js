import { describe, it, expect} from 'vitest';
import Validator from './exercise-01.js'

const schema = {
    name: { type: 'string', required: true, minLength: 2 },
    age: { type: 'number', min: 0, max: 120 },
    tags: { type: 'array', required: false, itemType: 'string' }
}

describe('validator', () => {
    const v = new Validator(schema)
    it('returns valid for correct input', () => {
        expect(v.validate({ name: 'Al', age: 25, extra: true })).toEqual({ valid: true, errors: [] })
    })

    it('fails on missing required field', () => {
    const res = v.validate({ age: 25 });
    expect(res.valid).toBe(false);
    expect(res.errors[0].field).toBe('name');
    expect(res.errors[0].code).toBe('REQUIRED');
  });

  it('fails on out-of-range number', () => {
    const res = v.validate({ name: 'Al', age: 150 });
    expect(res.errors.find(e => e.field === 'age')?.code).toBe('MAX_VALUE');
  });

  it('validates array itemType correctly', () => {
    const res = v.validate({ name: 'Al', tags: ['a', 1] });
    expect(res.valid).toBe(false);
    expect(res.errors.find(e => e.code === 'INVALID_ITEM_TYPE')).toBeDefined();
  });

  it('throws on invalid schema in constructor', () => {
    expect(() => new Validator('bad')).toThrow();
  });

    it('rejects non-object input', () => {
    const res = v.validate(null);
    expect(res.valid).toBe(false);
    expect(res.errors[0].field).toBe('ALL');
  });

  it('enforces minLength & pattern on strings', () => {
    const res = v.validate({ name: 'A' }); // too short + fails default pattern if added
    expect(res.valid).toBe(false);
    expect(res.errors.some(e => e.code === 'MIN_LENGTH')).toBe(true);
  });

})