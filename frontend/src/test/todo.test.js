//todo.test.js

import { describe, it, expect, beforeEach, vi } from "vitest";
import { _testExports} from "../todo.js";

const { classifyError, createTodoObject, safeFetch, toggleTodo, filterTodos, createTodoElement } = _testExports;

describe('classifyError', () => {
    it("should return 'Offline' when NETWORK_ERROR", () => {
        const error = new Error("NETWORK_ERROR");
        expect(classifyError(error)).toBe("OFFLINE");
    });

    it("should return 'SERVER' when HTTP_ERROR_500", () => {
        const error = new Error("HTTP_ERROR_500");
        expect(classifyError(error)).toBe("SERVER");
    });

    it("should return 'SERVER' when HTTP_ERROR_403", () => {
        const error = new Error("HTTP_ERROR_403");
        expect(classifyError(error)).toBe("SERVER");
    });

    it("should return 'DATA' when INVALID_JSON", () => {
        const error = new Error("INVALID_JSON");
        expect(classifyError(error)).toBe("DATA");
    });

    it("should return 'UNKNOWN' when unknown error occurs", () => {
        const error = new Error("something different");
        expect(classifyError(error)).toBe("UNKNOWN");
    });

    it("should return 'OFFLINE' when SW_FALLBACK", () => {
        const error = new Error("SW_FALLBACK");
        expect(classifyError(error)).toBe("OFFLINE");
    });
});

describe("createTodoObject", () => {

    beforeEach(() => {
        const input = document.createElement("input");
        input.id = "dueDateInput";
        input.value = "";
        document.body.appendChild(input);
    });

    it("should return a todo object with text and completed:false", () => {
        const todo = createTodoObject("Köp mat");

        expect(todo).toEqual({
            text: "Köp mat",
            completed: false,
            dueDate: null,
            description: "",
            checklist: []
        });
    });

    it("should set completed to false", () => {
        const todo = createTodoObject("Handla");
        expect(todo.completed).toBe(false);
    });

    it("should have empty description", () => {
        const todo = createTodoObject("Handla");
        expect(todo.description).toBe("");
    });

    it("should have empty checklist", () => {
        const todo = createTodoObject("Handla");
        expect(todo.checklist).toEqual([]);
    });

    it("should set dueDate to null when input is empty", () => {
        const todo = createTodoObject("Handla");
        expect(todo.dueDate).toBeNull();
    });

    it("should use dueDate from DOM input when set", () => {
        document.getElementById("dueDateInput").value = "2024-12-25T10:00";
        const todo = createTodoObject("Julklappar");
        expect(todo.dueDate).toBe("2024-12-25T10:00");
    });
});

describe("toggleTodo", () => {
    it("should return a new object (not same reference)", () => {
        const original = { text: "Test", completed: false };
        const toggled = toggleTodo(original);

        expect(toggled).not.toBe(original);
    });

    it("should not modify the original object", () => {
        const original = { text: "Test", completed: false };
        toggleTodo(original);

        expect(original.completed).toBe(false);
    });

    it("should toggle completed from false to true", () => {
        const todo = { text: "Test", completed: false };
        const result = toggleTodo(todo);

        expect(result.completed).toBe(true);
    });

    it("should toggle completed from true to false", () => {
        const todo = { text: "Test", completed: true };
        const result = toggleTodo(todo);

        expect(result.completed).toBe(false);
    });

    it("should keep all other properties", () => {
        const todo = {
            id: 1,
            text: "Test",
            completed: false,
            dueDate: "2024-12-25",
            description: "Info",
            checklist: [{ text: "Sub", done: true }]
        };
        const result = toggleTodo(todo);

        expect(result.id).toBe(1);
        expect(result.text).toBe("Test");
        expect(result.dueDate).toBe("2024-12-25");
        expect(result.description).toBe("Info");
        expect(result.checklist).toHaveLength(1);
    });
});

describe("filterTodos", () => {
    const todos = [
        { text: "Köp mat", completed: true },
        { text: "Städa", completed: false },
        { text: "Träna", completed: true },
        { text: "Laga mat", completed: false }
    ];

    it('should return only completed todos when mode is "done"', () => {
        const result = filterTodos(todos, "done");

        expect(result).toHaveLength(2);
        expect(result).toEqual([
            { text: "Köp mat", completed: true },
            { text: "Träna", completed: true }
        ]);
    });

    it('should return only active todos when mode is "active"', () => {
        const result = filterTodos(todos, "active");

        expect(result).toHaveLength(2);
        expect(result).toEqual([
            { text: "Städa", completed: false },
            { text: "Laga mat", completed: false }
        ]);
    });

    it("should return all todos when mode is unknown", () => {
        const result = filterTodos(todos, "something-else");

        expect(result).toHaveLength(4);
    });

    it("should return all todos when mode is undefined", () => {
        const result = filterTodos(todos);

        expect(result).toHaveLength(4);
    });

    it("should handle empty array", () => {
        const result = filterTodos([], "done");

        expect(result).toHaveLength(0);
    });
});


