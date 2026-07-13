export type NoCity = {
  name: string;
  lat: number;
  lon: number;
};

export const NO_CITIES: NoCity[] = [
  { name: 'Oslo', lat: 59.9139, lon: 10.7522 },
  { name: 'Bergen', lat: 60.3913, lon: 5.3221 },
  { name: 'Trondheim', lat: 63.4305, lon: 10.3951 },
  { name: 'Stavanger', lat: 58.9700, lon: 5.7331 },
  { name: 'Drammen', lat: 59.7440, lon: 10.2045 },
  { name: 'Fredrikstad', lat: 59.2181, lon: 10.9298 },
  { name: 'Kristiansand', lat: 58.1599, lon: 8.0182 },
  { name: 'Sandnes', lat: 58.8517, lon: 5.7367 },
  { name: 'Tromsø', lat: 69.6492, lon: 18.9553 },
  { name: 'Sarpsborg', lat: 59.2839, lon: 11.1098 },
  { name: 'Skien', lat: 59.2096, lon: 9.6088 },
  { name: 'Ålesund', lat: 62.4722, lon: 6.1495 },
  { name: 'Sandefjord', lat: 59.1322, lon: 10.2167 },
  { name: 'Haugesund', lat: 59.4138, lon: 5.2680 },
  { name: 'Tønsberg', lat: 59.2674, lon: 10.4076 },
  { name: 'Moss', lat: 59.4370, lon: 10.6577 },
  { name: 'Porsgrunn', lat: 59.1396, lon: 9.6566 },
  { name: 'Bodø', lat: 67.2804, lon: 14.4049 },
  { name: 'Arendal', lat: 58.4612, lon: 8.7724 },
  { name: 'Hamar', lat: 60.7945, lon: 11.0680 },
  { name: 'Larvik', lat: 59.0537, lon: 10.0357 },
  { name: 'Halden', lat: 59.1310, lon: 11.3879 },
  { name: 'Lillehammer', lat: 61.1153, lon: 10.4662 },
  { name: 'Molde', lat: 62.7378, lon: 7.1591 },
  { name: 'Harstad', lat: 68.7984, lon: 16.5421 },
  { name: 'Gjøvik', lat: 60.7957, lon: 10.6915 },
  { name: 'Kongsberg', lat: 59.6669, lon: 9.6500 },
  { name: 'Horten', lat: 59.4170, lon: 10.4830 },
  { name: 'Kristiansund', lat: 63.1109, lon: 7.7283 },
  { name: 'Steinkjer', lat: 64.0145, lon: 11.4954 },
  { name: 'Narvik', lat: 68.4385, lon: 17.4272 },
  { name: 'Alta', lat: 69.9689, lon: 23.2716 },
  { name: 'Askøy', lat: 60.4733, lon: 5.1499 },
  { name: 'Rana', lat: 66.3128, lon: 14.1422 },
  { name: 'Bærum', lat: 59.8939, lon: 10.5460 },
  { name: 'Asker', lat: 59.8333, lon: 10.4333 },
  { name: 'Lillestrøm', lat: 59.9558, lon: 11.0492 },
  { name: 'Ski', lat: 59.7196, lon: 10.8324 },
  { name: 'Jessheim', lat: 60.1407, lon: 11.1742 },
  { name: 'Drøbak', lat: 59.6629, lon: 10.6293 },
  { name: 'Levanger', lat: 63.7458, lon: 11.2997 },
  { name: 'Mosjøen', lat: 65.8369, lon: 13.1922 },
  { name: 'Mo i Rana', lat: 66.3128, lon: 14.1422 },
  { name: 'Brønnøysund', lat: 65.4738, lon: 12.2128 },
  { name: 'Vadsø', lat: 70.0729, lon: 29.7491 },
  { name: 'Hammerfest', lat: 70.6634, lon: 23.6821 },
  { name: 'Kirkenes', lat: 69.7273, lon: 30.0444 },
  { name: 'Svolvær', lat: 68.2347, lon: 14.5681 },
  { name: 'Leknes', lat: 68.1467, lon: 13.6094 },
  { name: 'Sortland', lat: 68.6989, lon: 15.4178 },
  { name: 'Finnsnes', lat: 69.2289, lon: 17.9747 },
  { name: 'Notodden', lat: 59.5594, lon: 9.2576 },
  { name: 'Rjukan', lat: 59.8788, lon: 8.5938 },
  { name: 'Stryn', lat: 61.9056, lon: 6.7137 },
  { name: 'Førde', lat: 61.4517, lon: 5.8569 },
  { name: 'Sogndal', lat: 61.2300, lon: 7.1000 },
  { name: 'Voss', lat: 60.6293, lon: 6.4147 },
  { name: 'Odda', lat: 60.0689, lon: 6.5450 },
  { name: 'Flekkefjord', lat: 58.2966, lon: 6.6608 },
  { name: 'Mandal', lat: 58.0294, lon: 7.4633 },
];

/** Match by case-insensitive prefix; ranks exact-match first. */
export function searchCities(query: string, limit = 8): NoCity[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const exact: NoCity[] = [];
  const prefix: NoCity[] = [];
  const contains: NoCity[] = [];
  for (const c of NO_CITIES) {
    const n = c.name.toLowerCase();
    if (n === q) exact.push(c);
    else if (n.startsWith(q)) prefix.push(c);
    else if (n.includes(q)) contains.push(c);
  }
  return [...exact, ...prefix, ...contains].slice(0, limit);
}

/** Find a city by case-insensitive exact name. */
export function findCity(name: string): NoCity | undefined {
  const q = name.trim().toLowerCase();
  return NO_CITIES.find((c) => c.name.toLowerCase() === q);
}
