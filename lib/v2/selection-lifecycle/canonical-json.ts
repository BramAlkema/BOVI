/**
 * JSON canonicalisation for reproducible scenarios, manifests, and traces.
 *
 * Only values which survive a JSON round trip are accepted. Object keys are
 * sorted by their UTF-16 code units (the ordering used by JavaScript's
 * default string sort), and negative zero is normalised to zero.
 */

export type JsonPrimitive = null | boolean | number | string;

export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export const CANONICAL_JSON_VERSION = "sorted-json/v1" as const;
export const DETERMINISTIC_HASH_VERSION = "fnv1a-64/v1" as const;

function canonicalise(value: unknown, path: string, ancestors: Set<object>): string {
  if (value === null) return "null";

  switch (typeof value) {
    case "boolean":
      return value ? "true" : "false";
    case "string":
      return JSON.stringify(value);
    case "number":
      if (!Number.isFinite(value)) {
        throw new TypeError(`${path} must be a finite JSON number`);
      }
      return JSON.stringify(Object.is(value, -0) ? 0 : value);
    case "bigint":
    case "function":
    case "symbol":
    case "undefined":
      throw new TypeError(`${path} is not JSON-serialisable`);
    case "object":
      break;
    default:
      throw new TypeError(`${path} has an unsupported value type`);
  }

  const objectValue = value as object;
  if (ancestors.has(objectValue)) {
    throw new TypeError(`${path} contains a circular reference`);
  }
  ancestors.add(objectValue);

  try {
    if (Array.isArray(value)) {
      const entries = value.map((entry, index) =>
        canonicalise(entry, `${path}[${index}]`, ancestors)
      );
      return `[${entries.join(",")}]`;
    }

    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError(`${path} must be a plain JSON object`);
    }

    if (Object.getOwnPropertySymbols(value).length > 0) {
      throw new TypeError(`${path} must not contain symbol keys`);
    }

    const record = value as Record<string, unknown>;
    const entries = Object.keys(record)
      .sort()
      .map(key => {
        const encodedKey = JSON.stringify(key);
        const encodedValue = canonicalise(record[key], `${path}.${key}`, ancestors);
        return `${encodedKey}:${encodedValue}`;
      });
    return `{${entries.join(",")}}`;
  } finally {
    ancestors.delete(objectValue);
  }
}

export function canonicalJson(value: unknown): string {
  return canonicalise(value, "$", new Set<object>());
}

export const canonicalStringify = canonicalJson;

/**
 * Deterministic FNV-1a hash over UTF-8 bytes.
 *
 * This is intentionally and explicitly non-cryptographic. It is suitable for
 * reproducibility identifiers and accidental-difference detection, never for
 * signatures, commitments, adversarial collision resistance, or provenance.
 */
export function fnv1a64(value: string): string {
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  const mask = 0xffffffffffffffffn;

  for (const character of value) {
    const codePoint = character.codePointAt(0);
    if (codePoint === undefined) continue;

    if (codePoint <= 0x7f) {
      hash ^= BigInt(codePoint);
      hash = (hash * prime) & mask;
      continue;
    }

    const bytes: number[] = [];
    if (codePoint <= 0x7ff) {
      bytes.push(0xc0 | (codePoint >> 6), 0x80 | (codePoint & 0x3f));
    } else if (codePoint <= 0xffff) {
      bytes.push(
        0xe0 | (codePoint >> 12),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f)
      );
    } else {
      bytes.push(
        0xf0 | (codePoint >> 18),
        0x80 | ((codePoint >> 12) & 0x3f),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f)
      );
    }

    for (const byte of bytes) {
      hash ^= BigInt(byte);
      hash = (hash * prime) & mask;
    }
  }

  return hash.toString(16).padStart(16, "0");
}

export function deterministicHash(value: unknown): string {
  return `${DETERMINISTIC_HASH_VERSION}:${fnv1a64(canonicalJson(value))}`;
}

export const canonicalHash = deterministicHash;
