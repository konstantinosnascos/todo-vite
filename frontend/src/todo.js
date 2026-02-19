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

// Pagination variabler
let page = 0;
const PAGE_SIZE = 20;
let allTodosLoaded = false;

let input, addBtn, list;

function initDomElements() {
    input = document.getElementById("todoInput");
    addBtn = document.getElementById("addBtn");
    list = document.getElementById("todoList");
}

let checklistModule = null;

export async function setupTodo() {
    initDomElements();

    loadOfflineQueue();

    displayUsernameSimple();

    try {
        isLoading = true;
        errorMessage = "";
        render();

        await loadTodos();
        syncOfflineTodos();
    } catch (error) {
        const type = classifyError(error);

        if (type === "OFFLINE") {
            errorMessage = "Du är offline. Visar sparad data.";
        } else if (type === "SERVER") {
            errorMessage = "Servern svarar inte just nu.";
        } else {
            errorMessage = "Ett oväntat fel inträffade.";
        }
    } finally {
        isLoading = false;
        render();
    }

    // IntersectionObserver for lazy loading
    const observer = new IntersectionObserver(
        (entries) => {
            if (entries[0].isIntersecting) {
                loadMoreTodos();
            }
        }
    );

    const trigger = document.querySelector("#load-trigger");
    if (trigger) {
        observer.observe(trigger);
    }

    addBtn.addEventListener("click", handleAddClick);
    input.addEventListener("keydown", handleEnterKey);
    window.addEventListener("online", syncOfflineTodos);
    window.addEventListener("offline", updateOnlineStatus);
    window.addEventListener("online", updateOnlineStatus);
    updateOnlineStatus();

    //Statistik-knapp
    const statsBtn = document.getElementById("statsBtn");
    if (statsBtn) {
        statsBtn.addEventListener("click", async function() {
            statsBtn.textContent = "Laddar...";
            statsBtn.disabled = true;

            try {
                const { initStats } = await import("./statsView.js");
                initStats(todos);
            } catch (error) {
                console.error("Kunde inte ladda statistik:", error);
                alert("Kunde inte ladda statistikmodulen.");
            } finally {
                statsBtn.textContent = "Statistik";
                statsBtn.disabled = false;
            }
        });
    }

    const settingsBtn = document.getElementById("settingsBtn");
    if (settingsBtn) {
        settingsBtn.addEventListener("click", async function () {
            settingsBtn.textContent = "Laddar...";
            settingsBtn.disabled = true;

            try {
                const { initSettings } = await import("./settingsView.js");
                initSettings();
            } catch (error) {
                console.error("Kunde inte ladda installningar:", error);
                alert("Kunde inte ladda installningsmodulen.");
            } finally {
                settingsBtn.textContent = "Installningar";
                settingsBtn.disabled = false;
            }
        });
    }
}

