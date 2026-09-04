import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";

// Get admin dashboard data
export const getAdminStats = async (req: Request, res: Response) => {
  const [
    totalOrders,
    totalUsers,
    totalProducts,
    outOfStock,
    totalPartners,
    recentOrders,
  ] = await Promise.all([
    prisma.order.count({
      where: { NOT: [{ paymentMethod: "esewa", isPaid: false }] },
    }),
    prisma.user.count(),
    prisma.product.count(),
    prisma.product.count({ where: { stock: 0 } }),
    prisma.deliveryPartner.count(),
    prisma.order.findMany({
      where: { NOT: [{ paymentMethod: "esewa", isPaid: false }] },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        user: { select: { name: true, email: true } },
        deiveryPartner: { select: { name: true, phone: true } },
      },
    }),
  ]);

  res.json({
    totalOrders,
    totalUsers,
    totalProducts,
    outOfStock,
    totalPartners,
    recentOrders,
  });
};
