export const formatPrice = (price: number | undefined): string => {
  if (price === undefined || price === null) return 'Цена не указана';
  return `${price.toLocaleString('ru-RU')} TJS`;
}; 