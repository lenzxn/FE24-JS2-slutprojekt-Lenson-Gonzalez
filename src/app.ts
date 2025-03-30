import {
  addTask,
  getTasks,
  updateTaskStatus,
  addMember,
  getMembers,
  deleteTask,
} from "./firebase";
import { Task, Member } from "./models";

const addTaskBtn = document.getElementById("add-task-btn") as HTMLButtonElement;
const taskTitle = document.getElementById("task-title") as HTMLInputElement;
const taskDesc = document.getElementById("task-desc") as HTMLTextAreaElement;
const taskCategory = document.getElementById(
  "task-category"
) as HTMLSelectElement;

const newTasksList = document.querySelector(
  "#new-tasks .task-list"
) as HTMLElement;
const inProgressTasksList = document.querySelector(
  "#in-progress-tasks .task-list"
) as HTMLElement;
const doneTasksList = document.querySelector(
  "#done-tasks .task-list"
) as HTMLElement;

const addMemberBtn = document.getElementById(
  "add-member-btn"
) as HTMLButtonElement;
const memberName = document.getElementById("member-name") as HTMLInputElement;
const memberRoles = document.querySelectorAll(
  ".role-checkbox"
) as NodeListOf<HTMLInputElement>;

const filterCategory = document.getElementById(
  "filter-category"
) as HTMLSelectElement;
const filterMember = document.getElementById(
  "filter-member"
) as HTMLSelectElement;
const sortTimestamp = document.getElementById(
  "sort-timestamp"
) as HTMLSelectElement;
const sortTitle = document.getElementById("sort-title") as HTMLSelectElement;
const applyFiltersBtn = document.getElementById(
  "apply-filters"
) as HTMLButtonElement;
const resetFiltersBtn = document.getElementById(
  "reset-filters"
) as HTMLButtonElement;

const assignedMemberDropdown = document.getElementById(
  "assigned-member-search"
) as HTMLSelectElement;
const assignedMemberSearchBtn = document.getElementById(
  "assigned-member-search-btn"
) as HTMLButtonElement;
const assignedMemberResetBtn = document.getElementById(
  "assigned-member-reset-btn"
) as HTMLButtonElement;
const assignedMemberTasksDiv = document.getElementById(
  "assigned-member-tasks"
) as HTMLElement;

const filterAndSortTasks = (tasks: Task[], members: Member[]): Task[] => {
  let result = [...tasks];

  const categoryValue = filterCategory.value;
  const memberValue = filterMember.value;
  const timestampSort = sortTimestamp.value;
  const titleSort = sortTitle.value;

  if (categoryValue) {
    result = result.filter((task) => task.category === categoryValue);
  }

  if (memberValue) {
    result = result.filter(
      (task) => task.assigned && task.assigned.id === memberValue
    );
  }

  if (timestampSort === "newest") {
    result.sort((a, b) => b.timestamp - a.timestamp);
  } else if (timestampSort === "oldest") {
    result.sort((a, b) => a.timestamp - b.timestamp);
  }

  if (titleSort === "az") {
    result.sort((a, b) => a.title.localeCompare(b.title));
  } else if (titleSort === "za") {
    result.sort((a, b) => b.title.localeCompare(a.title));
  }

  return result;
};

const updateMemberFilterDropdown = async () => {
  const tasks = await getTasks();
  const members = await getMembers();

  const assignedMemberIds = new Set(
    tasks.filter((t) => t.assigned).map((t) => t.assigned!.id)
  );

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

    if (task.status === "new") newTasksList.appendChild(taskEl);
    else if (task.status === "in progress")
      inProgressTasksList.appendChild(taskEl);
    else if (task.status === "done") doneTasksList.appendChild(taskEl);
  });
};

// Add Task
addTaskBtn.addEventListener("click", async () => {
  const title = taskTitle.value.trim();
  const desc = taskDesc.value.trim();
  const category = taskCategory.value as "UX" | "Frontend" | "Backend";

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
    .map((cb) => cb.value as "UX" | "Frontend" | "Backend");

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

  const assignedIds = new Set(
    tasks.filter((t) => t.assigned).map((t) => t.assigned!.id)
  );

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
  const selectedCategory = (
    document.getElementById("assigned-filter-category") as HTMLSelectElement
  ).value;
  const selectedTimestamp = (
    document.getElementById("assigned-sort-timestamp") as HTMLSelectElement
  ).value;
  const selectedTitle = (
    document.getElementById("assigned-sort-title") as HTMLSelectElement
  ).value;

  const tasks = await getTasks();

  let filtered = tasks.filter((task) => {
    const matchMember = selectedId ? task.assigned?.id === selectedId : true;
    const matchCategory = selectedCategory
      ? task.category === selectedCategory
      : true;
    return matchMember && matchCategory;
  });

  // Sort logic
  if (selectedTimestamp === "newest") {
    filtered.sort((a, b) => b.timestamp - a.timestamp);
  } else if (selectedTimestamp === "oldest") {
    filtered.sort((a, b) => a.timestamp - b.timestamp);
  }

  if (selectedTitle === "az") {
    filtered.sort((a, b) => a.title.localeCompare(b.title));
  } else if (selectedTitle === "za") {
    filtered.sort((a, b) => b.title.localeCompare(a.title));
  }

  // Clear previous
  newTasksList.innerHTML = "";
  inProgressTasksList.innerHTML = "";
  doneTasksList.innerHTML = "";

  if (filtered.length === 0) {
    newTasksList.innerHTML = "<p>No matching tasks found.</p>";
    return;
  }

  filtered.forEach((task) => {
    const taskElement = document.createElement("div");
    taskElement.classList.add("task");

    const assignedText = task.assigned
      ? `${task.assigned.name} (${task.assigned.id})`
      : "Not assigned";

    taskElement.innerHTML = `
      <h3>${task.title}</h3>
      <p>${task.description}</p>
      <small>Category: ${task.category}</small><br>
      <small>Created: ${task.getFormattedDate()}</small>
      <p class="assigned-info">Assigned to: ${assignedText}</p>
    `;

    if (task.status === "new") newTasksList.appendChild(taskElement);
    else if (task.status === "in progress")
      inProgressTasksList.appendChild(taskElement);
    else if (task.status === "done") doneTasksList.appendChild(taskElement);
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
