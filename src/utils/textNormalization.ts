const ONES = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen',
  'nineteen',
];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

/** 0..999999 to words, e.g. 342 -> "three hundred forty two". Larger numbers stay as digits. */
export function numberToWords(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 999999) return String(n);
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '');
  if (n < 1000) {
    const rest = n % 100;
    return ONES[Math.floor(n / 100)] + ' hundred' + (rest ? ' ' + numberToWords(rest) : '');
  }
  const rest = n % 1000;
  return numberToWords(Math.floor(n / 1000)) + ' thousand' + (rest ? ' ' + numberToWords(rest) : '');
}

const CONTRACTIONS: Record<string, string> = {
  "it's": 'it is', "that's": 'that is', "there's": 'there is', "what's": 'what is',
  "you're": 'you are', "we're": 'we are', "they're": 'they are', "i'm": 'i am',
  "don't": 'do not', "doesn't": 'does not', "didn't": 'did not', "can't": 'cannot',
  "won't": 'will not', "isn't": 'is not', "aren't": 'are not', "wasn't": 'was not',
  "you'll": 'you will', "we'll": 'we will', "i'll": 'i will', "let's": 'let us',
  "you've": 'you have', "we've": 'we have', "i've": 'i have', "who's": 'who is',
};

/**
 * Normalizes text so harmless transcription differences don't count as mistakes:
 * lowercase, curly quotes, contractions, digits -> words, "&" -> "and", punctuation removed,
 * whitespace collapsed.
 */
export function normalizeText(text: string): string {
  let t = text.toLowerCase().replace(/[\u2018\u2019\u02bc`]/g, "'").replace(/[\u201c\u201d]/g, '"');
  t = t.replace(/&/g, ' and ').replace(/%/g, ' percent ');
  t = t.replace(/(\d),(?=\d{3}\b)/g, '$1'); // 1,000 -> 1000
  t = t.replace(/\b[a-z]+'[a-z]+\b/g, w => CONTRACTIONS[w] ?? w.replace(/'/g, ''));
  t = t.replace(/\d+/g, d => ` ${numberToWords(parseInt(d, 10))} `);
  t = t.replace(/[-_/]/g, ' ');
  t = t.replace(/[^a-z0-9\s]/g, '');
  return t.replace(/\s+/g, ' ').trim();
}

export function tokenize(text: string): string[] {
  const n = normalizeText(text);
  return n.length ? n.split(' ') : [];
}
