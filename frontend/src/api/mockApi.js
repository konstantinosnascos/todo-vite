const STORAGE_KEY = "todos";

function load() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

function save(todos) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function seedIfEmpty() {
    const todos = load();
    if (todos.length === 0) {
        save([
            {
                id: crypto.randomUUID(),
                text: "Demo: fungerar på GitHub Pages",
                completed: false,
                dueDate: null,
                description: "",
                checklist: [],
            },
            {
                id: crypto.randomUUID(),
                text: "CRUD sparas i localStorage",
                completed: true,
                dueDate: null,
                description: "",
                checklist: [],
            },
        ]);
    }
}

export function createMockApi() {
    seedIfEmpty();

    return {
        async getTodos() {
            return load();
        },

        async addTodo(todo) {
            const todos = load();
            const newTodo = {
                id: crypto.randomUUID(),
                completed: false,
                dueDate: null,
                description: "",
                checklist: [],
                ...todo,
            };
            todos.push(newTodo);
            save(todos);
            return newTodo;
        },

        async updateTodo(todo) {
            const todos = load();
            const index = todos.findIndex((t) => t.id === todo.id);
            if (index === -1) throw new Error("Todo not found");
            todos[index] = { ...todos[index], ...todo };
            save(todos);
            return todos[index];
        },

        async deleteTodo(id) {
            const todos = load();
            const next = todos.filter((t) => t.id !== id);
            save(next);
            return {};
        },
    };
}