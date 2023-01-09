// Set the theme of the page based on the user's system preferences
if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-bs-theme', 'dark')
} else {
    document.documentElement.setAttribute('data-bs-theme', 'light')
}

// Define variables
let suggest_endpoint = document.getElementsByName("suggest_endpoint")[0].content;
let csrf = document.getElementsByName("csrf-token")[0].content;
let timeout;
let suggesting = false;
const contentDiv = document.getElementById("content");
const typeSelect = document.getElementById("type");
const topicInput = document.getElementById("topic");
const styleInput = document.getElementById("style");

// Send a request to the suggest endpoint after wait
const sendRequest = (wait = 1000) => {
    clearTimeout(timeout);
    if (contentDiv.textContent !== "") {
        timeout = setTimeout(() => {
            fetch(suggest_endpoint, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrf,
                },
                body: JSON.stringify({
                    type: typeSelect.value,
                    topic: topicInput.value,
                    style: styleInput.value,
                    content: contentDiv.innerText,
                }),
            })
                .then((response) => response.json())
                .then((data) => {
                    // Add the suggestion text in grey color after the existing text in the content div
                    const suggestion = document.createElement("span");
                    suggestion.id = "suggestion";
                    suggestion.classList.add("text-muted");
                    suggestion.innerText = data.suggestion;
                    contentDiv.appendChild(suggestion);
                    suggesting = true;
                });
        }, wait);
    }
};

// Send a request on new input
contentDiv.addEventListener("input", (event) => {
    sendRequest(800);
});

contentDiv.addEventListener("keydown", (event) => {
    // If the "Tab" key is pressed, turn the new text black and move the cursor to the end
    if ((event.key === "Tab"  || event.key === "Enter") && suggesting === true) {
        event.preventDefault();
        const suggestions = contentDiv.querySelectorAll("[id^=suggestion]");
        suggestions.forEach((suggestion) => {
            suggestion.id = "accepted";
            suggestion.classList.remove("text-muted");
        });
        suggesting = false;
        // Move the cursor to the end of the text
        const range = document.createRange();
        range.selectNodeContents(contentDiv);
        range.collapse(false);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        // Send a new request after the previous response has been accepted
        sendRequest(400);
    } else if (suggesting === true) {
        // If any other key is pressed, remove the new text and don't move the cursor
        event.preventDefault();
        const suggestions = contentDiv.querySelectorAll("[id^=suggestion]");
        suggestions.forEach((suggestion) => suggestion.remove());
        suggesting = false;
    }
});
