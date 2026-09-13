import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";

// GET /api/products/flash-deals
export const getFlashDeals = async (req: Request, res: Response) => {
  const products = await prisma.product.findMany({
    where: { stock: { gt: 0 } },
    orderBy: { originalPrice: "desc" },
  });

  const productsWithDiscount = products.map((p: any) => {
    const discount =
      p.originalPrice && p.price
        ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
        : 0;
    return { ...p, discount };
  });

  res.json({ products: productsWithDiscount.slice(0, 10) });
};

// GET /api/products
export const getProducts = async (req: Request, res: Response) => {
  const { category, search, minPrice, maxPrice, sort, page, limit } = req.query;

  const where: any = {};
  if (category && category !== "all") {
    where.category = category as string;
  }

  if (search) {
    where.name = { contains: search as string, mode: "insensitive" };
  }

  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) {
      where.price.gte = Number(minPrice);
    }
    if (maxPrice) {
      where.price.lte = Number(maxPrice);
    }
  }

  const orderBy: any = {};
  if (sort === "price_asc") {
    orderBy.price = "asc";
  } else if (sort === "price_desc") {
    orderBy.price = "desc";
  } else if (sort === "name") {
    orderBy.name = "asc";
  } else {
    // default: newest first
    orderBy.createdAt = "desc";
  }

  // Pagination
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.max(1, Number(limit) || 20);
  const skip = (pageNum - 1) * limitNum;

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take: limitNum,
    }),
  ]);

  const pages = Math.ceil(total / limitNum);

  const productsWithDiscount = products.map((p: any) => {
    const discount =
      p.originalPrice && p.price
        ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
        : 0;
    return { ...p, discount };
  });

  res.json({ products: productsWithDiscount, total, pages });
};

// GET /api/products/:id
export const getProductById = async (req: Request, res: Response) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id as string },
  });
  if (!product) {
    res.status(404).json({ message: "Product not found." });
    return;
  }

  const discount =
    product.originalPrice && product.price
      ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) *
        100,
      )
      : 0;
  res.json({ product: { ...product, discount } });
};

// POST api/products
export const createProduct = async (req: Request, res: Response) => {
  const product = await prisma.product.create({
    data: req.body,
  });

  res.status(201).json({ product });
};

// PUT api/products/:id
export const updateProduct = async (req: Request, res: Response) => {
  const product = await prisma.product.update({
    where: { id: req.params.id as string },
    data: req.body,
  });
  res.json({ product });
};

// DELETE api/products/:id
export const deleteProduct = async (req: Request, res: Response) => {
  await prisma.product.update({
    where: { id: req.params.id as string },
    data: { stock: Number(0) }
  });
  res.json({ message: "Product updated successfully." });
};
