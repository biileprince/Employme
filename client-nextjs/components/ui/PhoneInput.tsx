"use client";

import React, { useState, useEffect } from "react";
import { MdPhone } from "react-icons/md";

// Country codes interface
export interface CountryCode {
  code: string;
  country: string;
  flag: string;
}

// Default fallback country codes (Ghana-focused)
const DEFAULT_COUNTRY_CODES: CountryCode[] = [
  { code: "+233", country: "GHA", flag: "🇬🇭" },
  { code: "+234", country: "NGA", flag: "🇳🇬" },
  { code: "+1", country: "USA", flag: "🇺🇸" },
  { code: "+44", country: "GBR", flag: "🇬🇧" },
  { code: "+27", country: "ZAF", flag: "🇿🇦" },
];

interface PhoneInputProps {
  countryCode: string;
  phoneNumber: string;
  onCountryCodeChange: (countryCode: string) => void;
  onPhoneNumberChange: (phoneNumber: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  className?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  countryCode,
  phoneNumber,
  onCountryCodeChange,
  onPhoneNumberChange,
  label = "Phone Number",
  placeholder = "Phone number",
  required = false,
  error,
  className = "",
}) => {
  const [countryCodes, setCountryCodes] = useState<CountryCode[]>(
    DEFAULT_COUNTRY_CODES
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadCountryCodes = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          "https://restcountries.com/v3.1/all?fields=name,idd,flag,cca3"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch country codes");
        }

        const countries = await response.json();

        const codes: CountryCode[] = countries
          .filter(
            (country: {
              idd?: { root?: string; suffixes?: string[] };
              name?: { common?: string };
              cca3?: string;
            }) =>
              country.idd?.root &&
              country.idd?.suffixes?.length &&
              country.name?.common &&
              country.cca3
          )
          .map(
            (country: {
              idd: { root: string; suffixes: string[] };
              cca3: string;
              flag?: string;
            }) => {
              const code = country.idd.root + (country.idd.suffixes[0] || "");
              return {
                code,
                country: country.cca3,
                flag: country.flag || "🏳️",
              };
            }
          )
          .sort((a: CountryCode, b: CountryCode) =>
            a.country.localeCompare(b.country)
          );

        // Move Ghana to the top
        const ghanaIndex = codes.findIndex((c) => c.country === "GHA");
        if (ghanaIndex > -1) {
          const ghana = codes.splice(ghanaIndex, 1)[0];
          codes.unshift(ghana);
        }

        setCountryCodes(codes);
      } catch (error) {
        console.error("Failed to load country codes:", error);
        // Keep default codes if API fails
      } finally {
        setIsLoading(false);
      }
    };

    loadCountryCodes();
  }, []);

  // Phone number validation
  const validatePhoneNumber = (value: string) => {
    if (!value) return "";

    // Remove any non-digit characters
    const cleanNumber = value.replace(/\D/g, "");

    // For Ghana (+233), local numbers should start with 0
    if (countryCode === "+233" && cleanNumber && !cleanNumber.startsWith("0")) {
      return "Phone number should start with 0 (e.g., 0241234567)";
    }

    return "";
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    validatePhoneNumber(value);
    onPhoneNumberChange(value);
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-foreground mb-2">
          {label} {required && "*"}
        </label>
      )}
      <div className="flex gap-2">
        <select
          value={countryCode}
          onChange={(e) => onCountryCodeChange(e.target.value)}
          disabled={isLoading}
          className="px-2 sm:px-3 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground w-20 sm:w-24 md:min-w-[120px] text-xs sm:text-sm"
        >
          {countryCodes.map((country, index) => (
            <option
              key={`${country.code}-${country.country}-${index}`}
              value={country.code}
            >
              {country.flag} {country.code} {country.country}
            </option>
          ))}
        </select>
        <div className="relative flex-1 min-w-0">
          <MdPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 sm:w-5 sm:h-5" />
          <input
            type="number"
            value={phoneNumber}
            onChange={handlePhoneChange}
            placeholder={placeholder}
            pattern="[0-9]{7,15}"
            required={required}
            min="0"
            className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground text-sm sm:text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
      </div>
      {(error || validatePhoneNumber(phoneNumber)) && (
        <p className="text-red-500 text-xs mt-1">
          {error || validatePhoneNumber(phoneNumber)}
        </p>
      )}
    </div>
  );
};

export default PhoneInput;
