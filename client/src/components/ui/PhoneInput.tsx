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
    const validationError = validatePhoneNumber(value);
    onPhoneNumberChange(value);
  };

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
            type="number"
            value={phoneNumber}
            onChange={handlePhoneChange}
            placeholder={placeholder}
            pattern="[0-9]{7,15}"
            required={required}
            min="0"
            className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
