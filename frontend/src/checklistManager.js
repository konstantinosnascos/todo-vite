// checklistManager.js

export function renderChecklist(todo, detailsDiv, updateTodoCallback, rerenderCallback) {
    // Beskrivning
    const descriptionLabel = document.createElement("label");
    descriptionLabel.textContent = "Beskrivning: ";

    const descriptionInput = document.createElement("textarea");
    descriptionInput.value = todo.description || "";
    descriptionInput.rows = 3;
    descriptionInput.style.width = "200px";

    descriptionInput.addEventListener("change", async function () {
        todo.description = descriptionInput.value;
        try {
            await updateTodoCallback(todo);
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

    todo.checklist.forEach(function (item, itemIndex) {
        const itemLi = document.createElement("li");

        const itemCheckbox = document.createElement("input");
        itemCheckbox.type = "checkbox";
        itemCheckbox.checked = item.done;

        itemCheckbox.addEventListener("change", async function () {
            todo.checklist[itemIndex].done = itemCheckbox.checked;
            try {
                await updateTodoCallback(todo);
            } catch (error) {
                console.error("Fel vid uppdatering:", error);
            }
            rerenderCallback();
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

        removeItemBtn.addEventListener("click", async function () {
            todo.checklist.splice(itemIndex, 1);
            try {
                await updateTodoCallback(todo);
            } catch (error) {
                console.error("Fel vid uppdatering:", error);
            }
            rerenderCallback();
        });

        itemLi.appendChild(itemCheckbox);
        itemLi.appendChild(itemText);
        itemLi.appendChild(removeItemBtn);
        checklistUl.appendChild(itemLi);
    });

    checklistDiv.appendChild(checklistUl);

    // Lägg till ny punkt
    const newItemInput = document.createElement("input");
    newItemInput.type = "text";
    newItemInput.placeholder = "Ny punkt...";

    const addItemBtn = document.createElement("button");
    addItemBtn.textContent = "Lagg till";

    addItemBtn.addEventListener("click", async function () {
        if (newItemInput.value === "") return;

        todo.checklist.push({
            text: newItemInput.value,
            done: false
        });

        try {
            await updateTodoCallback(todo);
        } catch (error) {
            console.error("Fel vid uppdatering:", error);
        }
        rerenderCallback();
    });

    newItemInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            addItemBtn.click();
        }
    });

    checklistDiv.appendChild(newItemInput);
    checklistDiv.appendChild(addItemBtn);
    detailsDiv.appendChild(checklistDiv);
}