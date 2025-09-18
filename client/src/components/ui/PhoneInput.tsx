import React, { useState, useEffect } from "react";
import { MdPhone } from "react-icons/md";
import {
  fetchCountryCodes,
  DEFAULT_COUNTRY_CODES,
  type CountryCode,
} from "../../utils/countryCode";

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
        const codes = await fetchCountryCodes();
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

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-foreground mb-2">
          {label} {required && "*"}
        </label>
      )}
      <div className="flex space-x-2">
        <select
          value={countryCode}
          onChange={(e) => onCountryCodeChange(e.target.value)}
          disabled={isLoading}
          className="px-3 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground min-w-[120px]"
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
        <div className="relative flex-1">
          <MdPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => onPhoneNumberChange(e.target.value)}
            placeholder={placeholder}
            pattern="[0-9]{7,15}"
            required={required}
            className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
          />
        </div>
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

export default PhoneInput;
