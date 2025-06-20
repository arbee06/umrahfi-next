import countriesData from '@/data/countries.json';

export const getCountries = () => {
  return countriesData.sort((a, b) => a.name.localeCompare(b.name));
};

export const getCountryByCode = (code) => {
  return countriesData.find(country => country.code === code);
};

export const getCountryByName = (name) => {
  return countriesData.find(country => country.name === name);
};

export const searchCountries = (query) => {
  const lowerQuery = query.toLowerCase();
  return countriesData.filter(country => 
    country.name.toLowerCase().includes(lowerQuery) ||
    country.code.toLowerCase().includes(lowerQuery)
  ).sort((a, b) => a.name.localeCompare(b.name));
};

export const formatCountryDisplay = (country) => {
  if (!country) return '';
  return `${country.name}`;
};

// Get popular countries for Umrah packages
export const getPopularCountries = () => {
  const popularCodes = ['SA', 'AE', 'TR', 'MY', 'ID', 'PK', 'IN', 'EG', 'JO', 'MA', 'US', 'GB', 'CA', 'AU', 'FR', 'DE'];
  return countriesData.filter(country => popularCodes.includes(country.code))
    .sort((a, b) => a.name.localeCompare(b.name));
};