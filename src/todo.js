let offlineQueue = [];
let todos = [];

const input = document.getElementById("todoInput");
const addBtn = document.getElementById("addBtn");
const list = document.getElementById("todoList");

export async function setupTodo() {
    loadOfflineQueue();

    try {
        await loadTodos();
    } catch (error) {
        console.error(error);
    }

    addBtn.addEventListener("click", handleAddClick);
    input.addEventListener("keydown", e => {
        if (e.key === "Enter") handleAddClick();
    });

    window.addEventListener("online", syncOfflineTodos);
}

async function handleAddClick() {
    const text = input.value;
    if (!text) return;

    await addTodo(text);
    input.value = "";
}

async function addTodo(text) {
    const newTodo = {
        text,
        completed: false,
        description: "",
        checklist: []
    };

    try {
        const response = await fetch("/todos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newTodo)
        });

        const savedTodo = await response.json();
        todos.push(savedTodo);

    } catch {
        const tempId = "temp-" + Date.now();
        const offlineTodo = { ...newTodo, id: tempId, offline: true };
        todos.push(offlineTodo);
        offlineQueue.push(newTodo);
        saveOfflineQueue();
    }

    render();
}

async function loadTodos() {
    try {
        const res = await fetch("/todos");
        todos = await res.json();
        localStorage.setItem("todos-cache", JSON.stringify(todos));
    } catch {
        const cached = localStorage.getItem("todos-cache");
        if (cached) {
            todos = JSON.parse(cached);
        } else {
            todos = [];
        }
    }
}

async function syncOfflineTodos() {
    const queue = [...offlineQueue];

    for (const todo of queue) {
        try {
            const res = await fetch("/todos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(todo)
            });

            const saved = await res.json();

            const index = todos.findIndex(t => t.offline && t.text === todo.text);
            if (index !== -1) {
                todos[index] = saved;
            }

            offlineQueue.shift();
        } catch {
            break;
        }
    }

    saveOfflineQueue();
    render();
}

function render() {
    list.innerHTML = "";

    todos.forEach((todo, index) => {
        const li = document.createElement("li");
        li.textContent = todo.text + (todo.offline ? " (Ej synkad)" : "");

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "X";
        deleteBtn.onclick = async () => {
            await fetch(`/todos/${todo.id}`, { method: "DELETE" });
            todos.splice(index, 1);
            render();
        };

        li.appendChild(deleteBtn);
        list.appendChild(li);
    });
}

function loadOfflineQueue() {
    const saved = localStorage.getItem("offline-queue");
    if (saved) offlineQueue = JSON.parse(saved);
}

function saveOfflineQueue() {
    localStorage.setItem("offline-queue", JSON.stringify(offlineQueue));
}