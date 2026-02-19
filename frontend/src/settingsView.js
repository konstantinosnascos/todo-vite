//settingsView.js

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

export function initSettings() {
    const container = document.getElementById("settingsContainer");

    if (!container) {
        console.error("Settings-container saknas i html");
        return;
    }

    container.innerHTML = "";
    container.style.display = "block";

    const currentUsername = getCookie("username");

    const html = document.createElement("div");
    html.className = "settings-content";

    html.innerHTML =
        '<h3>Installningar</h3>' +
        '<div class="settings-form">' +
        '<label>Anvandarnamn: </label>' +
        '<input id="settingsUsernameInput" type="text" placeholder="Skriv ditt namn" value="' + (currentUsername || "") + '">' +
        '<button id="settingsSaveBtn">Spara</button>' +
        '<span id="settingsStatus"></span>' +
        '</div>' +
        '<button id="closeSettingsBtn" class="close-settings-btn">Stang installningar</button>';

    container.appendChild(html);

    document.getElementById("settingsSaveBtn").addEventListener("click", function () {
        const input = document.getElementById("settingsUsernameInput");
        const username = input.value.trim();

        if (username === "") {
            return;
        }

        setCookie("username", username, 7);
        document.getElementById("settingsStatus").textContent = "Sparat!";
        updateUsernameDisplay();
    });

    document.getElementById("closeSettingsBtn").addEventListener("click", function () {
        container.style.display = "none";
        container.innerHTML = "";
    });
}

export function getUsername() {
    return getCookie("username");
}

export function updateUsernameDisplay () {
    const display = document.getElementById("usernameDisplay");
    const username = getCookie("username");

    if (username) {
        display.textContent = "Inloggad som: " + username;
    } else {
        display.textContent = "";
    }
}