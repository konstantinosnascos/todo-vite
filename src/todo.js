//todo.js

let offlineQueue = [];


function delay(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

let isLoading = false;
let errorMessage = "";


let todos = [];

const input = document.getElementById("todoInput");
const addBtn = document.getElementById("addBtn");
const list = document.getElementById("todoList");

export async function setupTodo() {
    loadOfflineQueue();

    try {
        isLoading = true;
        errorMessage = "";
        render();

        await loadTodos();
    } catch (error) {
        errorMessage = error.message;
    } finally {
        isLoading = false;
        render();
    }

    addBtn.addEventListener("click", handleAddClick);
    input.addEventListener("keydown", handleEnterKey);
    window.addEventListener("online", syncOfflineTodos);
    window.addEventListener("offline", updateOnlineStatus);
    window.addEventListener("online", updateOnlineStatus);
    updateOnlineStatus();
}

function handleEnterKey(event) {
    if (event.key === "Enter") {
        handleAddClick();
    }
}

async function handleAddClick() {
    const text = input.value;
    if (text === "") return;

    try {
        await addTodo(text);
        input.value = "";
    } catch (error) {
        console.error("Fel vid skapande:", error);
    }
}

async function safeFetch(url, options = {}) {
    let response;

    try {
        response = await fetch(url, options);
    } catch (error) {
        throw new Error("NETWORK_ERROR");
    }

    if (!response.ok) {
        throw new Error("HTTP_ERROR_" + response.status);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        throw new Error("INVALID_JSON");
    }

    try {
        return await response.json();
    } catch {
        throw new Error("INVALID_JSON");
    }
}

function createTodoObject(text) {
    const dueDateInput = document.getElementById("dueDateInput");

    return {
        text,
        completed: false,
        dueDate: dueDateInput.value || null,
        description: "",
        checklist: []
    };
}

async function postTodoToApi(todo) {
    return await safeFetch("/todos", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(todo)
    });
}

function addTodoToState(todo) {
    todos.push(todo);
}

function queueOfflineTodo(todo) {
    const tempId = "temp-" + Date.now();
    const offlineTodo = { ...todo, id: tempId, offline: true };

    addTodoToState(offlineTodo);
    offlineQueue.push(todo);
    saveOfflineQueue();
}

async function addTodo(text) {
    const todo = createTodoObject(text);

    try {
        const savedTodo = await postTodoToApi(todo);
        addTodoToState(savedTodo);
    } catch (error) {
        console.log("Offline - sparar i kö");
        queueOfflineTodo(todo);
    }

    document.getElementById("dueDateInput").value = "";
    render();
}

