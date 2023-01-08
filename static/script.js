let suggest_endpoint = document.getElementsByName("suggest_endpoint")[0].content;
let csrf = document.getElementsByName("csrf-token")[0].content;
let timeout;
let suggestion = "";

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
                    const newText = document.createElement("span");
                    newText.style.color = "#adb5bd";
                    newText.innerText = data.suggestion;
                    contentDiv.appendChild(newText);
                    suggestion = data.suggestion;
                });
        }, wait);
    }
};

contentDiv.addEventListener("input", (event) => {
    sendRequest(500);
});

contentDiv.addEventListener("keydown", (event) => {
    // If the "Tab" key is pressed, turn the new text black and move the cursor to the end
    if ((event.key === "Tab"  || event.key === "Enter") && suggestion !== "") {
        event.preventDefault();
        const newText = contentDiv.lastChild;
        newText.style.color = "#212529";
        contentDiv.focus();
        // Move the cursor to the end of the text
        const range = document.createRange();
        range.selectNodeContents(contentDiv);
        range.collapse(false);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        suggestion = "";
        // Send a new request one second after the previous response has been accepted
        sendRequest(1000);
    } else if (suggestion !== "") {
        // If any other key is pressed, remove the new text and don't move the cursor
        event.preventDefault();
        const newText = contentDiv.lastChild;
        newText.remove();
        suggestion = "";
        // Send a new request two seconds after the previous response has been rejected
        sendRequest(1000);
    }
});
