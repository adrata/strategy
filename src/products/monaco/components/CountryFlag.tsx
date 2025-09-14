import React from "react";

interface CountryFlagProps {
  location: string;
  size?: "sm" | "md" | "lg";
}

// Map common location formats to country codes
const getCountryCode = (location: string): string => {
  const normalizedLocation = location.toLowerCase();

  if (
    normalizedLocation.includes("usa") ||
    normalizedLocation.includes("united states") ||
    normalizedLocation.includes("america") ||
    normalizedLocation.includes("seattle") ||
    normalizedLocation.includes("san francisco") ||
    normalizedLocation.includes("california") ||
    normalizedLocation.includes("new york") ||
    normalizedLocation.includes("texas") ||
    normalizedLocation.includes("arizona") ||
    normalizedLocation.includes("phoenix")
  ) {
    return "US";
  }
  if (
    normalizedLocation.includes("uk") ||
    normalizedLocation.includes("united kingdom") ||
    normalizedLocation.includes("london") ||
    normalizedLocation.includes("england") ||
    normalizedLocation.includes("britain")
  ) {
    return "GB";
  }
  if (
    normalizedLocation.includes("canada") ||
    normalizedLocation.includes("toronto") ||
    normalizedLocation.includes("vancouver")
  ) {
    return "CA";
  }
  if (
    normalizedLocation.includes("germany") ||
    normalizedLocation.includes("berlin") ||
    normalizedLocation.includes("munich")
  ) {
    return "DE";
  }
  if (
    normalizedLocation.includes("france") ||
    normalizedLocation.includes("paris")
  ) {
    return "FR";
  }
  if (
    normalizedLocation.includes("japan") ||
    normalizedLocation.includes("tokyo")
  ) {
    return "JP";
  }
  if (
    normalizedLocation.includes("australia") ||
    normalizedLocation.includes("sydney") ||
    normalizedLocation.includes("melbourne")
  ) {
    return "AU";
  }
  if (
    normalizedLocation.includes("india") ||
    normalizedLocation.includes("mumbai") ||
    normalizedLocation.includes("bangalore")
  ) {
    return "IN";
  }
  if (
    normalizedLocation.includes("china") ||
    normalizedLocation.includes("beijing") ||
    normalizedLocation.includes("shanghai")
  ) {
    return "CN";
  }
  if (
    normalizedLocation.includes("brazil") ||
    normalizedLocation.includes("sao paulo")
  ) {
    return "BR";
  }
  if (
    normalizedLocation.includes("netherlands") ||
    normalizedLocation.includes("amsterdam")
  ) {
    return "NL";
  }
  if (
    normalizedLocation.includes("sweden") ||
    normalizedLocation.includes("stockholm")
  ) {
    return "SE";
  }
  if (normalizedLocation.includes("singapore")) {
    return "SG";
  }

  return "US"; // Default fallback
};

// Unicode flag emojis
const getFlagEmoji = (countryCode: string): string => {
  const flags: Record<string, string> = {
    US: "🇺🇸",
    GB: "🇬🇧",
    CA: "🇨🇦",
    DE: "🇩🇪",
    FR: "🇫🇷",
    JP: "🇯🇵",
    AU: "🇦🇺",
    IN: "🇮🇳",
    CN: "🇨🇳",
    BR: "🇧🇷",
    NL: "🇳🇱",
    SE: "🇸🇪",
    SG: "🇸🇬",
  };

  return flags[countryCode] || "🌍";
};

export const CountryFlag: React.FC<CountryFlagProps> = ({
  location,
  size = "sm",
}) => {
  const countryCode = getCountryCode(location);
  const flagEmoji = getFlagEmoji(countryCode);

  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <span
      className={`inline-block ${sizeClasses[size]}`}
      title={`${location} (${countryCode})`}
    >
      {flagEmoji}
    </span>
  );
};

export default CountryFlag;
