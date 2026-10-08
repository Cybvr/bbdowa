import { collection, getDocs, query, where } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";
import { TASK_COLLECTION, type Task } from "@/lib/creator-tasks";

/** Every task a person is on, whether they are the first assignee, one of several, or on an older single-assignee task. */
export async function readTasksAssignedTo(uid: string): Promise<Task[]> {
  const tasks = collection(firebaseDb, TASK_COLLECTION);
  const [first, shared] = await Promise.all([
    getDocs(query(tasks, where("assignedTo", "==", uid))),
    getDocs(query(tasks, where("assigneeUids", "array-contains", uid))),
  ]);
  const byId = new Map<string, Task>();
  for (const snapshot of [first, shared]) {
    for (const item of snapshot.docs) byId.set(item.id, { id: item.id, ...(item.data() as Omit<Task, "id">) });
  }
  return [...byId.values()];
}
