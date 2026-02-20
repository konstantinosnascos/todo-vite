// integration.test.js

import { describe, it, expect, vi, beforeEach } from "vitest";
import { _testExports } from "../todo.js";
import { createHttpApi } from "../api/httpApi.js";

const { createTodoElement, filterTodos } = _testExports;

describe("Integration: API → DOM", () => {
    let api;

    beforeEach(() => {
        vi.restoreAllMocks();
        api = createHttpApi();
    });

    it("should fetch todos and render them as list items", async () => {
        const fakeTodos = [
            { id: 1, text: "Handla", completed: false },
            { id: 2, text: "Städa", completed: true },
        ];

        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            headers: { get: () => "application/json" },
            json: () => Promise.resolve(fakeTodos),
        });

        const todos = await api.getTodos();

        const ul = document.createElement("ul");
        todos.forEach((todo) => {
            ul.appendChild(createTodoElement(todo));
        });

        expect(ul.children).toHaveLength(2);
        expect(ul.textContent).toContain("Handla");
        expect(ul.textContent).toContain("Städa");
    });

    it("should filter then render only active todos", async () => {
        const allTodos = [
            { id: 1, text: "Klar", completed: true },
            { id: 2, text: "Inte klar", completed: false },
            { id: 3, text: "Också klar", completed: true },
        ];

        const active = filterTodos(allTodos, "active");

        const ul = document.createElement("ul");
        active.forEach((todo) => {
            ul.appendChild(createTodoElement(todo));
        });

        expect(ul.children).toHaveLength(1);
        expect(ul.textContent).toContain("Inte klar");
        expect(ul.textContent).not.toContain("Klar");
    });

    it("should handle API error gracefully", async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 500,
        });

        const ul = document.createElement("ul");

        try {
            await api.getTodos();
        } catch (error) {
            const li = document.createElement("li");
            li.textContent = "Kunde inte ladda todos";
            li.className = "error-message";
            ul.appendChild(li);
        }

        expect(ul.querySelector(".error-message")).not.toBeNull();
        expect(ul.textContent).toContain("Kunde inte ladda");
    });
});