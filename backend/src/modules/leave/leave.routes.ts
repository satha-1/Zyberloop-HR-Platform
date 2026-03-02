import { Router } from "express";
import { authenticate } from "../../middlewares/auth";
import {
  getLeaveRequests,
  getLeaveRequestById,
  createLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
  getLeaveTypes,
} from "./leave.controller";

export const leaveRouter = Router();

leaveRouter.use(authenticate);
leaveRouter.get("/types", getLeaveTypes);
leaveRouter.get("/requests", getLeaveRequests);
leaveRouter.get("/requests/:id", getLeaveRequestById);
leaveRouter.post("/requests", createLeaveRequest);
leaveRouter.post("/requests/:id/approve", approveLeaveRequest);
leaveRouter.post("/requests/:id/reject", rejectLeaveRequest);
