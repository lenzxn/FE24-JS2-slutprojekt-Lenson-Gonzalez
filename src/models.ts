export class Task {
  readonly id: string;
  title: string;
  description: string;
  category: "UX" | "Frontend" | "Backend";
  status: "new" | "in progress" | "done";
  assigned: { id: string; name: string } | null;
  readonly timestamp: number;

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

  getFormattedDate(): string {
    return new Date(this.timestamp).toLocaleString();
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
