// Country codes fetched from external API
export interface CountryCode {
  code: string;
  country: string;
  flag: string;
}

interface RestCountriesResponse {
  name: {
    common: string;
  };
  cca3: string; // 3-letter country code
  idd: {
    root: string;
    suffixes: string[];
  };
  flag: string;
}

// Default fallback country codes (Ghana-focused)
export const DEFAULT_COUNTRY_CODES: CountryCode[] = [
  { code: "+233", country: "GHA", flag: "🇬🇭" },
  { code: "+234", country: "NGA", flag: "🇳🇬" },
  { code: "+1", country: "USA", flag: "🇺🇸" },
  { code: "+44", country: "GBR", flag: "🇬🇧" },
  { code: "+27", country: "ZAF", flag: "🇿🇦" },
];

// Fetch country codes from external API
export const fetchCountryCodes = async (): Promise<CountryCode[]> => {
  try {
    const response = await fetch(
      "https://restcountries.com/v3.1/all?fields=name,idd,flag,cca3"
    );

    if (!response.ok) {
      throw new Error("Failed to fetch country codes");
    }

    const countries: RestCountriesResponse[] = await response.json();

    const countryCodes: CountryCode[] = countries
      .filter(
        (country: RestCountriesResponse) =>
          country.idd?.root &&
          country.idd?.suffixes?.length > 0 &&
          country.name?.common &&
          country.cca3
      )
      .map((country: RestCountriesResponse) => {
        const code = country.idd.root + (country.idd.suffixes[0] || "");
        return {
          code,
          country: country.cca3, // Use 3-letter country code
          flag: country.flag || "🏳️",
        };
      })
      .sort((a: CountryCode, b: CountryCode) =>
        a.country.localeCompare(b.country)
      );

    // Move Ghana to the top for better UX
    const ghanaIndex = countryCodes.findIndex((c) => c.country === "GHA");
    if (ghanaIndex > -1) {
      const ghana = countryCodes.splice(ghanaIndex, 1)[0];
      countryCodes.unshift(ghana);
    }

    return countryCodes;
  } catch (error) {
    console.error("Error fetching country codes:", error);
    return DEFAULT_COUNTRY_CODES;
  }
};

// Export the default codes for immediate use
export const COUNTRY_CODES = DEFAULT_COUNTRY_CODES;
