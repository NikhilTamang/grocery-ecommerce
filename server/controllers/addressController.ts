import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";

// Get user addresses
// GET /api/addresses
export const getAddresses = async (req: Request, res: Response) => {
  const addresses = await prisma.address.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "asc" },
  });
  res.json({ addresses });
};

// Add new address
// POST /api/addresses
export const addAddress = async (req: Request, res: Response) => {
  const { label, address, city, state, zip, isDefault, lat, lng } = req.body;

  // Require coordinates
  if (lat === null || lng === null) {
    return res
      .status(400)
      .json({ message: "Latitude and longitude are required." });
  }
  const cuurentAddresses = await prisma.address.findMany({
    where: { userId: req.user!.id },
  });

  let makeDefault = isDefault;
  if (cuurentAddresses.length === 0) {
    makeDefault = true;
  }

  if (makeDefault) {
    // Unset default for other addresses
    await prisma.address.updateMany({
      where: { userId: req.user!.id },
      data: { isDefault: false },
    });
  }

  await prisma.address.create({
    data: {
      userId: req.user!.id,
      label,
      address,
      city,
      state,
      zip,
      isDefault: makeDefault,
      lat: Number(lat),
      lng: Number(lng),
    },
  });

  const addresses = await prisma.address.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "asc" },
  });
  res.status(201).json({ addresses });
};

// Update address
// PUT /api/addresses/:id
export const updateAddress = async (req: Request, res: Response) => {
  const { label, address, city, state, zip, isDefault, lat, lng } = req.body;
  const addressId = req.params.id;

  // Require coordinates
  if (lat === null || lng === null) {
    return res
      .status(400)
      .json({ message: "Latitude and longitude are required." });
  }

  if (isDefault) {
    // Unset default for other addresses
    await prisma.address.updateMany({
      where: { userId: req.user!.id },
      data: { isDefault: false },
    });
  }

  const data: any = {};
  if (label) data.label = label;
  if (address) data.address = address;
  if (city) data.city = city;
  if (state) data.state = state;
  if (zip) data.zip = zip;
  if (isDefault !== undefined) data.isDefault = isDefault;
  if (lat != null) data.lat = Number(lat);
  if (lng != null) data.lat = Number(lng);

  try {
    await prisma.address.update({
      where: { id: req.params.id as string },
      data,
    });
  } catch (error) {
    return res.status(404).json({ message: "Address not found" });
  }

  const addresses = await prisma.address.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "asc" },
  });

  res.json({ addresses });
};

// Delete address
// DELETE /api/addresses/:id
export const deleteAddress = async (req: Request, res: Response) => {
  try {
    await prisma.address.delete({ where: { id: req.params.id as string } });
  } catch (err: any) {
    console.log(err.message);
  }

  const addresses = await prisma.address.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "asc" },
  });

  res.json({ addresses });
};
