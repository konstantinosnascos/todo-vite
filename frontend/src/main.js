import './style.css'
import { setupTodo } from "./todo.js";

setupTodo();

/*
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js")
            .then(() => {
                console.log("Service Worker registrerad");
            })
            .catch(err => {
                console.error("SW-fel:", err);
            });
    });
}
 */