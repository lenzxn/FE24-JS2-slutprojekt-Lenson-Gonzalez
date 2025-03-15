export class Task {
    id;
    title;
    description;
    category;
    status;
    assigned;
    timestamp;
    constructor(id, title, description, category, status = "new", assigned = null, timestamp = Date.now()) {
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
    id;
    name;
    roles;
    constructor(id, name, roles) {
        this.id = id;
        this.name = name;
        this.roles = roles;
    }
}
