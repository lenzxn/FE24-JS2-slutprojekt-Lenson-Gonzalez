import { addTask, getTasks, updateTaskStatus, addMember, getMembers, deleteTask, } from "./firebase";
import { Task, Member } from "./models";
const addTaskBtn = document.getElementById("add-task-btn");
const taskTitle = document.getElementById("task-title");
const taskDesc = document.getElementById("task-desc");
const taskCategory = document.getElementById("task-category");
const newTasksList = document.querySelector("#new-tasks .task-list");
const inProgressTasksList = document.querySelector("#in-progress-tasks .task-list");
const doneTasksList = document.querySelector("#done-tasks .task-list");
const addMemberBtn = document.getElementById("add-member-btn");
const memberName = document.getElementById("member-name");
const memberRoles = document.querySelectorAll(".role-checkbox");
const filterCategory = document.getElementById("filter-category");
const filterMember = document.getElementById("filter-member");
const sortTimestamp = document.getElementById("sort-timestamp");
const sortTitle = document.getElementById("sort-title");
const applyFiltersBtn = document.getElementById("apply-filters");
const resetFiltersBtn = document.getElementById("reset-filters");
const assignedMemberDropdown = document.getElementById("assigned-member-search");
const assignedMemberSearchBtn = document.getElementById("assigned-member-search-btn");
const assignedMemberResetBtn = document.getElementById("assigned-member-reset-btn");
const assignedMemberTasksDiv = document.getElementById("assigned-member-tasks");
const filterAndSortTasks = (tasks, members) => {
    let result = [...tasks];
    const categoryValue = filterCategory.value;
    const memberValue = filterMember.value;
    const timestampSort = sortTimestamp.value;
    const titleSort = sortTitle.value;
    if (categoryValue) {
        result = result.filter((task) => task.category === categoryValue);
    }
    if (memberValue) {
        result = result.filter((task) => task.assigned && task.assigned.id === memberValue);
    }
    if (timestampSort === "newest") {
        result.sort((a, b) => b.timestamp - a.timestamp);
    }
    else if (timestampSort === "oldest") {
        result.sort((a, b) => a.timestamp - b.timestamp);
    }
    if (titleSort === "az") {
        result.sort((a, b) => a.title.localeCompare(b.title));
    }
    else if (titleSort === "za") {
        result.sort((a, b) => b.title.localeCompare(a.title));
    }
    return result;
};
const updateMemberFilterDropdown = async () => {
    const tasks = await getTasks();
    const members = await getMembers();
    const assignedMemberIds = new Set(tasks.filter((t) => t.assigned).map((t) => t.assigned.id));
    filterMember.innerHTML = "<option value=''>All Members</option>";
    members.forEach((member) => {
        if (assignedMemberIds.has(member.id)) {
            const option = document.createElement("option");
            option.value = member.id;
            option.innerText = member.name;
            filterMember.appendChild(option);
        }
    });
};
const displayTasks = async () => {
    const tasks = await getTasks();
    const members = await getMembers();
    await updateMemberFilterDropdown();
    const filtered = filterAndSortTasks(tasks, members);
    newTasksList.innerHTML = "";
    inProgressTasksList.innerHTML = "";
    doneTasksList.innerHTML = "";
    if (filtered.length === 0) {
        newTasksList.innerHTML = "<p>No matching tasks found.</p>";
        return;
    }
    filtered.forEach((task) => {
        const taskEl = document.createElement("div");
        taskEl.classList.add("task");
        taskEl.setAttribute("data-id", task.id);
        const assignedText = task.assigned
            ? `${task.assigned.name} (${task.assigned.id})`
            : "Not assigned";
        taskEl.innerHTML = `
      <h3>${task.title}</h3>
      <p>${task.description}</p>
      <small>Category: ${task.category}</small><br>
      <small>Created: ${task.getFormattedDate()}</small>
      <p class="assigned-info">Assigned to: ${assignedText}</p>
    `;
        // Assign button
        if (task.status === "new") {
            const assignBtn = document.createElement("button");
            assignBtn.textContent = "Assign Task";
            assignBtn.classList.add("assign-task-btn");
            const memberSelect = document.createElement("select");
            memberSelect.classList.add("assign-dropdown");
            memberSelect.style.display = "none";
            memberSelect.innerHTML = "<option value=''>Select Member</option>";
            members
                .filter((m) => m.roles.includes(task.category))
                .forEach((m) => {
                const option = document.createElement("option");
                option.value = m.id;
                option.innerText = `${m.name} - ${m.roles.join(", ")}`;
                memberSelect.appendChild(option);
            });
            const confirmBtn = document.createElement("button");
            confirmBtn.textContent = "Confirm";
            confirmBtn.classList.add("confirm-assign-btn");
            confirmBtn.style.display = "none";
            assignBtn.addEventListener("click", () => {
                memberSelect.style.display = "block";
                confirmBtn.style.display = "block";
            });
            confirmBtn.addEventListener("click", async () => {
                const selectedId = memberSelect.value;
                if (selectedId) {
                    await updateTaskStatus(task.id, "in progress", selectedId);
                    displayTasks();
                }
            });
            taskEl.appendChild(assignBtn);
            taskEl.appendChild(memberSelect);
            taskEl.appendChild(confirmBtn);
        }
        // Done button
        if (task.status === "in progress") {
            const doneBtn = document.createElement("button");
            doneBtn.textContent = "DONE";
            doneBtn.classList.add("done-task-btn");
            doneBtn.addEventListener("click", async () => {
                await updateTaskStatus(task.id, "done");
                displayTasks();
            });
            taskEl.appendChild(doneBtn);
        }
        // Delete button
        if (task.status === "done") {
            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "DELETE";
            deleteBtn.classList.add("delete-task-btn");
            deleteBtn.addEventListener("click", async () => {
                await deleteTask(task.id);
                displayTasks();
            });
            taskEl.appendChild(deleteBtn);
        }
        if (task.status === "new")
            newTasksList.appendChild(taskEl);
        else if (task.status === "in progress")
            inProgressTasksList.appendChild(taskEl);
        else if (task.status === "done")
            doneTasksList.appendChild(taskEl);
    });
};
// Add Task
addTaskBtn.addEventListener("click", async () => {
    const title = taskTitle.value.trim();
    const desc = taskDesc.value.trim();
    const category = taskCategory.value;
    if (title && desc) {
        const newTask = new Task("", title, desc, category, "new", null);
        await addTask(newTask);
        taskTitle.value = "";
        taskDesc.value = "";
        displayTasks();
    }
});
// Add Member
addMemberBtn.addEventListener("click", async () => {
    const name = memberName.value.trim();
    const roles = Array.from(memberRoles)
        .filter((cb) => cb.checked)
        .map((cb) => cb.value);
    if (name && roles.length > 0) {
        const newMember = new Member("", name, roles);
        await addMember(newMember);
        memberName.value = "";
        displayTasks();
    }
});
// Filter + Sort
applyFiltersBtn.addEventListener("click", () => {
    applyFiltersBtn.style.cursor = "wait";
    setTimeout(() => (applyFiltersBtn.style.cursor = "pointer"), 300);
    displayTasks();
});
// Reset
resetFiltersBtn.addEventListener("click", () => {
    filterCategory.value = "";
    filterMember.value = "";
    sortTimestamp.value = "newest";
    sortTitle.value = "az";
    displayTasks();
});
// Assigned Member Dropdown (Custom Search)
const populateAssignedMembersDropdown = async () => {
    const tasks = await getTasks();
    const members = await getMembers();
    assignedMemberDropdown.innerHTML = "<option value=''>Select Member</option>";
    const assignedIds = new Set(tasks.filter((t) => t.assigned).map((t) => t.assigned.id));
    members.forEach((member) => {
        if (assignedIds.has(member.id)) {
            const option = document.createElement("option");
            option.value = member.id;
            option.textContent = member.name;
            assignedMemberDropdown.appendChild(option);
        }
    });
};
assignedMemberSearchBtn.addEventListener("click", async () => {
    const selectedId = assignedMemberDropdown.value;
    const tasks = await getTasks();
    const filtered = tasks.filter((t) => t.assigned?.id === selectedId);
    newTasksList.innerHTML = "";
    inProgressTasksList.innerHTML = "";
    doneTasksList.innerHTML = "";
    if (filtered.length === 0) {
        newTasksList.innerHTML = "<p>No tasks found for this member.</p>";
        return;
    }
    filtered.forEach((task) => {
        const taskEl = document.createElement("div");
        taskEl.classList.add("task");
        const assignedText = task.assigned
            ? `${task.assigned.name} (${task.assigned.id})`
            : "Not assigned";
        taskEl.innerHTML = `
      <h3>${task.title}</h3>
      <p>${task.description}</p>
      <small>${task.category}</small><br>
      <p>Assigned to: ${assignedText}</p>
    `;
        if (task.status === "new")
            newTasksList.appendChild(taskEl);
        else if (task.status === "in progress")
            inProgressTasksList.appendChild(taskEl);
        else if (task.status === "done")
            doneTasksList.appendChild(taskEl);
    });
});
assignedMemberResetBtn.addEventListener("click", () => {
    assignedMemberDropdown.value = "";
    displayTasks();
});
// Load everything on start
(async () => {
    await displayTasks();
    await populateAssignedMembersDropdown();
})();
