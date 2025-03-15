export class Task {
  id: string;
  title: string;
  description: string;
  category: "UX" | "Frontend" | "Backend";
  status: "new" | "in progress" | "done";
  assigned: { id: string; name: string } | null;
  timestamp: number;

  constructor(
    id: string,
    title: string,
    description: string,
    category: "UX" | "Frontend" | "Backend",
    status: "new" | "in progress" | "done" = "new",
    assigned: { id: string; name: string } | null = null,
    timestamp: number = Date.now()
  ) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.category = category;
    this.status = status;
    this.assigned = assigned;
    this.timestamp = timestamp;
  }
}

export class Member {
  id: string;
  name: string;
  roles: ("UX" | "Frontend" | "Backend")[];

  constructor(
    id: string,
    name: string,
    roles: ("UX" | "Frontend" | "Backend")[]
  ) {
    this.id = id;
    this.name = name;
    this.roles = roles;
  }
}
