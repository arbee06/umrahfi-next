import airportsData from '@/data/airports.json';
import { getCountryByName } from '@/utils/countries';

export const getAirports = () => {
  return airportsData.sort((a, b) => a.name.localeCompare(b.name));
};

export const getAirportByCode = (code) => {
  return airportsData.find(airport => airport.iata === code);
};

export const searchAirports = (query) => {
  const lowerQuery = query.toLowerCase();
  return airportsData.filter(airport => 
    airport.name.toLowerCase().includes(lowerQuery) ||
    airport.city.toLowerCase().includes(lowerQuery) ||
    airport.iata.toLowerCase().includes(lowerQuery) ||
    airport.country.toLowerCase().includes(lowerQuery)
  ).sort((a, b) => a.name.localeCompare(b.name));
};

export const getAirportsByContinent = (continent) => {
  return airportsData.filter(airport => 
    airport.continent === continent
  ).sort((a, b) => a.name.localeCompare(b.name));
};

export const getAirportsByCountry = (country) => {
  if (!country) return airportsData.sort((a, b) => a.name.localeCompare(b.name));
  
  // Handle both country names ("Germany") and country codes ("DE")
  let countryCode = country;
  if (country.length > 2) {
    // It's a country name, convert to code
    const countryData = getCountryByName(country);
    countryCode = countryData?.code || country;
  }
  
  return airportsData.filter(airport => 
    airport.country.toLowerCase() === countryCode.toLowerCase()
  ).sort((a, b) => a.name.localeCompare(b.name));
};

export const formatAirportDisplay = (airport) => {
  if (!airport) return '';
  return `${airport.name} (${airport.iata}) - ${airport.city}, ${airport.country}`;
};