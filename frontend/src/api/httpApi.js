const BASE_URL = import.meta.env.VITE_API_URL || "";

async function safeFetch(url, options = {}) {
    let response;

    try {
        response = await fetch(BASE_URL + url, options);
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

export function createHttpApi() {
    return {
        async getTodos() {
            return await safeFetch("/todos");
        },

        async addTodo(todo) {
            return await safeFetch("/todos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(todo),
            });
        },

        async updateTodo(todo) {
            return await safeFetch("/todos/" + todo.id, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(todo),
            });
        },

        async deleteTodo(id) {
            return await safeFetch("/todos/" + id, {
                method: "DELETE",
            });
        },
    };
}