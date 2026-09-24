const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const reqs = await prisma.rideRequest.findMany();
  console.log('Ride Requests:', reqs);
  const orders = await prisma.order.findMany();
  console.log('Orders:', orders);
}
main().finally(() => prisma.$disconnect());
