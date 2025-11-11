import { faker } from '@faker-js/faker';

// Centralized seed data generator for advocates using Faker.
// Generates realistic-looking data at scale for local/dev environments.

const SPECIALTIES = [
  'Bipolar',
  'LGBTQ',
  'Medication/Prescribing',
  'Suicide History/Attempts',
  'General Mental Health (anxiety, depression, stress, grief, life transitions)',
  "Men's issues",
  'Relationship Issues (family, friends, couple, etc)',
  'Trauma & PTSD',
  'Personality disorders',
  'Personal growth',
  'Substance use/abuse',
  'Pediatrics',
  "Women's issues (post-partum, infertility, family planning)",
  'Chronic pain',
  'Weight loss & nutrition',
  'Eating disorders',
  'Diabetic Diet and nutrition',
  'Coaching (leadership, career, academic and wellness)',
  'Life coaching',
  'Obsessive-compulsive disorders',
  'Neuropsychological evaluations & testing (ADHD testing)',
  'Attention and Hyperactivity (ADHD)',
  'Sleep issues',
  'Schizophrenia and psychotic disorders',
  'Learning disorders',
  'Domestic abuse'
];

const DEGREES = ['MD', 'PhD', 'MSW', 'PsyD', 'NP'];

function getRandomSpecialties(minCount: number = 2, maxCount: number = 5): string[] {
  const count = Math.max(minCount, Math.min(maxCount, faker.number.int({ min: minCount, max: maxCount })));
  const shuffled = faker.helpers.shuffle([...SPECIALTIES]);
  return shuffled.slice(0, count);
}

function generatePhoneNumber(): number {
  // Keep within JS safe integer range; 10-digit number starting not-too-low.
  return faker.number.int({ min: 2000000000, max: 9999999999 });
}

export type NewAdvocateSeed = {
  firstName: string;
  lastName: string;
  city: string;
  degree: string;
  specialties: string[];
  yearsOfExperience: number;
  phoneNumber: number;
};

export function generateAdvocateData(count: number): NewAdvocateSeed[] {
  const rows: NewAdvocateSeed[] = [];
  for (let i = 0; i < count; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const city = faker.location.city();
    const degree = faker.helpers.arrayElement(DEGREES);
    const specialties = getRandomSpecialties();
    const yearsOfExperience = faker.number.int({ min: 0, max: 40 });
    const phoneNumber = generatePhoneNumber();

    rows.push({
      firstName,
      lastName,
      city,
      degree,
      specialties,
      yearsOfExperience,
      phoneNumber
    });
  }
  return rows;
}

export { SPECIALTIES, DEGREES };
