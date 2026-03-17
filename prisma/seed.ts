import bcrypt from "bcrypt";
import { prisma } from "../src/lib/prisma";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

async function main() {
  const email = "demo@csulb.edu";
  const password = "Password123!";
  const hash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, password: hash, name: "Demo User" },
  });

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  for (let d = 1; d <= 10; d++) {
    const date = `${year}-${pad(month)}-${pad(d)}`;
    await prisma.timeEntry.upsert({
      where: { userId_date: { userId: user.id, date } },
      update: {},
      create: {
        userId: user.id,
        date,
        punchIn: "09:00",
        punchOut: "13:30",
        notes: d % 2 === 0 ? "Front desk + email cleanup" : null,
        breaks: { create: d % 3 === 0 ? [{ start: "11:00", end: "11:15" }] : [] },
      },
    });
  }

  console.log("Seed complete:", { email, password });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });