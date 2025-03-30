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

const assignedMemberDropdown = document.getElementById(
  "assigned-member-search"
) as HTMLSelectElement;
const categoryDropdown = document.getElementById(
  "assigned-filter-category"
) as HTMLSelectElement;
const timestampDropdown = document.getElementById(
  "assigned-sort-timestamp"
) as HTMLSelectElement;
const titleDropdown = document.getElementById(
  "assigned-sort-title"
) as HTMLSelectElement;
const searchBtn = document.getElementById(
  "assigned-member-search-btn"
) as HTMLButtonElement;
const resetBtn = document.getElementById(
  "assigned-member-reset-btn"
) as HTMLButtonElement;

// ✅ Populate dropdown with assigned members only
const populateAssignedMembersDropdown = async () => {
  const tasks = await getTasks();
  const members = await getMembers();

  const assignedIds = new Set(
    tasks.filter((task) => task.assigned).map((task) => task.assigned!.id)
  );

  assignedMemberDropdown.innerHTML =
    "<option value=''>-- Select Member --</option>";

  members.forEach((member) => {
    if (assignedIds.has(member.id)) {
      const option = document.createElement("option");
      option.value = member.id;
      option.textContent = member.name;
      assignedMemberDropdown.appendChild(option);
    }
  });
};

// ✅ Display tasks (general & reusable)
const displayFilteredTasks = (tasks: Task[]) => {
  newTasksList.innerHTML = "";
  inProgressTasksList.innerHTML = "";
  doneTasksList.innerHTML = "";

  if (tasks.length === 0) {
    newTasksList.innerHTML = "<p>No matching tasks found.</p>";
    return;
  }

  tasks.forEach((task) => {
    const taskEl = document.createElement("div");
    taskEl.classList.add("task");

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

    if (task.status === "new") newTasksList.appendChild(taskEl);
    else if (task.status === "in progress")
      inProgressTasksList.appendChild(taskEl);
    else if (task.status === "done") doneTasksList.appendChild(taskEl);
  });
};

// ✅ Full Task Display + Dropdown Update
const displayTasks = async () => {
  const tasks = await getTasks();
  displayFilteredTasks(tasks);
};

// ✅ Search logic
searchBtn.addEventListener("click", async () => {
  const tasks = await getTasks();

  const selectedMemberId = assignedMemberDropdown.value;
  const selectedCategory = categoryDropdown.value;
  const selectedTimestamp = timestampDropdown.value;
  const selectedTitle = titleDropdown.value;

  let filtered = tasks;

  if (selectedMemberId) {
    filtered = filtered.filter(
      (task) => task.assigned?.id === selectedMemberId
    );
  }

  if (selectedCategory) {
    filtered = filtered.filter((task) => task.category === selectedCategory);
  }

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

  displayFilteredTasks(filtered);
});

// ✅ Reset logic
resetBtn.addEventListener("click", () => {
  assignedMemberDropdown.value = "";
  categoryDropdown.value = "";
  timestampDropdown.value = "";
  titleDropdown.value = "";
  displayTasks();
});

// ✅ Add Task
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
    populateAssignedMembersDropdown();
  }
});

// ✅ Add Member
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
    populateAssignedMembersDropdown();
  }
});

// ✅ Init on load
(async () => {
  await displayTasks();
  await populateAssignedMembersDropdown();
})();
