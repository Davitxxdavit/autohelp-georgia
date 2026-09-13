import {
  AsYouType,
  Metadata,
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from 'libphonenumber-js';

export type { CountryCode };

export const DEFAULT_COUNTRY: CountryCode = 'GE';

const PINNED_COUNTRIES: CountryCode[] = [
  'GE',
  'TR',
  'US',
  'AZ',
  'AM',
  'RU',
  'DE',
  'GB',
];

const regionNames = (() => {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' });
  } catch {
    return null;
  }
})();

export type CountryOption = {
  iso: CountryCode;
  name: string;
  callingCode: string;
  flag: string;
};

export type PhoneValue = {
  e164: string | null;
  isValid: boolean;
  country: CountryCode;
};

export function countryFlag(iso: string): string {
  return iso
    .toUpperCase()
    .replace(/./g, (char) =>
      String.fromCodePoint(127397 + char.charCodeAt(0)),
    );
}

export function countryName(iso: CountryCode): string {
  return regionNames?.of(iso) ?? iso;
}

export function listCountries(): CountryOption[] {
  const all = getCountries();
  const pinned = new Set(PINNED_COUNTRIES);
  const toOption = (iso: CountryCode): CountryOption => ({
    iso,
    name: countryName(iso),
    callingCode: `+${getCountryCallingCode(iso)}`,
    flag: countryFlag(iso),
  });
  const head = PINNED_COUNTRIES.filter((iso) => all.includes(iso)).map(toOption);
  const rest = all
    .filter((iso) => !pinned.has(iso))
    .map(toOption)
    .sort((a, b) => a.name.localeCompare(b.name));
  return [...head, ...rest];
}

const COUNTRY_OPTIONS = listCountries();

export function getCountryOptions(): CountryOption[] {
  return COUNTRY_OPTIONS;
}

export function maxNationalDigits(country: CountryCode): number {
  const metadata = new Metadata();
  metadata.selectNumberingPlan(country);
  const lengths = metadata.numberingPlan?.possibleLengths() ?? [];
  if (lengths.length === 0) return 15;
  return Math.max(...lengths);
}

export function digitsOnly(input: string): string {
  return input.replace(/\D/g, '');
}

export function capNationalDigits(
  country: CountryCode,
  digits: string,
): string {
  return digitsOnly(digits).slice(0, maxNationalDigits(country));
}

export function formatNationalNumber(
  country: CountryCode,
  digits: string,
): string {
  if (!digits) return '';
  const formatter = new AsYouType(country);
  return formatter.input(digits);
}

export function resolvePhoneValue(
  country: CountryCode,
  nationalDigits: string,
): PhoneValue {
  const digits = capNationalDigits(country, nationalDigits);
  if (!digits) {
    return { e164: null, isValid: false, country };
  }
  const valid = isValidPhoneNumber(digits, country);
  const parsed = parsePhoneNumberFromString(digits, country);
  return {
    country,
    isValid: valid,
    e164: valid && parsed ? parsed.number : null,
  };
}

/** Accept pasted E.164 / international input when it parses cleanly. */
export function tryParseInternational(input: string): {
  country: CountryCode;
  digits: string;
} | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith('+') && !trimmed.startsWith('00')) return null;
  const parsed = parsePhoneNumberFromString(
    trimmed.startsWith('00') ? `+${trimmed.slice(2)}` : trimmed,
  );
  if (!parsed?.country) return null;
  return {
    country: parsed.country,
    digits: parsed.nationalNumber,
  };
}

export function filterCountries(
  query: string,
  options: CountryOption[] = COUNTRY_OPTIONS,
): CountryOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return options;
  return options.filter((item) => {
    return (
      item.name.toLowerCase().includes(q) ||
      item.iso.toLowerCase().includes(q) ||
      item.callingCode.includes(q) ||
      item.callingCode.replace('+', '').includes(q)
    );
  });
}