function render () {
    list.innerHTML = "";

    if (isLoading) {
        const li = document.createElement("li");
        li.textContent = "Laddar todos...";
        list.appendChild(li);
        return;
    }

    if (errorMessage) {
        const li = document.createElement("li");
        li.textContent = "X " + errorMessage;
        li.style.color = "red";
        list.appendChild(li);
        return;
    }

    todos.forEach((todo, index) => {
        const li = document.createElement("li");

        //checkbox
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = todo.completed;

        checkbox.addEventListener("change", async function() {
            todo.completed = checkbox.checked;
            try {
                await updateTodo(todo);
            } catch (error) {
                console.error("Fel vid uppdatering:", error);
            }
            render();
        });

        li.appendChild(checkbox);

        if (todo.isEditing) {
            const editInput = document.createElement("input");
            editInput.type = "text";
            editInput.value = todo.text;

            const editDateInput = document.createElement("input");
            editDateInput.type = "datetime-local";
            if (todo.dueDate) {
                editDateInput.value = todo.dueDate.slice(0, 16);
            }

            //Spara-knapp
            const saveBtn = document.createElement("button");
            saveBtn.textContent = "Spara";
            saveBtn.addEventListener("click", async function() {
                todo.text = editInput.value;
                todo.dueDate = editDateInput.value || null;
                todo.isEditing = false;
                try {
                    await updateTodo(todo);
                } catch (error) {
                    console.error("Fel vid uppdatering:", error);
                }
                render();
            });

            //cancelBtn
            const cancelBtn = document.createElement("button");
            cancelBtn.textContent = "Avbryt";
            cancelBtn.addEventListener("click", function() {
            todo.isEditing = false;
            render();
        });

            //Enter sparar
            editInput.addEventListener("keydown", function(event) {
                if (event.key === "Enter") {
                    saveBtn.click();
                }
                if (event.key === "Escape") {
                    cancelBtn.click();
                }
            });

            li.appendChild(editInput);
            li.appendChild(editDateInput);
            li.appendChild(saveBtn);
            li.appendChild(cancelBtn);
        } else {

            //text
            const span = document.createElement("span");
            span.style.cursor = "pointer";

            let displayText = todo.text;

            if (todo.dueDate) {
                const date = new Date(todo.dueDate);
                const formatted = date.toLocaleString("sv-SE");
                displayText = displayText + " (Ska göras: " + formatted + ")";
            }

            if (todo.offline) {
                span.textContent = displayText + " (Ej synkad)";
                span.style.color = "orange";
            } else {
                span.textContent = displayText;
            }

            if (todo.completed) {
                span.style.textDecoration = "line-through";
                span.style.color = "gray";
            }

            // Expanderbar beskrivning
            const detailsDiv = document.createElement("div");
            detailsDiv.style.display = todo.expanded ? "block" : "none";
            detailsDiv.style.marginLeft = "20px";
            detailsDiv.style.marginTop = "5px";

            const descriptionLabel = document.createElement("label");
            descriptionLabel.textContent = "Beskrivning: ";

            const descriptionInput = document.createElement("textarea");
            descriptionInput.value = todo.description || "";
            descriptionInput.rows = 3;
            descriptionInput.style.width = "200px";

            descriptionInput.addEventListener("change", async function() {
                todo.description = descriptionInput.value;
                try {
                    await updateTodo(todo);
                } catch (error) {
                    console.error("Fel vid uppdatering:", error);
                }
            });

            detailsDiv.appendChild(descriptionLabel);
            detailsDiv.appendChild(descriptionInput);

// Checklista
            const checklistDiv = document.createElement("div");
            checklistDiv.style.marginTop = "10px";

            const checklistLabel = document.createElement("strong");
            checklistLabel.textContent = "Checklista:";
            checklistDiv.appendChild(checklistLabel);

            const checklistUl = document.createElement("ul");
            checklistUl.style.listStyle = "none";
            checklistUl.style.paddingLeft = "0";

            if (!todo.checklist) {
                todo.checklist = [];
            }

            todo.checklist.forEach(function(item, itemIndex) {
                const itemLi = document.createElement("li");

                const itemCheckbox = document.createElement("input");
                itemCheckbox.type = "checkbox";
                itemCheckbox.checked = item.done;

                itemCheckbox.addEventListener("change", async function() {
                    todo.checklist[itemIndex].done = itemCheckbox.checked;
                    try {
                        await updateTodo(todo);
                    } catch (error) {
                        console.error("Fel vid uppdatering:", error);
                    }
                    render();
                });

                const itemText = document.createElement("span");
                itemText.textContent = item.text;
                if (item.done) {
                    itemText.style.textDecoration = "line-through";
                    itemText.style.color = "gray";
                }

                const removeItemBtn = document.createElement("button");
                removeItemBtn.textContent = "X";
                removeItemBtn.style.marginLeft = "5px";

                removeItemBtn.addEventListener("click", async function() {
                    todo.checklist.splice(itemIndex, 1);
                    try {
                        await updateTodo(todo);
                    } catch (error) {
                        console.error("Fel vid uppdatering:", error);
                    }
                    render();
                });

                itemLi.appendChild(itemCheckbox);
                itemLi.appendChild(itemText);
                itemLi.appendChild(removeItemBtn);
                checklistUl.appendChild(itemLi);
            });

            checklistDiv.appendChild(checklistUl);

// Lagg till ny punkt
            const newItemInput = document.createElement("input");
            newItemInput.type = "text";
            newItemInput.placeholder = "Ny punkt...";

            const addItemBtn = document.createElement("button");
            addItemBtn.textContent = "Lagg till";

            addItemBtn.addEventListener("click", async function() {
                if (newItemInput.value === "") return;

                todo.checklist.push({
                    text: newItemInput.value,
                    done: false
                });

                try {
                    await updateTodo(todo);
                } catch (error) {
                    console.error("Fel vid uppdatering:", error);
                }
                render();
            });

            newItemInput.addEventListener("keydown", function(event) {
                if (event.key === "Enter") {
                    addItemBtn.click();
                }
            });

            checklistDiv.appendChild(newItemInput);
            checklistDiv.appendChild(addItemBtn);

            detailsDiv.appendChild(checklistDiv);

            span.addEventListener("click", function() {
                todo.expanded = !todo.expanded;
                render();
            });

            //editBtn
            const editBtn = document.createElement("button");
            editBtn.textContent = "Edit";
            editBtn.addEventListener("click", function () {
                todo.isEditing = true;
                render();
            });

            //deleteBtn
            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "X";

            deleteBtn.addEventListener("click", async function () {
                try {
                    await deleteTodo(todo.id);
                } catch (error) {
                    console.error("Fel vid borttagning:", error);
                }
                render();
            })

            li.appendChild(span);
            li.appendChild(editBtn);
            li.appendChild(deleteBtn);
            li.appendChild(detailsDiv);
        }
        list.appendChild(li);
    });
}

