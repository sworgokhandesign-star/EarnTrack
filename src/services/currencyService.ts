export async function getExchangeRates(base: string = "USD") {
  try {
    const response = await fetch(`https://open.er-api.com/v6/latest/${base}`);
    const data = await response.json();
    return data.rates as Record<string, number>;
  } catch (error) {
    console.error("Failed to fetch exchange rates:", error);
    return null;
  }
}

export async function convertToBDT(amount: number, fromCurrency: string) {
  const rates = await getExchangeRates(fromCurrency);
  if (!rates || !rates["BDT"]) {
    // Fallback static rates if API fails
    const fallbackRates: Record<string, number> = {
      USD: 110,
      EUR: 120,
      GBP: 140,
      INR: 1.3,
      BDT: 1,
    };
    return amount * (fallbackRates[fromCurrency] || 110);
  }
  return amount * rates["BDT"];
}
