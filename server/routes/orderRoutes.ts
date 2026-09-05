import express from "express";
import auth from "../middleware/auth.js";
import {
  createOrder,
  getAllOrders,
  getOrderById,
  getUserOrders,
  updateOrderStatus,
  initiateEsewaPayment,
  verifyEsewaPayment,
} from "../controllers/orderController.js";
import admin from "../middleware/admin.js";

const orderRouter = express.Router();

// COD orders
orderRouter.post("/", auth, createOrder);

// eSewa — initiate payment (returns form data, does NOT create an Order)
orderRouter.post("/esewa/initiate", auth, initiateEsewaPayment);

// eSewa — verify payment and create the Order
orderRouter.post("/esewa/verify", verifyEsewaPayment);

// Order retrieval
orderRouter.get("/", auth, getUserOrders);
orderRouter.get("/all", auth, admin, getAllOrders);
orderRouter.get("/:id", auth, getOrderById);
orderRouter.put("/:id/status", auth, admin, updateOrderStatus);

export default orderRouter;