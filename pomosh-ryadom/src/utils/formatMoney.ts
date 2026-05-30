export function formatMoneyRub(amount: number): string {
  return `${Math.round(amount).toLocaleString('ru-RU').replace(/,/g, ' ')} ₽`;
}

export function formatKopeksRub(kopeks: number): string {
  return formatMoneyRub(kopeks / 100);
}
