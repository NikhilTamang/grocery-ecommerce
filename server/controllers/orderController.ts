import { Request, Response } from "express";
import crypto from "crypto";
import { prisma } from "../config/prisma.js";
import {
  buildEsewaPaymentData,
  checkEsewaTransactionStatus,
  decodeEsewaResponse,
  EsewaResponsePayload,
  verifyEsewaResponseSignature,
} from "../utils/esewa.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeTotals(cartTotal: number) {
  const deliveryFee = cartTotal > 1000 ? 0 : 100;
  const tax = Math.round(cartTotal * 0.08 * 100) / 100;
  const total = Math.round((cartTotal + deliveryFee + tax) * 100) / 100;
  return { deliveryFee, tax, total };
}

// ---------------------------------------------------------------------------
// Create Order (COD only)
// POST /api/orders
// ---------------------------------------------------------------------------
export const createOrder = async (req: Request, res: Response) => {
  const { items, shippingAddress, paymentMethod } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: "No order items" });
  }

  if (paymentMethod === "esewa") {
    return res.status(400).json({
      message: "Use POST /api/orders/esewa/initiate for eSewa payments.",
    });
  }

  // Look up actual prices from the database
  const productIds = items.map((item: any) => item.product);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  const productMap: Record<string, (typeof products)[0]> = {};
  products.forEach((product: any) => {
    productMap[product.id] = product;
  });

  // Check stock
  for (const item of items) {
    const product = productMap[item.product];
    if (!product || (product.stock ?? 0) < item.quantity) {
      return res.status(404).json({ message: "Product out of stock" });
    }
  }

  const orderItems = items.map((item: any) => {
    const dbProduct = productMap[item.product];
    if (!dbProduct) throw new Error(`Product ${item.product} not found`);
    return {
      productId: dbProduct.id,
      name: dbProduct.name,
      image: dbProduct.image,
      price: dbProduct.price,
      quantity: item.quantity,
      unit: dbProduct.unit,
    };
  });

  const subtotal = orderItems.reduce(
    (sum: number, item: any) => sum + item.price * item.quantity,
    0,
  );
  const { deliveryFee, tax, total } = computeTotals(subtotal);

  const order = await prisma.order.create({
    data: {
      userId: req.user!.id,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      paymentStatus: "PAID",
      subtotal,
      deliveryFee,
      tax,
      total,
      status: "Placed",
      isPaid: true,
      statusHistory: [
        {
          status: "Placed",
          note: "Order placed successfully (COD)",
          timestamp: new Date(),
        },
      ],
    },
  });

  // Decrement stock
  for (const item of orderItems) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    });
  }

  res.json({ order });
};

// ---------------------------------------------------------------------------
// Initiate eSewa Payment (no Order created yet)
// POST /api/orders/esewa/initiate  (auth required)
// ---------------------------------------------------------------------------
export const initiateEsewaPayment = async (req: Request, res: Response) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No order items" });
    }

    // Look up prices
    const productIds = items.map((item: any) => item.product);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap: Record<string, (typeof products)[0]> = {};
    products.forEach((p: any) => {
      productMap[p.id] = p;
    });

    // Check stock
    for (const item of items) {
      const product = productMap[item.product];
      if (!product || (product.stock ?? 0) < item.quantity) {
        return res.status(400).json({ message: "Product out of stock" });
      }
    }

    const orderItems = items.map((item: any) => {
      const dbProduct = productMap[item.product];
      if (!dbProduct) throw new Error(`Product ${item.product} not found`);
      return {
        productId: dbProduct.id,
        name: dbProduct.name,
        image: dbProduct.image,
        price: dbProduct.price,
        quantity: item.quantity,
        unit: dbProduct.unit,
      };
    });

    const subtotal = orderItems.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0,
    );
    const { deliveryFee, tax, total } = computeTotals(subtotal);

    const transactionUuid = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Store checkout snapshot — will be consumed when eSewa calls back
    await prisma.pendingPayment.create({
      data: {
        transactionUuid,
        userId: req.user!.id,
        items: orderItems,
        shippingAddress,
        paymentMethod: paymentMethod || "esewa",
        subtotal,
        deliveryFee,
        tax,
        total,
        expiresAt,
      },
    });

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const esewaData = buildEsewaPaymentData({
      amount: subtotal,
      taxAmount: tax,
      deliveryCharge: deliveryFee,
      serviceCharge: 0,
      totalAmount: total,
      transactionUuid,
      successUrl: `${clientUrl}/payment/esewa/success`,
      failureUrl: `${clientUrl}/payment/esewa/failure`,
    });

    return res.json({ esewaData });
  } catch (error: any) {
    console.error("eSewa initiate error:", error);
    return res
      .status(500)
      .json({ message: error.message || "Failed to initiate eSewa payment." });
  }
};

