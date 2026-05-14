const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { email: "admin@peakrentals.local" },
    update: { role: "ADMIN", name: "Peak Admin" },
    create: { email: "admin@peakrentals.local", role: "ADMIN", name: "Peak Admin" },
  });

  const owner = await prisma.user.upsert({
    where: { email: "owner@peakrentals.local" },
    update: { role: "OWNER", name: "Demo Owner" },
    create: { email: "owner@peakrentals.local", role: "OWNER", name: "Demo Owner" },
  });

  const ownerTwo = await prisma.user.upsert({
    where: { email: "owner2@peakrentals.local" },
    update: { role: "OWNER", name: "Second Owner" },
    create: { email: "owner2@peakrentals.local", role: "OWNER", name: "Second Owner" },
  });

  await prisma.user.upsert({
    where: { email: "renter1@peakrentals.local" },
    update: { role: "USER", name: "Demo Renter One" },
    create: { email: "renter1@peakrentals.local", role: "USER", name: "Demo Renter One" },
  });

  await prisma.user.upsert({
    where: { email: "renter2@peakrentals.local" },
    update: { role: "USER", name: "Demo Renter Two" },
    create: { email: "renter2@peakrentals.local", role: "USER", name: "Demo Renter Two" },
  });

  const items = [
    {
      title: "1998 JLG 10054 Telehandler",
      category: "Telehandler",
      description: "10,000 lb capacity. Great for framing, roof work, and material handling.",
      dailyRate: 45000,
      specs: JSON.stringify({
        model: "JLG 10054",
        year: 1998,
        capacity_lbs: 10000,
        lift_height_ft: 53.17,
        hourMeter: 4500,
      }),
      image: "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=1200",
      location: "Boise, ID",
      ownerId: owner.id,
    },
    {
      title: "80ft Boom Lift",
      category: "Boom Lift",
      description: "Ideal for exterior cladding and high access work.",
      dailyRate: 52500,
      specs: JSON.stringify({ working_height_ft: 80, power: "Diesel", hourMeter: 2600 }),
      location: "Spokane, WA",
      ownerId: owner.id,
    },
    {
      title: "CAT 299D3 Compact Track Loader",
      category: "Skid Steer",
      description: "High-flow track loader with enclosed cab. Great traction for rough sites.",
      dailyRate: 37500,
      specs: JSON.stringify({ model: "299D3", year: 2021, horsepower: 74, hydraulic_flow_gpm: 30 }),
      image: "https://images.unsplash.com/photo-1500673922987-e212871fec22?w=1200",
      location: "Portland, OR",
      ownerId: ownerTwo.id,
    },
    {
      title: "32ft Electric Scissor Lift",
      category: "Scissor Lift",
      description: "Indoor/outdoor slab use with non-marking tires.",
      dailyRate: 21000,
      specs: JSON.stringify({ working_height_ft: 32, power: "Electric", platform_capacity_lbs: 500 }),
      location: "Tacoma, WA",
      ownerId: ownerTwo.id,
    },
  ];

  for (const item of items) {
    const exists = await prisma.equipment.findFirst({
      where: { title: item.title, ownerId: owner.id },
    });
    if (!exists) await prisma.equipment.create({ data: item });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