function displayUsernameSimple() {
    const display = document.getElementById("usernameDisplay");
    const cookies = document.cookie.split("; ");
    let username = null;

    for (const cookie of cookies) {
        const parts = cookie.split("=");
        if (parts[0] === "username") {
            username = parts[1];
            break;
        }
    }

    if (username && display) {
        display.textContent = "Inloggad som: " + username;
    }
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

function classifyError(error) {
    if (!error || !error.message) {
        return "UNKNOWN";
    }

    if (error.message === "NETWORK_ERROR") {
        return "OFFLINE";
    }

    if (error.message.startsWith("HTTP_ERROR_")) {
        return "SERVER";
    }

    if (error.message === "INVALID_JSON") {
        return "DATA";
    }

    if (error.message === "SW_FALLBACK") {
        return "OFFLINE";
    }

    return "UNKNOWN";
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

function updateOfflineTodoStatus(tempId, status, retries) {
    const todo = todos.find(t => t.id === tempId);
    if (!todo) return;

    todo.syncStatus = status;
    todo.retries = retries;
}

function queueOfflineTodo(todo) {
    const tempId = "temp-" + Date.now();

    const offlineTodo = {
        ...todo,
        id: tempId,
        offline: true,
        syncStatus: "pending",
        retries: 0
    };

    addTodoToState(offlineTodo);

    offlineQueue.push({
        id: tempId,
        payload: JSON.parse(JSON.stringify(todo)),
        retries: 0
    });

    saveOfflineQueue();
}

async function addTodo(text) {
    const todo = createTodoObject(text);

    try {
        const savedTodo = await postTodoToApi(todo);
        addTodoToState(savedTodo);
    } catch (error) {
        console.log("Offline - sparar i ko");
        queueOfflineTodo(todo);
    }

    document.getElementById("dueDateInput").value = "";
    resetAndRender();
}

function createTodoElement(todo) {
    const li = document.createElement("li");

    // Checkbox
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.completed;

    checkbox.addEventListener("change", async function () {
        todo.completed = checkbox.checked;
        try {
            await updateTodo(todo);
        } catch (error) {
            console.error("Fel vid uppdatering:", error);
        }
        resetAndRender();
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

        const saveBtn = document.createElement("button");
        saveBtn.textContent = "Spara";
        saveBtn.addEventListener("click", async function () {
            todo.text = editInput.value;
            todo.dueDate = editDateInput.value || null;
            todo.isEditing = false;
            try {
                await updateTodo(todo);
            } catch (error) {
                console.error("Fel vid uppdatering:", error);
            }
            resetAndRender();
        });

        const cancelBtn = document.createElement("button");
        cancelBtn.textContent = "Avbryt";
        cancelBtn.addEventListener("click", function () {
            todo.isEditing = false;
            resetAndRender();
        });

        editInput.addEventListener("keydown", function (event) {
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
        const span = document.createElement("span");
        span.style.cursor = "pointer";

        let displayText = todo.text;

        if (todo.dueDate) {
            const date = new Date(todo.dueDate);
            const formatted = date.toLocaleString("sv-SE");
            displayText = displayText + " (Ska goras: " + formatted + ")";
        }

        if (todo.offline) {
            let statusText = "Ej synkad";

            if (todo.syncStatus === "syncing") {
                statusText = "Synkar...";
            } else if (todo.syncStatus === "error") {
                statusText = "Misslyckades (" + todo.retries + "/3)";
            }

            span.textContent = displayText + " (" + statusText + ")";
            span.style.color = "orange";

            if (todo.syncStatus === "error") {
                const retryBtn = document.createElement("button");
                retryBtn.textContent = "Forsok igen";

                retryBtn.addEventListener("click", function () {
                    syncOfflineTodos();
                });

                li.appendChild(retryBtn);
            }
        } else {
            span.textContent = displayText;
        }

        if (todo.completed) {
            span.style.textDecoration = "line-through";
            span.style.color = "gray";
        }

        // Expanderbar detalj-sektion med DYNAMIC IMPORT för checklista
        const detailsDiv = document.createElement("div");
        detailsDiv.style.display = todo.expanded ? "block" : "none";
        detailsDiv.style.marginLeft = "20px";
        detailsDiv.style.marginTop = "5px";

        // Om expanderad: ladda checklistManager dynamiskt
        if (todo.expanded) {
            loadChecklistForTodo(todo, detailsDiv);
        }

        span.addEventListener("click", function () {
            todo.expanded = !todo.expanded;
            resetAndRender();
        });

        const editBtn = document.createElement("button");
        editBtn.textContent = "Edit";
        editBtn.addEventListener("click", function () {
            todo.isEditing = true;
            resetAndRender();
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "X";

        deleteBtn.addEventListener("click", async function () {
            try {
                await deleteTodo(todo.id);
            } catch (error) {
                console.error("Fel vid borttagning:", error);
            }
            resetAndRender();
        });

        li.appendChild(span);
        li.appendChild(editBtn);
        li.appendChild(deleteBtn);
        li.appendChild(detailsDiv);
    }

    return li;
}

async function loadChecklistForTodo(todo, detailsDiv) {
    try {
        if (!checklistModule) {
            checklistModule = await import("./checklistManager.js");
        }

        checklistModule.renderChecklist(
            todo,
            detailsDiv,
            updateTodo,
            resetAndRender
        );
    } catch (error) {
        console.error("Kunde inte ladda checklista modul: ", error);
        detailsDiv.textContent = "Kunde inte ladda detaljer.";
    }
}

function renderTodos(todosToRender) {
    todosToRender.forEach((todo) => {
        const li = createTodoElement(todo);
        list.appendChild(li);
    });
}

function loadMoreTodos() {
    if (allTodosLoaded) return;

    const start = page * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const slice = todos.slice(start, end);

    if (slice.length === 0) {
        allTodosLoaded = true;
        return;
    }

    renderTodos(slice);
    page++;
}

function resetAndRender() {
    page = 0;
    allTodosLoaded = false;
    list.innerHTML = "";
    loadMoreTodos();
}

function render() {
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

    page = 0;
    allTodosLoaded = false;
    loadMoreTodos();
}

async function syncSingleOfflineTodo(queueItem) {
    return await postTodoToApi(queueItem.payload);
}

function removeFromOfflineQueueById(id) {
    const index = offlineQueue.findIndex(item => item.id === id);
    if (index !== -1) {
        offlineQueue.splice(index, 1);
    }
}

function replaceOfflineTodoById(savedTodo, tempId) {
    const index = todos.findIndex(t => t.id === tempId);
    if (index !== -1) {
        todos[index] = savedTodo;
    }
}

async function syncOfflineTodos() {
    for (let i = 0; i < offlineQueue.length; i++) {
        const item = offlineQueue[i];

        try {
            updateOfflineTodoStatus(item.id, "syncing", item.retries);
            const savedTodo = await syncSingleOfflineTodo(item);
            replaceOfflineTodoById(savedTodo, item.id);
            savedTodo.syncStatus = "synced";

            offlineQueue.splice(i, 1);
            i--;
        } catch (error) {
            item.retries += 1;

            updateOfflineTodoStatus(
                item.id,
                "error",
                item.retries
            );

            if (item.retries >= 3) {
                console.error("Ger upp synk for:", item.payload.text);
            }
        }
    }

    saveOfflineQueue();
    saveTodosToCache(todos);
    resetAndRender();
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
    const data = await safeFetch("/todos");

    if (data && data.fallback) {
        throw new Error("SW_FALLBACK");
    }

    return data;
}

function loadTodosFromCache() {
    const cached = localStorage.getItem("todos-cache");
    if (!cached) {
        throw new Error("Ingen cache tillganglig");
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
        errorMessage = "";
    } catch (error) {
        const type = classifyError(error);

        if (type === "OFFLINE") {
            errorMessage = "Du ar offline. Visar sparad data.";
        } else if (type === "SERVER") {
            errorMessage = "Servern har problem. Visar sparad data.";
        } else {
            errorMessage = "Kunde inte ladda data.";
        }

        todos = loadTodosFromCache();
    }
}

async function putTodoToApi(todo) {
    return await safeFetch("/todos/" + todo.id, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(todo)
    });
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
    await safeFetch("/todos/" + id, {
        method: "DELETE"
    });
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


export function toggleTodo(todo) {
    return {
        ...todo,
        completed: !todo.completed,
    };
}

export function filterTodos(todos, mode) {
    if (mode === "done") {
        return todos.filter((t) => t.completed);
    }
    if (mode === "active") {
        return todos.filter((t) => !t.completed);
    }
    return todos;
}

export const _testExports = {
    classifyError, createTodoObject, safeFetch, filterTodos, toggleTodo, createTodoElement
};