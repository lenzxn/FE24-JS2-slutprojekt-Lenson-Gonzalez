import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, getDoc, updateDoc, doc, deleteDoc, } from "firebase/firestore";
import { Task, Member } from "./models";
const firebaseConfig = {
    apiKey: "AIzaSyA08_ZHFhZz5lISI1hhykIF2I-C-u7ZkC4",
    authDomain: "scrum-board-lenzon.firebaseapp.com",
    projectId: "scrum-board-lenzon",
    storageBucket: "scrum-board-lenzon.firebasestorage.app",
    messagingSenderId: "491905511872",
    appId: "1:491905511872:web:1b3d4321198a3c0f619825",
};
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const deleteTask = async (taskId) => {
    try {
        const taskRef = doc(db, "assignments", taskId);
        await deleteDoc(taskRef);
        console.log(`Task ${taskId} deleted`);
    }
    catch (error) {
        console.error("Error deleting task:", error);
    }
};
export const addTask = async (task) => {
    try {
        const assignmentsRef = collection(db, "assignments");
        const docRef = await addDoc(assignmentsRef, {
            title: task.title,
            description: task.description,
            category: task.category,
            status: task.status,
            assigned: task.assigned || "",
            timestamp: task.timestamp || Date.now(),
        });
        console.log("Task added with ID:", docRef.id);
    }
    catch (error) {
        console.error("Error adding task:", error);
    }
};
export const getTasks = async () => {
    try {
        const assignmentsRef = collection(db, "assignments");
        const querySnapshot = await getDocs(assignmentsRef);
        return querySnapshot.docs.map((doc) => {
            const data = doc.data();
            // Se till att assigned är ett objekt eller null
            const assigned = data.assigned && typeof data.assigned === "object"
                ? {
                    id: data.assigned.id || "",
                    name: data.assigned.name || "",
                }
                : null;
            // Se till att timestamp är ett nummer
            const timestamp = typeof data.timestamp === "number" ? data.timestamp : Date.now();
            // Returnera en instans av Task-klassen
            return new Task(doc.id, data.title || "", data.description || "", data.category || "Frontend", data.status || "new", assigned, timestamp);
        });
    }
    catch (error) {
        console.error("❌ Error fetching tasks:", error);
        return [];
    }
};
export const updateTaskStatus = async (taskId, newStatus, assignedMemberId) => {
    try {
        const taskRef = doc(db, "assignments", taskId);
        // Create update object
        const updateData = {
            status: newStatus,
        };
        if (assignedMemberId) {
            const memberRef = doc(db, "members", assignedMemberId);
            const memberSnap = await getDoc(memberRef);
            if (memberSnap.exists()) {
                const memberData = memberSnap.data();
                updateData.assigned = { id: assignedMemberId, name: memberData.name };
            }
        }
        await updateDoc(taskRef, updateData);
        console.log(`Task ${taskId} updated to '${newStatus}'${assignedMemberId
            ? `and assigned to ${updateData.assigned?.name} (${assignedMemberId})`
            : ""}`);
    }
    catch (error) {
        console.error("Error updating task", error);
    }
};
export const addMember = async (member) => {
    try {
        const membersRef = collection(db, "members");
        const docRef = await addDoc(membersRef, {
            name: member.name,
            roles: member.roles,
        });
        console.log("Member added with ID:", docRef.id);
    }
    catch (error) {
        console.error("error adding member:", error);
    }
};
export const getMembers = async () => {
    try {
        const membersRef = collection(db, "members");
        const querySnapshot = await getDocs(membersRef);
        return querySnapshot.docs.map((doc) => {
            const data = doc.data();
            return new Member(doc.id, data.name, data.roles || []);
        });
    }
    catch (error) {
        console.error("Error fetching members", error);
        return [];
    }
};
