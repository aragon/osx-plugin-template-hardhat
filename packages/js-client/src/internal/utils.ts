import { NumberListItem } from '../types';
import { SubgraphNumber, SubgraphNumberListItem } from './types';

export function toNumberListItem(
  number: SubgraphNumberListItem
): NumberListItem {
  return {
    id: number.id,
    subdomain: number.subdomain,
    value: BigInt(number.number.value),
  };
}
export function toNumber(number: SubgraphNumber): bigint {
  return BigInt(number.number.value);
}
