import {
  addTask,
  getTasks,
  updateTaskStatus,
  addMember,
  getMembers,
  deleteTask,
} from "./firebase";
import { Task, Member } from "./models";

// Form elements
const addTaskBtn = document.getElementById("add-task-btn") as HTMLButtonElement;
const taskTitle = document.getElementById("task-title") as HTMLInputElement;
const taskDesc = document.getElementById("task-desc") as HTMLTextAreaElement;
const taskCategory = document.getElementById(
  "task-category"
) as HTMLSelectElement;

const addMemberBtn = document.getElementById(
  "add-member-btn"
) as HTMLButtonElement;
const memberName = document.getElementById("member-name") as HTMLInputElement;
const memberRoles = document.querySelectorAll(
  ".role-checkbox"
) as NodeListOf<HTMLInputElement>;

// Filter elements
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

// Custom search UI
const assignedMemberDropdown = document.getElementById(
  "assigned-member-search"
) as HTMLSelectElement;
const assignedMemberSearchBtn = document.getElementById(
  "assigned-member-search-btn"
) as HTMLButtonElement;
const assignedMemberResetBtn = document.getElementById(
  "assigned-member-reset-btn"
) as HTMLButtonElement;
const assignedFilterCategory = document.getElementById(
  "assigned-filter-category"
) as HTMLSelectElement;
const assignedSortTimestamp = document.getElementById(
  "assigned-sort-timestamp"
) as HTMLSelectElement;
const assignedSortTitle = document.getElementById(
  "assigned-sort-title"
) as HTMLSelectElement;

// Columns
const newTasksList = document.querySelector(
  "#new-tasks .task-list"
) as HTMLElement;
const inProgressTasksList = document.querySelector(
  "#in-progress-tasks .task-list"
) as HTMLElement;
const doneTasksList = document.querySelector(
  "#done-tasks .task-list"
) as HTMLElement;

const filterAndSortTasks = (tasks: Task[], members: Member[]): Task[] => {
  let result = [...tasks];

  const categoryValue = filterCategory.value;
  const memberValue = filterMember.value;
  const timestampSort = sortTimestamp.value;
  const titleSort = sortTitle.value;

  if (categoryValue)
    result = result.filter((t) => t.category === categoryValue);
  if (memberValue)
    result = result.filter((t) => t.assigned?.id === memberValue);
  if (timestampSort === "newest")
    result.sort((a, b) => b.timestamp - a.timestamp);
  else if (timestampSort === "oldest")
    result.sort((a, b) => a.timestamp - b.timestamp);
  if (titleSort === "az") result.sort((a, b) => a.title.localeCompare(b.title));
  else if (titleSort === "za")
    result.sort((a, b) => b.title.localeCompare(a.title));

  return result;
};

const populateMemberDropdown = async () => {
  const tasks = await getTasks();
  const members = await getMembers();

  const assignedIds = new Set(
    tasks.filter((t) => t.assigned).map((t) => t.assigned!.id)
  );

  filterMember.innerHTML = "<option value=''>All Members</option>";
  assignedMemberDropdown.innerHTML = "<option value=''>Select Member</option>";

  members.forEach((member) => {
    if (assignedIds.has(member.id)) {
      const option1 = document.createElement("option");
      option1.value = member.id;
      option1.text = member.name;
      filterMember.appendChild(option1);

      const option2 = option1.cloneNode(true) as HTMLOptionElement;
      assignedMemberDropdown.appendChild(option2);
    }
  });
};

