import { createHttpApi } from "./httpApi.js";
import { createMockApi } from "./mockApi.js";

const mode = import.meta.env.VITE_API_MODE || "http";

export const api = mode === "mock" ? createMockApi() : createHttpApi();