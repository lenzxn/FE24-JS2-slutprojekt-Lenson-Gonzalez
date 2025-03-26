import { addTask, getTasks, updateTaskStatus, addMember, getMembers, deleteTask, } from "./firebase";
import { Task, Member } from "./models";
const addTaskBtn = document.getElementById("add-task-btn");
const taskTitle = document.getElementById("task-title");
const taskDesc = document.getElementById("task-desc");
const taskCategory = document.getElementById("task-category");
const taskAssigned = document.getElementById("task-assigned");
const newTasksList = document.querySelector("#new-tasks .task-list");
const inProgressTasksList = document.querySelector("#in-progress-tasks .task-list");
const doneTasksList = document.querySelector("#done-tasks .task-list");
const addMemberBtn = document.getElementById("add-member-btn");
const memberName = document.getElementById("member-name");
const memberRoles = document.querySelectorAll(".role-checkbox");
const applyFiltersBtn = document.getElementById("apply-filters");
const filterAndSortTasks = (tasks, members) => {
    const filterCategory = document.getElementById("filter-category")?.value ??
        "";
    const filterMember = document.getElementById("filter-member")?.value ??
        "";
    const sortTimestamp = document.getElementById("sort-timestamp")?.value ??
        "";
    const sortTitle = document.getElementById("sort-title")?.value ?? "";
    let result = [...tasks]; // clone the array
    // ✅ Filter by category
    if (filterCategory) {
        result = result.filter((task) => task.category === filterCategory);
    }
    // ✅ Filter by assigned member
    if (filterMember) {
        result = result.filter((task) => task.assigned && task.assigned.id === filterMember);
    }
    // ✅ Sort by title
    if (sortTitle === "az") {
        result.sort((a, b) => a.title.localeCompare(b.title));
    }
    else if (sortTitle === "za") {
        result.sort((a, b) => b.title.localeCompare(a.title));
    }
    // ✅ Sort by timestamp
    if (sortTimestamp === "newest") {
        result.sort((a, b) => b.timestamp - a.timestamp);
    }
    else if (sortTimestamp === "oldest") {
        result.sort((a, b) => a.timestamp - b.timestamp);
    }
    return result;
};
const updateMemberFilterDropdown = async () => {
    const tasks = await getTasks();
    const members = await getMembers();
    const filterMemberDropdown = document.getElementById("filter-member");
    if (!filterMemberDropdown)
        return;
    filterMemberDropdown.innerHTML = "<option value=''>All Members</option>";
    // get only members who have been assigned at least one task
    const assignedMemberIds = new Set(tasks
        .filter((task) => task.assigned !== null && typeof task.assigned === "object")
        .map((task) => task.assigned.id));
    members.forEach((member) => {
        if (assignedMemberIds.has(member.id)) {
            // Only add members who are assigned tasks
            const option = document.createElement("option");
            option.value = member.id;
            option.innerText = `${member.name}`;
            filterMemberDropdown.appendChild(option);
        }
    });
};
const displayTasks = async () => {
    const tasks = await getTasks();
    const members = await getMembers();
    await updateMemberFilterDropdown();
    const filterCategory = document.getElementById("filter-category")?.value;
    const filterMember = document.getElementById("filter-member")?.value;
    const sortTimestamp = document.getElementById("sort-timestamp")?.value;
    const sortTitle = document.getElementById("sort-title")
        ?.value;
    console.clear();
    console.log("Filters applied:", {
        category: filterCategory,
        member: filterMember,
        sortTimestamp,
        sortTitle,
    });
    const filteredTasks = filterAndSortTasks(tasks, members);
    const newTasksList = document.querySelector("#new-tasks .task-list");
    const inProgressTasksList = document.querySelector("#in-progress-tasks .task-list");
    const doneTasksList = document.querySelector("#done-tasks .task-list");
    newTasksList.innerHTML = "";
    inProgressTasksList.innerHTML = "";
    doneTasksList.innerHTML = "";
    if (filteredTasks.length === 0) {
        newTasksList.innerHTML = "<p>No matching tasks found.</p>";
        return;
    }
    filteredTasks.forEach((task) => {
        const taskElement = document.createElement("div");
        taskElement.classList.add("task");
        taskElement.setAttribute("data-id", task.id);
        let assignedText = "Not assigned";
        if (task.assigned && typeof task.assigned === "object") {
            assignedText = `${task.assigned.name} (${task.assigned.id})`;
        }
        taskElement.innerHTML = `
      <h3>${task.title}</h3>
      <p>${task.description}</p>
      <small>Category: ${task.category}</small><br>
      <small>Created: ${task.getFormattedDate()}</small>
      <p class="assigned-info">Assigned to: ${assignedText}</p>
    `;
        // Assign task button
        if (task.status === "new") {
            const assignButton = document.createElement("button");
            assignButton.textContent = "Assign Task";
            assignButton.classList.add("assign-task-btn");
            const memberSelect = document.createElement("select");
            memberSelect.classList.add("assign-dropdown");
            memberSelect.style.display = "none";
            memberSelect.innerHTML = "<option value=''>Select Member</option>";
            members
                .filter((member) => member.roles.includes(task.category))
                .forEach((member) => {
                const option = document.createElement("option");
                option.value = member.id;
                option.innerText = `${member.name} - ${member.roles.join(", ")}`;
                memberSelect.appendChild(option);
            });
            const confirmAssignButton = document.createElement("button");
            confirmAssignButton.textContent = "Confirm";
            confirmAssignButton.classList.add("confirm-assign-btn");
            confirmAssignButton.style.display = "none";
            assignButton.addEventListener("click", () => {
                memberSelect.style.display = "block";
                confirmAssignButton.style.display = "block";
            });
            confirmAssignButton.addEventListener("click", async () => {
                const selectedMemberId = memberSelect.value;
                if (selectedMemberId) {
                    try {
                        await updateTaskStatus(task.id, "in progress", selectedMemberId);
                        displayTasks();
                    }
                    catch (error) {
                        console.error("Error assigning task:", error);
                    }
                }
                memberSelect.style.display = "none";
                confirmAssignButton.style.display = "none";
            });
            taskElement.appendChild(assignButton);
            taskElement.appendChild(memberSelect);
            taskElement.appendChild(confirmAssignButton);
        }
        if (task.status === "in progress") {
            const doneButton = document.createElement("button");
            doneButton.textContent = "DONE";
            doneButton.classList.add("done-task-btn");
            doneButton.addEventListener("click", async () => {
                try {
                    await updateTaskStatus(task.id, "done");
                    displayTasks();
                }
                catch (error) {
                    console.error("error marking task as done:", error);
                }
            });
            taskElement.appendChild(doneButton);
        }
        if (task.status === "done") {
            const deleteButton = document.createElement("button");
            deleteButton.textContent = "DELETE";
            deleteButton.classList.add("delete-task-btn");
            deleteButton.addEventListener("click", async () => {
                try {
                    await deleteTask(task.id);
                    displayTasks();
                }
                catch (error) {
                    console.error("error deleting task:", error);
                }
            });
            taskElement.appendChild(deleteButton);
        }
        // Add task to correct column
        if (task.status === "new") {
            newTasksList.appendChild(taskElement);
        }
        else if (task.status === "in progress") {
            inProgressTasksList.appendChild(taskElement);
        }
        else if (task.status === "done") {
            doneTasksList.appendChild(taskElement);
        }
    });
};
// Add task to Firestore and dom
addTaskBtn.addEventListener("click", async () => {
    const title = taskTitle.value.trim();
    const description = taskDesc.value.trim();
    const category = taskCategory.value;
    if (title && description) {
        const newTask = new Task("", title, description, category, "new", null);
        try {
            await addTask(newTask);
            console.log("Task added successfully");
            taskTitle.value = "";
            taskDesc.value = "";
            displayTasks();
        }
        catch (error) {
            console.error("Error adding task:", error);
        }
    }
    else {
        console.log("Please fill in both the title and description");
    }
});
// function to show success emeber added popup
const showSuccessPopup = (message) => {
    const popup = document.getElementById("success-popup");
    if (popup) {
        popup.textContent = message;
        popup.classList.add("show");
        setTimeout(() => {
            popup.classList.remove("show");
        }, 2000);
    }
};
addMemberBtn.addEventListener("click", async () => {
    const name = memberName.value.trim();
    const roles = Array.from(memberRoles)
        .filter((checkbox) => checkbox.checked)
        .map((checkbox) => checkbox.value);
    if (name && roles.length > 0) {
        const newMember = new Member("", name, roles);
        try {
            await addMember(newMember);
            console.log("member added!");
            showSuccessPopup(`Member "${name}" added successfully!`);
            memberName.value = "";
        }
        catch (error) {
            console.error("cannot add member:", error);
        }
    }
    else {
    }
});
if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener("click", () => {
        applyFiltersBtn.style.cursor = "wait";
        setTimeout(() => {
            applyFiltersBtn.style.cursor = "pointer";
        }, 500);
        displayTasks();
    });
}
displayTasks();