const renderTasks = (tasks: Task[], members: Member[]) => {
  newTasksList.innerHTML = "";
  inProgressTasksList.innerHTML = "";
  doneTasksList.innerHTML = "";

  if (tasks.length === 0) {
    newTasksList.innerHTML = "<p>No matching tasks found.</p>";
    return;
  }

  tasks.forEach((task) => {
    const el = document.createElement("div");
    el.classList.add("task");
    el.setAttribute("data-id", task.id);

    const assignedText = task.assigned
      ? `${task.assigned.name} (${task.assigned.id})`
      : "Not assigned";

    el.innerHTML = `
      <h3>${task.title}</h3>
      <p>${task.description}</p>
      <small>Category: ${task.category}</small><br>
      <small>Created: ${task.getFormattedDate()}</small>
      <p class="assigned-info">Assigned to: ${assignedText}</p>
    `;

    if (task.status === "new") {
      const assignBtn = document.createElement("button");
      assignBtn.textContent = "Assign Task";

      const select = document.createElement("select");
      select.style.display = "none";
      select.innerHTML = "<option value=''>Select Member</option>";

      members
        .filter((m) => m.roles.includes(task.category))
        .forEach((m) => {
          const opt = document.createElement("option");
          opt.value = m.id;
          opt.textContent = `${m.name} (${m.roles.join(", ")})`;
          select.appendChild(opt);
        });

      const confirmBtn = document.createElement("button");
      confirmBtn.textContent = "Confirm";
      confirmBtn.style.display = "none";

      assignBtn.addEventListener("click", () => {
        select.style.display = "block";
        confirmBtn.style.display = "block";
      });

      confirmBtn.addEventListener("click", async () => {
        const selected = select.value;
        if (selected) {
          await updateTaskStatus(task.id, "in progress", selected);
          await displayTasks();
        }
      });

      el.appendChild(assignBtn);
      el.appendChild(select);
      el.appendChild(confirmBtn);
    }

    if (task.status === "in progress") {
      const doneBtn = document.createElement("button");
      doneBtn.textContent = "DONE";
      doneBtn.addEventListener("click", async () => {
        await updateTaskStatus(task.id, "done");
        await displayTasks();
      });
      el.appendChild(doneBtn);
    }

    if (task.status === "done") {
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "DELETE";
      deleteBtn.addEventListener("click", async () => {
        await deleteTask(task.id);
        await displayTasks();
      });
      el.appendChild(deleteBtn);
    }

    if (task.status === "new") newTasksList.appendChild(el);
    else if (task.status === "in progress") inProgressTasksList.appendChild(el);
    else doneTasksList.appendChild(el);
  });
};

const displayTasks = async () => {
  const tasks = await getTasks();
  const members = await getMembers();
  const filtered = filterAndSortTasks(tasks, members);
  renderTasks(filtered, members);
  await populateMemberDropdown();
};

// Event Listeners
addTaskBtn.addEventListener("click", async () => {
  const title = taskTitle.value.trim();
  const desc = taskDesc.value.trim();
  const category = taskCategory.value as "UX" | "Frontend" | "Backend";

  if (title && desc) {
    await addTask(new Task("", title, desc, category, "new", null));
    taskTitle.value = "";
    taskDesc.value = "";
    await displayTasks();
  }
});

addMemberBtn.addEventListener("click", async () => {
  const name = memberName.value.trim();
  const roles = Array.from(memberRoles)
    .filter((cb) => cb.checked)
    .map((cb) => cb.value as "UX" | "Frontend" | "Backend");

  if (name && roles.length > 0) {
    await addMember(new Member("", name, roles));
    memberName.value = "";
    await displayTasks();
  }
});

applyFiltersBtn.addEventListener("click", () => displayTasks());
resetFiltersBtn.addEventListener("click", () => {
  filterCategory.value = "";
  filterMember.value = "";
  sortTimestamp.value = "newest";
  sortTitle.value = "az";
  displayTasks();
});

// Assigned Member Filter UI
assignedMemberSearchBtn.addEventListener("click", async () => {
  const selectedId = assignedMemberDropdown.value;
  const category = assignedFilterCategory.value;
  const time = assignedSortTimestamp.value;
  const title = assignedSortTitle.value;

  const tasks = await getTasks();
  const members = await getMembers();

  let filtered = tasks.filter((t) =>
    selectedId ? t.assigned?.id === selectedId : true
  );
  if (category) filtered = filtered.filter((t) => t.category === category);
  if (time === "newest") filtered.sort((a, b) => b.timestamp - a.timestamp);
  else if (time === "oldest")
    filtered.sort((a, b) => a.timestamp - b.timestamp);
  if (title === "az") filtered.sort((a, b) => a.title.localeCompare(b.title));
  else if (title === "za")
    filtered.sort((a, b) => b.title.localeCompare(a.title));

  renderTasks(filtered, members);
});

assignedMemberResetBtn.addEventListener("click", () => {
  assignedMemberDropdown.value = "";
  assignedFilterCategory.value = "";
  assignedSortTimestamp.value = "";
  assignedSortTitle.value = "";
  displayTasks();
});

// Initial load
(async () => {
  await displayTasks();
})();
