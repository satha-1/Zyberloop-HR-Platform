import { Task, ITask } from "./task.model";
import mongoose from "mongoose";

export interface CreateTaskParams {
  userId: string | mongoose.Types.ObjectId;
  title: string;
  description?: string;
  relatedEntityType: ITask["relatedEntityType"];
  relatedEntityId?: string | mongoose.Types.ObjectId | null;
  priority?: ITask["priority"];
  dueDate?: Date | null;
  assignedBy?: string | mongoose.Types.ObjectId;
}

export async function createTask(params: CreateTaskParams): Promise<ITask> {
  const task = new Task({
    userId: params.userId,
    assignedBy: params.assignedBy,
    title: params.title,
    description: params.description,
    relatedEntityType: params.relatedEntityType,
    relatedEntityId: params.relatedEntityId || null,
    priority: params.priority || "MEDIUM",
    dueDate: params.dueDate || null,
    status: "NEW",
  });

  return await task.save();
}
