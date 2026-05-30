const RU_NUMBER = new Intl.NumberFormat('ru-RU');

export function formatRubles(amountRubles: number): string {
  return `${RU_NUMBER.format(Math.max(0, Math.round(amountRubles)))} ₽`;
}

export function formatRublesPlain(amountRubles: number): string {
  return RU_NUMBER.format(Math.max(0, Math.round(amountRubles)));
}

export function parseRublesInput(value: string): number {
  const digits = value.replace(/\D/g, '');
  if (!digits) return 0;
  return Number.parseInt(digits, 10);
}

export function rublesToKopeks(amountRubles: number): number {
  return Math.round(amountRubles) * 100;
}
