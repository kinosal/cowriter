let suggest_endpoint = document.getElementsByName("suggest_endpoint")[0].content;
let csrf = document.getElementsByName("csrf-token")[0].content;
let timeout;
let suggesting = false;

const contentDiv = document.getElementById("content");
const typeSelect = document.getElementById("type");
const styleInput = document.getElementById("style");

const sendRequest = (wait = 1000) => {
    clearTimeout(timeout);
    if (contentDiv.textContent !== "") {
        // Send the text content of the "content" div to the suggest endpoint after waiting for "wait" milliseconds
        timeout = setTimeout(() => {
            fetch(suggest_endpoint, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrf,
                },
                body: JSON.stringify({
                    type: typeSelect.value,
                    style: styleInput.value,
                    content: contentDiv.innerText,
                }),
            })
                .then((response) => response.json())
                .then((data) => {
                    // Add the suggestion text in grey color after the existing text in the content div
                    const suggestion = document.createElement("span");
                    suggestion.id = "suggestion";
                    suggestion.style.color = "#adb5bd";
                    suggestion.innerText = data.suggestion;
                    contentDiv.appendChild(suggestion);
                    suggesting = true;
                });
        }, wait);
    }
};

contentDiv.addEventListener("input", (event) => {
    // Send a request after the user stops typing
    sendRequest(400);
});

contentDiv.addEventListener("keydown", (event) => {
    // If the "Tab" key is pressed, turn the new text black and move the cursor to the end
    if ((event.key === "Tab"  || event.key === "Enter") && suggesting === true) {
        event.preventDefault();
        const suggestions = contentDiv.querySelectorAll("[id^=suggestion]");
        suggestions.forEach((suggestion) => {
            suggestion.id = "accepted";
            suggestion.style.color = "#212529";
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
        sendRequest(800);
    } else if (suggesting === true) {
        // If any other key is pressed, remove the new text and don't move the cursor
        event.preventDefault();
        const suggestions = contentDiv.querySelectorAll("[id^=suggestion]");
        suggestions.forEach((suggestion) => suggestion.remove());
        suggesting = false;
    }
});
