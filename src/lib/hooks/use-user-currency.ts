import { useQuery } from "@tanstack/react-query";
import { getCurrentUserQuery } from "~/lib/queries/profile";
import { formatUserCurrency, getCurrencyOptions, type CurrencyFormatterOptions } from "~/lib/utils/currency";

/**
 * Hook to get user's currency information and formatting utilities
 */
export function useUserCurrency() {
  const { data: user } = useQuery(getCurrentUserQuery);
  
  const currencyOptions: CurrencyFormatterOptions = getCurrencyOptions(user?.country);
  
  const formatAmount = (amount: number) => {
    return formatUserCurrency(amount, user?.country);
  };
  
  const currencyCode = user?.country?.currency || 'USD';
  
  return {
    user,
    currencyCode,
    currencyOptions,
    formatAmount,
  };
}