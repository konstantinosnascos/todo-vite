// statsView.js

export function initStats(todos) {
    const container = document.getElementById("statsContainer");

    if (!container) {
        console.error("Stats-container saknas i HTML");
        return;
    }

    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const pending = total - completed;
    const withDueDate = todos.filter(t => t.dueDate).length;

    let checklistProgress = 0;
    const todosWithChecklist = todos.filter(t => t.checklist && t.checklist.length > 0);

    if (todosWithChecklist.length > 0) {
        const totalProgress = todosWithChecklist.reduce((sum, todo) => {
            const done = todo.checklist.filter(item => item.done).length;
            return sum + (done / todo.checklist.length) * 100;
        }, 0);
        checklistProgress = Math.round(totalProgress / todosWithChecklist.length);
    }

    const now = new Date();
    const overdue = todos.filter(t => {
        if (!t.duedate || t.completed) return false;
        return new Date(t.duedate) < now;
    }).length;


    container.innerHTML ="";
    container.style.display = "block";
    const html = document.createElement("div");
    html.className = "stats.content";

    html.innerHTML =
        '<h3>Statistik</h3>' +
            '<div class="stats-grid">' +
                '<div class="stat-card">' +
                    '<span class="stat-number">' + total + '</span>' +
                    '<span class="stat-label">Totalt</span>' +
                '</div>' +
                '<div class="stat-card stat-completed">' +
                    '<span class="stat-number">' + completed + '</span>' +
                    '<span class="stat-label">Klara</span>' +
                '</div>' +
                '<div class="stat-card stat-pending">' +
                    '<span class="stat-number">' + pending + '</span>' +
                    '<span class="stat-label">Kvar</span>' +
                '</div>' +
                '<div class="stat-card stat-overdue">' +
                    '<span class="stat-number">' + overdue + '</span>' +
                    '<span class="stat-label">Försenade</span>' +
                '</div>' +
                '<div class="stat-card">' +
                    '<span class="stat-number">' + withDueDate + '</span>' +
                    '<span class="stat-label">Har deadline</span>' +
                '</div>' +
                '<div class="stat-card">' +
                    '<span class="stat-number">' + checklistProgress + '</span>' +
                    '<span class="stat-label">Checklista-progress</span>' +
                '</div>' +
            '</div>' +
            '<button id="closeStatsBtn" class ="close-stats-btn">Stäng statistik</button>';

        container.appendChild(html);

        document.getElementById("closeStatsBtn").addEventListener("click", function() {
            container.style.display = "none";
            container.innerHtml = "";
    });
}