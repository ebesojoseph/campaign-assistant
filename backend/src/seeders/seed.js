import crypto from "node:crypto";
import { pathToFileURL } from "node:url";
import { env } from "../config/env.js";
import { CUSTOMER_STATUS, ROLES } from "../constants/index.js";
import {
  Customer,
  CustomerTransaction,
  Segment,
  User,
  sequelize,
} from "../models/index.js";
import { hashPassword } from "../utils/password.js";

// Small deterministic PRNG so seeds are reproducible.
function mulberry32(a) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = [
  "Amina",
  "John",
  "Grace",
  "Samuel",
  "Fatou",
  "Peter",
  "Linda",
  "Moussa",
  "Esther",
  "David",
  "Chloe",
  "Ibrahim",
  "Marie",
  "Paul",
  "Aisha",
  "Kevin",
];
const LAST = [
  "Ngu",
  "Mbarga",
  "Okafor",
  "Diallo",
  "Tabi",
  "Mensah",
  "Nkeng",
  "Traore",
  "Fon",
  "Abena",
  "Smith",
  "Dupont",
  "Eyong",
  "Bello",
  "Kamga",
  "Tchoua",
];
const COUNTRIES = [
  "Cameroon",
  "Cameroon",
  "Cameroon",
  "Nigeria",
  "Nigeria",
  "Ghana",
  "Senegal",
  "France",
  "United States",
];
const CITIES = {
  Cameroon: ["Douala", "Yaoundé", "Buea"],
  Nigeria: ["Lagos", "Abuja"],
  Ghana: ["Accra"],
  Senegal: ["Dakar"],
  France: ["Paris"],
  "United States": ["Austin"],
};
const CATEGORIES = [
  "software",
  "hardware",
  "support-plan",
  "training",
  "accessories",
];

export async function seedDatabase({ customerCount = 200, seed = 42 } = {}) {
  const rand = mulberry32(seed);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const DAY = 24 * 3600 * 1000;
  const now = Date.now();

  // --- admin ---
  let admin = null;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "password";
  if (adminPassword) {
    const email = (
      process.env.SEED_ADMIN_EMAIL || "admin@dmesystems.com"
    ).toLowerCase();
    [admin] = await User.findOrCreate({
      where: { email },
      defaults: {
        name: "DME Admin",
        passwordHash: await hashPassword(adminPassword),
        role: ROLES.ADMIN,
      },
    });
  }

  // --- customers + transactions ---
  const customers = [];
  const transactions = [];
  for (let i = 0; i < customerCount; i += 1) {
    const first = pick(FIRST);
    const last = pick(LAST);
    const country = pick(COUNTRIES);
    const id = crypto.randomUUID();

    const isLead = rand() < 0.1;
    const orders = isLead ? 0 : 1 + Math.floor(rand() * rand() * 25);
    const recencyBias = rand(); // some customers lapse long ago
    const lastAgeDays =
      recencyBias < 0.5
        ? rand() * 60
        : recencyBias < 0.8
          ? 60 + rand() * 120
          : 180 + rand() * 400;

    let total = 0;
    let lastPurchase = null;
    for (let o = 0; o < orders; o += 1) {
      const ageDays = o === 0 ? lastAgeDays : lastAgeDays + rand() * 500;
      const amount = Math.round((20 + rand() * rand() * 900) * 100) / 100;
      const purchasedAt = new Date(now - ageDays * DAY);
      total += amount;
      if (!lastPurchase || purchasedAt > lastPurchase)
        lastPurchase = purchasedAt;
      transactions.push({
        id: crypto.randomUUID(),
        customerId: id,
        amount,
        currency: "USD",
        category: pick(CATEGORIES),
        purchasedAt,
      });
    }
    total = Math.round(total * 100) / 100;

    let status = CUSTOMER_STATUS.LEAD;
    if (orders > 0) {
      if (lastAgeDays > 180) status = CUSTOMER_STATUS.CHURNED;
      else if (lastAgeDays > 60) status = CUSTOMER_STATUS.INACTIVE;
      else status = total > 2500 ? CUSTOMER_STATUS.VIP : CUSTOMER_STATUS.ACTIVE;
    }

    // Normalized Customer payload (no totalSpent or orderCount)
    customers.push({
      id,
      firstName: first,
      lastName: last,
      email: `${first}.${last}.${i}@example.com`.toLowerCase(),
      phone: `+237 6${String(Math.floor(rand() * 1e8)).padStart(8, "0")}`,
      country,
      city: pick(CITIES[country]),
      status,
      lastPurchaseAt: lastPurchase,
      marketingOptIn: rand() > 0.08,
    });
  }

  await Customer.bulkCreate(customers, { ignoreDuplicates: true });
  for (let i = 0; i < transactions.length; i += 500) {
    await CustomerTransaction.bulkCreate(transactions.slice(i, i + 500));
  }

  // --- sample segments ---
  const segments = [
    {
      name: "VIP customers",
      description: "High spenders who bought recently",
      criteria: { statuses: ["vip"], purchasedWithinDays: 60 },
    },
    {
      name: "Win-back: lapsed 90+ days",
      description: "Customers with orders who went quiet",
      criteria: {
        statuses: ["inactive", "churned"],
        inactiveForDays: 90,
        minOrderCount: 1,
      },
    },
    {
      name: "New leads",
      description: "Never purchased",
      criteria: { statuses: ["lead"] },
    },
  ];
  for (const s of segments) {
    await Segment.findOrCreate({
      where: { name: s.name },
      defaults: { ...s, createdBy: admin?.id ?? null },
    });
  }

  return {
    customers: customers.length,
    transactions: transactions.length,
    segments: segments.length,
    admin: admin?.email ?? null,
  };
}

// CLI: `npm run seed` / `npm run seed:reset`
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  (async () => {
    try {
      await sequelize.authenticate();
      if (process.argv.includes("--reset")) {
        if (env.isProd)
          throw new Error("Refusing to reset the database in production");
        await sequelize.sync({ force: true });
      } else {
        await sequelize.sync();
      }
      console.log("Seeded:", await seedDatabase());
    } catch (err) {
      console.error(err);
      process.exitCode = 1;
    } finally {
      await sequelize.close();
    }
  })();
}