// ---------------------------------------------------------------------------
// Verify eSewa Payment & Create Order
// POST /api/orders/esewa/verify  (public — called from EsewaSuccess page)
// ---------------------------------------------------------------------------
export const verifyEsewaPayment = async (req: Request, res: Response) => {
  try {
    const { data } = req.body;
    if (!data) {
      return res
        .status(400)
        .json({ message: "Missing eSewa payment response data." });
    }

    // 1. Decode base64 eSewa response
    let decodedResponse: EsewaResponsePayload;
    try {
      decodedResponse = decodeEsewaResponse(data);
    } catch {
      return res
        .status(400)
        .json({ message: "Invalid eSewa response payload format." });
    }

    const {
      transaction_uuid,
      status,
      transaction_code,
      total_amount,
      product_code,
    } = decodedResponse;

    // 2. Verify HMAC-SHA256 signature
    if (!verifyEsewaResponseSignature(decodedResponse)) {
      return res.status(400).json({ message: "Invalid payment signature." });
    }

    // 3. Status check via eSewa API (best-effort)
    try {
      const statusCheckResult = await checkEsewaTransactionStatus({
        productCode: product_code,
        totalAmount: total_amount,
        transactionUuid: transaction_uuid,
      });

      if (statusCheckResult && statusCheckResult.status !== "COMPLETE") {
        return res.status(400).json({
          message: "Payment transaction is not marked as COMPLETE by eSewa.",
          status: statusCheckResult.status,
        });
      }
    } catch (err: any) {
      console.warn("eSewa status check API warning:", err.message);
    }

    if (status !== "COMPLETE") {
      return res.status(400).json({
        message: "Payment status is not complete.",
        status,
      });
    }

    // 4. Find the PendingPayment record
    const pending = await prisma.pendingPayment.findUnique({
      where: { transactionUuid: transaction_uuid },
    });

    if (!pending) {
      // Check if an Order already exists with this uuid (idempotent)
      const existingOrder = await prisma.order.findFirst({
        where: { transactionUuid: transaction_uuid },
      });
      if (existingOrder) {
        return res.json({
          success: true,
          message: "Order already verified and marked as paid.",
          orderId: existingOrder.id,
        });
      }
      return res
        .status(404)
        .json({ message: "Pending payment session not found or expired." });
    }

    // 5. Check expiry
    if (new Date() > pending.expiresAt) {
      await prisma.pendingPayment.delete({ where: { id: pending.id } });
      return res
        .status(400)
        .json({ message: "Payment session has expired. Please try again." });
    }

    // 6. Verify amount
    const receivedTotal = parseFloat(String(total_amount).replace(/,/g, ""));
    if (isNaN(receivedTotal) || Math.abs(receivedTotal - pending.total) > 0.05) {
      return res.status(400).json({
        message: `Payment amount mismatch. Expected ${pending.total}, received ${receivedTotal}.`,
      });
    }

    // 7. Create the Order — only now, after successful payment
    const orderItems = pending.items as any[];
    const order = await prisma.order.create({
      data: {
        userId: pending.userId,
        items: pending.items as any,
        shippingAddress: pending.shippingAddress as any,
        paymentMethod: pending.paymentMethod,
        paymentStatus: "PAID",
        transactionUuid: transaction_uuid,
        transactionCode: transaction_code,
        paidAt: new Date(),
        subtotal: pending.subtotal,
        deliveryFee: pending.deliveryFee,
        tax: pending.tax,
        total: pending.total,
        status: "Placed",
        isPaid: true,
        statusHistory: [
          {
            status: "Placed",
            note: `Payment completed via eSewa (Ref: ${transaction_code})`,
            timestamp: new Date(),
          },
        ],
      },
    });

    // 8. Decrement stock
    if (Array.isArray(orderItems)) {
      for (const item of orderItems) {
        if (item.productId) {
          await prisma.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }
    }

    // 9. Clean up PendingPayment
    await prisma.pendingPayment.delete({ where: { id: pending.id } });

    return res.json({
      success: true,
      message: "Payment verified and order created successfully!",
      orderId: order.id,
    });
  } catch (error: any) {
    console.error("eSewa verification error:", error);
    return res
      .status(500)
      .json({ message: error.message || "Payment verification failed." });
  }
};

// ---------------------------------------------------------------------------
// Get user's orders
// GET /api/orders
// ---------------------------------------------------------------------------
export const getUserOrders = async (req: Request, res: Response) => {
  const { status } = req.query;
  const where: any = { userId: req.user!.id };

  if (status && status !== "all") {
    where.status = status;
  }
  const orders = await prisma.order.findMany({
    where,
    include: { deliveryPartner: { select: { name: true, phone: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json({ orders });
};

// ---------------------------------------------------------------------------
// Get single order
// GET /api/orders/:id
// ---------------------------------------------------------------------------
export const getOrderById = async (req: Request, res: Response) => {
  const order = await prisma.order.findFirst({
    where: { id: req.params.id as string, userId: req.user!.id },
    include: {
      deliveryPartner: {
        select: { name: true, phone: true, avatar: true, vehicleType: true },
      },
    },
  });
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }
  res.json({ order });
};

// ---------------------------------------------------------------------------
// Update order status (Admin only)
// PUT /api/orders/:id/status
// ---------------------------------------------------------------------------
export const updateOrderStatus = async (req: Request, res: Response) => {
  const { status, note } = req.body;
  const order = await prisma.order.findUnique({
    where: { id: req.params.id as string },
  });
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  const history = (
    Array.isArray(order.statusHistory) ? order.statusHistory : []
  ) as any[];
  history.push({
    status,
    note: note || `Order ${status.toLowerCase()}`,
    timestamp: new Date(),
  });

  const updatedOrder = await prisma.order.update({
    where: { id: req.params.id as string },
    data: { status, statusHistory: history },
  });
  res.json({ order: updatedOrder });
};

// ---------------------------------------------------------------------------
// GET all orders (Admin only)
// GET /api/orders/all
// ---------------------------------------------------------------------------
export const getAllOrders = async (req: Request, res: Response) => {
  const orders = await prisma.order.findMany({
    include: {
      user: { select: { name: true, email: true } },
      deliveryPartner: { select: { name: true, phone: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json({ orders });
};

// ---------------------------------------------------------------------------
// GET Order Location
// GET /api/orders/:id/location
// ---------------------------------------------------------------------------
export const getOrderLocation = async (req: Request, res: Response) => {
  const order = await prisma.order.findFirst({
    where: { id: req.params.id as string, userId: req.user!.id },
    select: { liveLocation: true, status: true },
  });
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }
  res.json({ liveLocation: order.liveLocation, status: order.status });
};
