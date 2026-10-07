import { AppError } from '../utils/AppError.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

function checkValue(path, raw, rule, errors) {
  if (raw === undefined || raw === null || (raw === '' && rule.type !== 'string')) {
    if (raw === null && rule.nullable) return null;
    if (rule.required) errors.push({ field: path, message: 'is required' });
    return rule.default;
  }
  let v = raw;
  const fail = (message) => {
    errors.push({ field: path, message });
    return undefined;
  };

  switch (rule.type) {
    case 'string': {
      if (typeof v !== 'string') return fail('must be a string');
      v = v.trim();
      if (rule.required && v === '') return fail('is required');
      if (rule.minLength && v.length < rule.minLength) return fail(`must be at least ${rule.minLength} characters`);
      if (rule.maxLength && v.length > rule.maxLength) return fail(`must be at most ${rule.maxLength} characters`);
      if (rule.email && !EMAIL_RE.test(v)) return fail('must be a valid email');
      if (rule.uuid && !UUID_RE.test(v)) return fail('must be a valid UUID');
      if (rule.lowercase) v = v.toLowerCase();
      if (rule.enum && !rule.enum.includes(v)) return fail(`must be one of: ${rule.enum.join(', ')}`);
      break;
    }
    case 'number': {
      if (typeof v === 'string' && v.trim() !== '') v = Number(v);
      if (typeof v !== 'number' || !Number.isFinite(v)) return fail('must be a number');
      if (rule.integer && !Number.isInteger(v)) return fail('must be an integer');
      if (rule.min !== undefined && v < rule.min) return fail(`must be >= ${rule.min}`);
      if (rule.max !== undefined && v > rule.max) return fail(`must be <= ${rule.max}`);
      break;
    }
    case 'boolean': {
      if (v === 'true') v = true;
      else if (v === 'false') v = false;
      if (typeof v !== 'boolean') return fail('must be a boolean');
      break;
    }
    case 'date': {
      const d = new Date(v);
      if (typeof v === 'object' || Number.isNaN(d.getTime())) return fail('must be a valid ISO date');
      v = d;
      break;
    }
    case 'array': {
      if (!Array.isArray(v)) return fail('must be an array');
      if (rule.maxItems !== undefined && v.length > rule.maxItems) return fail(`must have at most ${rule.maxItems} items`);
      if (rule.items) {
        const sub = [];
        v = v.map((item, i) => checkValue(`${path}[${i}]`, item, { ...rule.items, required: true }, sub));
        if (sub.length) {
          errors.push(...sub);
          return undefined;
        }
      }
      break;
    }
    case 'object': {
      if (!isPlainObject(v)) return fail('must be an object');
      if (rule.schema) {
        const sub = runSchema(rule.schema, v, `${path}.`);
        if (sub.errors.length) {
          errors.push(...sub.errors);
          return undefined;
        }
        v = sub.value;
      }
      break;
    }
    default:
      return fail(`unsupported rule type ${rule.type}`);
  }

  if (rule.custom) {
    const msg = rule.custom(v);
    if (msg) return fail(msg);
  }
  return v;
}

/** Validates + coerces `data` against `schema`. Unknown keys are stripped. */
export function runSchema(schema, data, prefix = '') {
  const errors = [];
  const value = {};
  const input = isPlainObject(data) ? data : {};
  for (const [field, rule] of Object.entries(schema)) {
    const out = checkValue(`${prefix}${field}`, input[field], rule, errors);
    if (out !== undefined) value[field] = out;
  }
  return { value, errors };
}

/** Same schema with every `required` flag and default removed (for PATCH/PUT updates). */
export const partial = (schema) =>
  Object.fromEntries(
    Object.entries(schema).map(([k, r]) => {
      const { required, default: _d, ...rest } = r;
      return [k, rest];
    })
  );

/** Express middleware. Result is stored on req.validated[source]. */
export const validate =
  (schema, source = 'body') =>
  (req, res, next) => {
    const { value, errors } = runSchema(schema, req[source]);
    if (errors.length) return next(new AppError(422, 'Validation failed', 'VALIDATION_ERROR', errors));
    req.validated = { ...(req.validated || {}), [source]: value };
    return next();
  };

export const idParam = validate({ id: { type: 'string', required: true, uuid: true } }, 'params');