async function syncSingleOfflineTodo(todoData) {
    const response = await fetch("/todos", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(todoData)
    });

    if (!response.ok) {
        throw new Error("Kunde inte synka todo");
    }

    return await response.json();
}

function removeFromOfflineQueue(todoData) {
    const index = offlineQueue.findIndex(t => t.text === todoData.text);
    if (index !== -1) {
        offlineQueue.splice(index, 1);
    }
}

function replaceOfflineTodo(savedTodo, originalTodo) {
    const index = todos.findIndex(
        t => t.offline && t.text === originalTodo.text
    );

    if (index !== -1) {
        todos[index] = savedTodo;
    }
}

async function syncOfflineTodos() {
    if (offlineQueue.length === 0) {
        return;
    }

    console.log("Synkar " + offlineQueue.length + " todos till backend");

    const todosToSync = [...offlineQueue];

    for (const todoData of todosToSync) {
        try {
            const savedTodo = await syncSingleOfflineTodo(todoData);
            removeFromOfflineQueue(todoData);
            replaceOfflineTodo(savedTodo, todoData);
        } catch (error) {
            console.log("Kunde inte synka: " + todoData.text);
        }
    }

    saveOfflineQueue();
    saveTodosToCache(todos);
    render();
}

function updateOnlineStatus() {
    const banner = document.getElementById("offlineBanner");
    if (navigator.onLine) {
        banner.style.display = "none";
    } else {
        banner.style.display = "block";
    }
}

function loadOfflineQueue() {
    const saved = localStorage.getItem("offline-queue");
    if (saved) {
        offlineQueue = JSON.parse(saved);
    }
}

function saveOfflineQueue() {
    localStorage.setItem("offline-queue", JSON.stringify(offlineQueue));
}

function saveTodos() {
    localStorage.setItem("todos", JSON.stringify(todos));
}

async function fetchTodosFromApi() {
    return await safeFetch("/todos");
}

function loadTodosFromCache() {
    const cached = localStorage.getItem("todos-cache");
    if (!cached) {
        throw new Error("Ingen cache tillgänglig");
    }

    return JSON.parse(cached);
}

function saveTodosToCache(todos) {
    localStorage.setItem("todos-cache", JSON.stringify(todos));
}

async function loadTodos() {
    try {
        todos = await fetchTodosFromApi();
        saveTodosToCache(todos);
    } catch (error) {
        console.log("Kunde inte nå servern, använder cache");
        todos = loadTodosFromCache();
    }
}

async function putTodoToApi(todo) {
    const response = await fetch(`/todos/${todo.id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(todo)
    });

    if (!response.ok) {
        throw new Error("Kunde inte uppdatera todo");
    }

    return await response.json();
}

function updateTodoInState(updatedTodo) {
    const index = todos.findIndex(t => t.id === updatedTodo.id);
    if (index !== -1) {
        todos[index] = updatedTodo;
    }
}

async function updateTodo(todo) {
    const updatedTodo = await putTodoToApi(todo);
    updateTodoInState(updatedTodo);
    return updatedTodo;
}

async function deleteTodoFromApi(id) {
    const response = await fetch(`/todos/${id}`, {
        method: "DELETE"
    });

    if (!response.ok) {
        throw new Error("Kunde inte ta bort todo");
    }
}

function removeTodoFromState(id) {
    const index = todos.findIndex(t => t.id === id);
    if (index !== -1) {
        todos.splice(index, 1);
    }
}

async function deleteTodo(id) {
    await deleteTodoFromApi(id);
    removeTodoFromState(id);
}

function setCookie(name, value, days) {
    const maxAge = days * 24 * 60 * 60;
    document.cookie = name + "=" + value + "; max-age=" + maxAge + "; path=/";
}

function getCookie(name) {
    const cookies = document.cookie.split("; ");
    for (const cookie of cookies) {
        const parts = cookie.split("=");
        if (parts[0] === name) {
            return parts[1];
        }
    }
    return null;
}

function displayUsername() {
    const username = getCookie("username");
    const display = document.getElementById("usernameDisplay");
    const input = document.getElementById("usernameInput");

    if (username) {
        display.textContent = "Inloggad som: " + username;
        input.style.display = "none";
        document.getElementById("saveUsernameBtn").style.display = "none";
    } else {
        display.textContent = "";
        input.style.display = "inline";
        document.getElementById("saveUsernameBtn").style.display = "inline";
    }
}

function saveUsername() {
    const input = document.getElementById("usernameInput");
    const username = input.value.trim();

    if (username === "") {
        return;
    }

    setCookie("username", username, 7);
    displayUsername();
}

document.getElementById("saveUsernameBtn").addEventListener("click", saveUsername);
displayUsername();

