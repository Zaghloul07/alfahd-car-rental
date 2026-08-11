// Curated list of makes/models commonly sold in the Egyptian market.
// No public API tracks "cars common in Egypt" by popularity, so this is
// hand-curated rather than pulled from a live database.
export const EGYPT_CAR_MAKES: Record<string, string[]> = {
  Toyota: ["Corolla", "Yaris", "Camry", "Cross", "Fortuner", "Hilux", "RAV4", "Land Cruiser"],
  Hyundai: ["Elantra", "Accent", "Verna", "Tucson", "Creta", "i10", "i20", "Santa Fe"],
  Kia: ["Cerato", "Rio", "Sportage", "Sonet", "Picanto", "Seltos", "Sorento"],
  Nissan: ["Sunny", "Qashqai", "Sentra", "X-Trail", "Juke", "Kicks"],
  Chevrolet: ["Optra", "Aveo", "Captiva", "Cruze", "Groove"],
  MG: ["MG5", "MG6", "ZS", "RX5", "HS", "MG3"],
  Renault: ["Logan", "Sandero", "Duster", "Megane", "Symbol", "Kadjar"],
  Peugeot: ["301", "2008", "3008", "508", "208"],
  Fiat: ["Tipo", "500", "500X"],
  BYD: ["F3", "e2", "Song Plus", "Atto 3", "Han", "Seagull"],
  Skoda: ["Octavia", "Rapid", "Karoq", "Kamiq"],
  Volkswagen: ["Golf", "Passat", "Tiguan", "Jetta", "T-Roc"],
  BMW: ["3 Series", "5 Series", "X1", "X3", "X5"],
  "Mercedes-Benz": ["C-Class", "E-Class", "GLC", "S-Class"],
  Suzuki: ["Swift", "Vitara", "Celerio", "Ciaz"],
  Mitsubishi: ["Attrage", "Lancer", "Xpander", "Eclipse Cross"],
  Opel: ["Corsa", "Astra", "Grandland"],
  Citroen: ["C-Elysee", "C3", "C4"],
  Seat: ["Ibiza", "Leon", "Ateca"],
  Jeep: ["Wrangler", "Compass", "Cherokee", "Renegade"],
  Chery: ["Tiggo 7", "Tiggo 8", "Arrizo 5"],
  Geely: ["Emgrand", "Coolray", "Azkarra"],
  Changan: ["CS35 Plus", "Eado", "CS55"],
  JAC: ["J4", "S3", "JS4"],
  Honda: ["Civic", "CR-V", "Accord", "HR-V"],
  Mazda: ["3", "CX-5", "CX-30"],
};

export const EGYPT_CAR_MAKE_NAMES = Object.keys(EGYPT_CAR_MAKES).sort();

const CURRENT_YEAR = new Date().getFullYear();
export const CAR_YEARS = Array.from(
  { length: CURRENT_YEAR - 2015 + 1 },
  (_, i) => CURRENT_YEAR - i
);

export const EGYPT_LOCATIONS = [
  "Cairo",
  "New Cairo",
  "6th of October",
  "Giza",
  "Cairo Airport",
  "Alexandria",
  "Mansoura",
  "Tanta",
  "Ismailia",
  "Port Said",
  "Suez",
  "Hurghada",
  "Sharm El Sheikh",
  "Luxor",
  "Aswan",
];

export const CAR_CATEGORIES = [
  "Economy",
  "Sedan",
  "Hatchback",
  "SUV",
  "Crossover",
  "Pickup",
  "Van",
  "Luxury",
  "Coupe",
];

// Ensures a stored value that predates/falls outside the curated list
// (e.g. from older seed data) still shows up instead of disappearing.
export function withCurrentValue(options: string[], current?: string | null) {
  if (!current || options.includes(current)) return options;
  return [current, ...options];
}
