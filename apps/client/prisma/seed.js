const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Geographic anchor: Big White Village, BC
const BWV = { lat: 49.7231, lng: -118.9367 };

// Helper: spread coordinates around the anchor (~50km radius)
const nearby = (offsetLat, offsetLng) => ({
  lat: BWV.lat + offsetLat,
  lng: BWV.lng + offsetLng,
});

async function main() {
  // -----------------------------------------------------------------------
  // Users — admin, two owners, two renters; each with a Peak profile
  // -----------------------------------------------------------------------
  const admin = await prisma.user.upsert({
    where: { email: "admin@peak.local" },
    update: {
      role: "ADMIN",
      name: "Peak Admin",
      flavor: "Stewarding the trust graph.",
      foundingMember: true,
      avatarUrl: "https://api.dicebear.com/8.x/initials/svg?seed=PA",
      locationName: "Big White Village",
      latitude: BWV.lat,
      longitude: BWV.lng,
    },
    create: {
      email: "admin@peak.local",
      role: "ADMIN",
      name: "Peak Admin",
      flavor: "Stewarding the trust graph.",
      foundingMember: true,
      avatarUrl: "https://api.dicebear.com/8.x/initials/svg?seed=PA",
      locationName: "Big White Village",
      latitude: BWV.lat,
      longitude: BWV.lng,
    },
  });

  const owner = await prisma.user.upsert({
    where: { email: "owner@peak.local" },
    update: {
      role: "OWNER",
      name: "Mara Thornberry",
      flavor: "Telehandlers, boom lifts, fair handshake deals.",
      foundingMember: true,
      avatarUrl: "https://api.dicebear.com/8.x/initials/svg?seed=MT",
      locationName: "Big White Village",
      ...positionFields(nearby(0.01, -0.02)),
    },
    create: {
      email: "owner@peak.local",
      role: "OWNER",
      name: "Mara Thornberry",
      flavor: "Telehandlers, boom lifts, fair handshake deals.",
      foundingMember: true,
      avatarUrl: "https://api.dicebear.com/8.x/initials/svg?seed=MT",
      locationName: "Big White Village",
      ...positionFields(nearby(0.01, -0.02)),
    },
  });

  const ownerTwo = await prisma.user.upsert({
    where: { email: "owner2@peak.local" },
    update: {
      role: "OWNER",
      name: "Daniel Ostrov",
      flavor: "Compact equipment specialist. Will not lend to strangers.",
      avatarUrl: "https://api.dicebear.com/8.x/initials/svg?seed=DO",
      locationName: "Kelowna",
      ...positionFields(nearby(-0.45, 0.78)),
    },
    create: {
      email: "owner2@peak.local",
      role: "OWNER",
      name: "Daniel Ostrov",
      flavor: "Compact equipment specialist. Will not lend to strangers.",
      avatarUrl: "https://api.dicebear.com/8.x/initials/svg?seed=DO",
      locationName: "Kelowna",
      ...positionFields(nearby(-0.45, 0.78)),
    },
  });

  const renter1 = await prisma.user.upsert({
    where: { email: "renter1@peak.local" },
    update: {
      role: "USER",
      name: "Jules Park",
      flavor: "Building a deck. Probably borrowing a scissor lift.",
      avatarUrl: "https://api.dicebear.com/8.x/initials/svg?seed=JP",
      locationName: "Rock Creek",
      ...positionFields(nearby(0.08, 0.41)),
    },
    create: {
      email: "renter1@peak.local",
      role: "USER",
      name: "Jules Park",
      flavor: "Building a deck. Probably borrowing a scissor lift.",
      avatarUrl: "https://api.dicebear.com/8.x/initials/svg?seed=JP",
      locationName: "Rock Creek",
      ...positionFields(nearby(0.08, 0.41)),
    },
  });

  const renter2 = await prisma.user.upsert({
    where: { email: "renter2@peak.local" },
    update: {
      role: "USER",
      name: "Sasha Voss",
      flavor: "Trail crew. Always need something with hydraulics.",
      avatarUrl: "https://api.dicebear.com/8.x/initials/svg?seed=SV",
      locationName: "Beaverdell",
      ...positionFields(nearby(0.22, 0.05)),
    },
    create: {
      email: "renter2@peak.local",
      role: "USER",
      name: "Sasha Voss",
      flavor: "Trail crew. Always need something with hydraulics.",
      avatarUrl: "https://api.dicebear.com/8.x/initials/svg?seed=SV",
      locationName: "Beaverdell",
      ...positionFields(nearby(0.22, 0.05)),
    },
  });

  // -----------------------------------------------------------------------
  // Trust graph — a small mutual-vouch web
  // -----------------------------------------------------------------------
  const vouches = [
    { voucherId: admin.id,    voucheeId: owner.id,    broadcast: true,  note: "Founding member." },
    { voucherId: admin.id,    voucheeId: ownerTwo.id, broadcast: true,  note: "Vetted operator." },
    { voucherId: owner.id,    voucheeId: renter1.id,  broadcast: true,  note: "Reliable, returns gear clean." },
    { voucherId: ownerTwo.id, voucheeId: renter2.id,  broadcast: false, note: "Trail crew, knows what they're doing." },
    { voucherId: renter1.id,  voucheeId: renter2.id,  broadcast: true,  note: "Worked together on the ridge trail." },
  ];

  for (const v of vouches) {
    await prisma.vouch.upsert({
      where: { voucherId_voucheeId: { voucherId: v.voucherId, voucheeId: v.voucheeId } },
      update: {
        broadcast: v.broadcast,
        note: v.note,
        broadcastAt: v.broadcast ? new Date() : null,
      },
      create: {
        voucherId: v.voucherId,
        voucheeId: v.voucheeId,
        broadcast: v.broadcast,
        broadcastAt: v.broadcast ? new Date() : null,
        note: v.note,
      },
    });

    // Mutual contact cards
    await prisma.contactCard.createMany({
      data: [
        { collectorId: v.voucherId, subjectId: v.voucheeId, origin: "vouch" },
        { collectorId: v.voucheeId, subjectId: v.voucherId, origin: "vouch" },
      ],
    }).catch(() => undefined); // ignore unique constraint dupes
  }

  // -----------------------------------------------------------------------
  // Peaks transactions + balances — reflect founding bonuses and vouches
  // -----------------------------------------------------------------------
  const peaksLedger = [
    { userId: admin.id,    amount: 500, reason: "founding_member" },
    { userId: owner.id,    amount: 500, reason: "founding_member" },
    { userId: admin.id,    amount: 5,   reason: "vouch_given" },
    { userId: admin.id,    amount: 5,   reason: "vouch_given" },
    { userId: owner.id,    amount: 5,   reason: "vouch_given" },
    { userId: owner.id,    amount: 10,  reason: "vouch_broadcast" },
    { userId: ownerTwo.id, amount: 10,  reason: "vouch_broadcast" },
    { userId: renter1.id,  amount: 10,  reason: "vouch_broadcast" },
    { userId: renter1.id,  amount: 5,   reason: "vouch_given" },
    { userId: ownerTwo.id, amount: 5,   reason: "vouch_given" },
    { userId: renter2.id,  amount: 3,   reason: "first_interaction" },
  ];

  for (const tx of peaksLedger) {
    await prisma.peaksTransaction.create({
      data: tx,
    });
  }

  // Sum transactions into peaksBalance per user
  for (const user of [admin, owner, ownerTwo, renter1, renter2]) {
    const sum = await prisma.peaksTransaction.aggregate({
      where: { userId: user.id },
      _sum: { amount: true },
    });
    await prisma.user.update({
      where: { id: user.id },
      data: { peaksBalance: sum._sum.amount ?? 0 },
    });
  }

  // -----------------------------------------------------------------------
  // Equipment — Big White and nearby
  // -----------------------------------------------------------------------
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
      location: "Big White Village",
      ownerId: owner.id,
    },
    {
      title: "80ft Boom Lift",
      category: "Boom Lift",
      description: "Ideal for exterior cladding and high access work.",
      dailyRate: 52500,
      specs: JSON.stringify({ working_height_ft: 80, power: "Diesel", hourMeter: 2600 }),
      location: "Rock Creek",
      ownerId: owner.id,
    },
    {
      title: "CAT 299D3 Compact Track Loader",
      category: "Skid Steer",
      description: "High-flow track loader with enclosed cab. Great traction for rough sites.",
      dailyRate: 37500,
      specs: JSON.stringify({ model: "299D3", year: 2021, horsepower: 74, hydraulic_flow_gpm: 30 }),
      image: "https://images.unsplash.com/photo-1500673922987-e212871fec22?w=1200",
      location: "Kelowna",
      ownerId: ownerTwo.id,
    },
    {
      title: "32ft Electric Scissor Lift",
      category: "Scissor Lift",
      description: "Indoor/outdoor slab use with non-marking tires.",
      dailyRate: 21000,
      specs: JSON.stringify({ working_height_ft: 32, power: "Electric", platform_capacity_lbs: 500 }),
      location: "Kelowna",
      ownerId: ownerTwo.id,
    },
  ];

  for (const item of items) {
    const exists = await prisma.equipment.findFirst({
      where: { title: item.title, ownerId: item.ownerId },
    });
    if (!exists) await prisma.equipment.create({ data: item });
  }

  // -----------------------------------------------------------------------
  // Conversation — owner and renter1 talking about the telehandler
  // -----------------------------------------------------------------------
  const telehandler = await prisma.equipment.findFirst({
    where: { title: "1998 JLG 10054 Telehandler" },
  });

  const existingConversation = await prisma.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { id: owner.id } } },
        { participants: { some: { id: renter1.id } } },
      ],
    },
  });

  if (!existingConversation) {
    const conversation = await prisma.conversation.create({
      data: {
        participants: { connect: [{ id: owner.id }, { id: renter1.id }] },
        equipmentId: telehandler?.id,
      },
    });

    const messages = [
      { senderId: renter1.id, content: "Hi Mara — is the telehandler available next weekend?" },
      { senderId: owner.id,   content: "Hey Jules. Yep, Friday through Sunday is open. Pickup at Big White." },
      { senderId: renter1.id, content: "Perfect. I'll book it through the app." },
    ];

    for (const m of messages) {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: m.senderId,
          content: m.content,
        },
      });
    }

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });
  }

  // -----------------------------------------------------------------------
  // Treasure chests — seasonal rewards
  // -----------------------------------------------------------------------
  const chests = [
    {
      title: "Cabin Cocoa Voucher",
      description: "Hot cocoa at the day lodge, on the house. Limited release.",
      peaksCost: 25,
      prizeType: "discount",
      prizeValue: "5 free cocoas at the day lodge",
    },
    {
      title: "Founder's Cord Hat",
      description: "Embroidered Peak hat for the early crew.",
      peaksCost: 150,
      prizeType: "physical_item",
      prizeValue: "Founders Cord Hat",
    },
    {
      title: "Map Region — North Cascades",
      description: "Unlock offline tiles for the North Cascades.",
      peaksCost: 50,
      prizeType: "feature_unlock",
      prizeValue: "region:north_cascades",
    },
  ];

  for (const c of chests) {
    const exists = await prisma.treasureChest.findFirst({ where: { title: c.title } });
    if (!exists) await prisma.treasureChest.create({ data: c });
  }

  console.log("Seed complete.");
}

function positionFields({ lat, lng }) {
  return { latitude: lat, longitude: lng };
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
