import express from "express";
import auth from "../middleware/auth.js";
import admin from "../middleware/admin.js";
import { getAdminStats } from "../controllers/adminController.js";

const adminRouter = express.Router();

adminRouter.get("/", auth, admin, getAdminStats);

export default adminRouter;
