/**
 * Shared geography and organization taxonomy for the Maharashtra Zilla program.
 * Realistic Maharashtra divisions/districts/talukas and government departments.
 */

export const DIVISIONS = [
  "Konkan",
  "Pune",
  "Nashik",
  "Aurangabad",
  "Amravati",
  "Nagpur",
] as const;
export type Division = (typeof DIVISIONS)[number];

export type District = {
  name: string;
  division: Division;
  talukas: string[];
};

export const DISTRICTS: District[] = [
  {
    name: "Thane",
    division: "Konkan",
    talukas: ["Ambarnath", "Bhiwandi", "Kalyan", "Murbad", "Shahapur", "Ulhasnagar"],
  },
  {
    name: "Raigad",
    division: "Konkan",
    talukas: ["Alibag", "Panvel", "Karjat", "Khalapur", "Uran"],
  },
  {
    name: "Ratnagiri",
    division: "Konkan",
    talukas: ["Ratnagiri", "Chiplun", "Khed", "Dapoli"],
  },
  {
    name: "Pune",
    division: "Pune",
    talukas: ["Haveli", "Maval", "Mulshi", "Baramati", "Indapur", "Junnar"],
  },
  {
    name: "Satara",
    division: "Pune",
    talukas: ["Satara", "Karad", "Wai", "Phaltan", "Man"],
  },
  {
    name: "Kolhapur",
    division: "Pune",
    talukas: ["Karvir", "Hatkanangale", "Shirol", "Panhala"],
  },
  {
    name: "Nashik",
    division: "Nashik",
    talukas: ["Nashik", "Malegaon", "Sinnar", "Igatpuri", "Niphad"],
  },
  {
    name: "Ahmednagar",
    division: "Nashik",
    talukas: ["Nagar", "Sangamner", "Shrirampur", "Kopargaon"],
  },
  {
    name: "Aurangabad",
    division: "Aurangabad",
    talukas: ["Aurangabad", "Paithan", "Sillod", "Kannad", "Gangapur"],
  },
  {
    name: "Jalna",
    division: "Aurangabad",
    talukas: ["Jalna", "Ambad", "Partur", "Bhokardan"],
  },
  {
    name: "Amravati",
    division: "Amravati",
    talukas: ["Amravati", "Achalpur", "Chandur Bazar", "Warud", "Morshi"],
  },
  {
    name: "Akola",
    division: "Amravati",
    talukas: ["Akola", "Balapur", "Murtijapur", "Patur"],
  },
  {
    name: "Nagpur",
    division: "Nagpur",
    talukas: ["Nagpur (Urban)", "Nagpur (Rural)", "Kamptee", "Hingna", "Umred"],
  },
  {
    name: "Wardha",
    division: "Nagpur",
    talukas: ["Wardha", "Hinganghat", "Arvi", "Deoli"],
  },
];

export const DEPARTMENTS = [
  "Revenue",
  "Rural Development",
  "Agriculture",
  "Health & Family Welfare",
  "School Education",
  "Women & Child Development",
  "Water Resources",
  "Tribal Development",
] as const;
export type Department = (typeof DEPARTMENTS)[number];

export const DESIGNATIONS = [
  "Tehsildar",
  "Naib Tehsildar",
  "Block Development Officer",
  "Circle Officer",
  "Agriculture Officer",
  "Taluka Health Officer",
  "Block Education Officer",
  "Child Development Project Officer",
  "Executive Engineer",
  "Project Officer",
];

export const FIRST_NAMES = [
  "Ravindra", "Sunita", "Prakash", "Vaishali", "Sachin", "Meera", "Ganesh",
  "Anjali", "Vikram", "Priya", "Ramesh", "Suman", "Ajit", "Kavita", "Deepak",
  "Snehal", "Mahesh", "Rekha", "Nitin", "Pallavi", "Ashok", "Manisha", "Yogesh",
  "Shraddha", "Sudhir", "Neha", "Balaji", "Anita", "Kishor", "Smita", "Rajesh",
  "Jyoti", "Sandeep", "Poonam", "Uday", "Bhavana", "Chandrakant", "Madhuri",
  "Devendra", "Aparna", "Hemant", "Trupti", "Milind", "Shalini", "Prasad",
  "Vandana", "Girish", "Swati", "Shrikant", "Manasi",
];

export const LAST_NAMES = [
  "Patil", "Deshmukh", "Kulkarni", "Joshi", "Jadhav", "Pawar", "Shinde",
  "More", "Bhosale", "Chavan", "Salunke", "Kadam", "Gaikwad", "Sawant",
  "Yadav", "Ingle", "Wagh", "Thorat", "Mane", "Kale", "Powar", "Bhagat",
  "Rane", "Nikam", "Suryawanshi", "Bansode", "Khot", "Gawande", "Tambe",
  "Waghmare",
];

/** Deterministic pseudo-random generator, so mock data is stable per seed. */
export function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(rnd: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rnd() * arr.length)];
}

export function personName(rnd: () => number) {
  return `${pick(rnd, FIRST_NAMES)} ${pick(rnd, LAST_NAMES)}`;
}

export function phoneNumber(rnd: () => number) {
  const nine = Math.floor(rnd() * 900000000) + 100000000;
  return `+91 ${String(nine).slice(0, 5)} ${String(nine).slice(5)}`;
}

export function talukaList(): Array<{ taluka: string; district: string; division: Division }> {
  return DISTRICTS.flatMap((d) =>
    d.talukas.map((t) => ({ taluka: t, district: d.name, division: d.division })),
  );
}