describe("createTodoElement", () => {

    it("should create a <li> element", () => {
        const todo = {text: "Köp mjölk", completed: false};
        const li = createTodoElement(todo);

        expect(li.tagName).toBe("LI");
    });

    it("should display the correct text", () => {
        const todo =  { text: "Städa köket", completed: false };
        const li = createTodoElement(todo);

        const span = li.querySelector("span");
        expect(span.textContent).toContain("Städa köket");
    });

    it("should have a checked checkbox when completed", () => {
        const todo = { text: "Träna", completed: true };
        const li = createTodoElement(todo);

        const checkbox = li.querySelector('input[type="checkbox"]');
        expect(checkbox.checked).toBe(true);
    });

    it("should have unchecked checkbox when not completed", () => {
        const todo = { text: "Träna", completed: false };
        const li = createTodoElement(todo);

        const checkbox = li.querySelector('input[type="checkbox"]');
        expect(checkbox.checked).toBe(false);
    });

    it("should have line-through when completed", () => {
        const todo = { text: "Klar", completed: true };
        const li = createTodoElement(todo);

        const span = li.querySelector("span");
        expect(span.style.textDecoration).toBe("line-through");
    });

    it("should have Edit and X buttons", () => {
        const todo = { text: "Test", completed: false };
        const li = createTodoElement(todo);

        const buttons = li.querySelectorAll("button");
        const texts = Array.from(buttons).map(b => b.textContent);

        expect(texts).toContain("Edit");
        expect(texts).toContain("X");
    });

    it("should show dueDate when set", () => {
        const todo = {
            text: "Deadline",
            completed: false,
            dueDate: "2024-12-25T10:00:00"
        };
        const li = createTodoElement(todo);

        expect(li.textContent).toContain("Ska goras");
    });

    it("should show offline status when offline", () => {
        const todo = {
            text: "Offline todo",
            completed: false,
            offline: true,
            syncStatus: "pending"
        };
        const li = createTodoElement(todo);

        expect(li.textContent).toContain("Ej synkad");
    });
});

describe("safeFetch", () => {

    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it("should return data on successful response", async () => {
        const fakeTodos = [
            { id: 1, text: "Köp mjölk", completed: false },
            { id: 2, text: "Städa", completed: true }
        ];

        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            headers: {
                get: () => "application/json"
            },
            json: () => Promise.resolve(fakeTodos)
        });

        const result = await safeFetch("/todos");

        expect(result).toEqual(fakeTodos);
        expect(fetch).toHaveBeenCalledWith("/todos", {});
    });
    it("should throw NETWORK_ERROR when fetch fails", async () => {
        globalThis.fetch = vi.fn().mockRejectedValue(
            new Error("Failed to fetch")
        );

        await expect(safeFetch("/todos"))
            .rejects.toThrow("NETWORK_ERROR");
    });

    it("should throw HTTP_ERROR when response is not ok", async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 500
        });

        await expect(safeFetch("/todos"))
            .rejects.toThrow("HTTP_ERROR_500");
    });

    it("should throw HTTP_ERROR_404 for missing resource", async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 404
        });

        await expect(safeFetch("/todos/999"))
            .rejects.toThrow("HTTP_ERROR_404");
    });

    it("should throw INVALID_JSON when content-type is wrong", async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            headers: {
                get: () => "text/html"
            }
        });

        await expect(safeFetch("/todos"))
            .rejects.toThrow("INVALID_JSON");
    });

    it("should throw INVALID_JSON when json parsing fails", async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            headers: {
                get: () => "application/json"
            },
            json: () => Promise.reject(new Error("bad json"))
        });

        await expect(safeFetch("/todos"))
            .rejects.toThrow("INVALID_JSON");
    });

    it("should pass method and headers for POST", async () => {
        const newTodo = { text: "Ny todo", completed: false };

        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            headers: {
                get: () => "application/json"
            },
            json: () => Promise.resolve({ id: 1, ...newTodo })
        });

        await safeFetch("/todos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newTodo)
        });

        expect(fetch).toHaveBeenCalledWith("/todos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newTodo)
        });
    });
});