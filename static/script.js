let timeoutId;
let suggestion = "";

const contentDiv = document.getElementById("content");
const typeSelect = document.getElementById("type");

const sendRequest = () => {
    clearTimeout(timeoutId);
    if (contentDiv.textContent !== "") {
        // Send the text content of the "content" div to the "/suggest" endpoint after 1 second
        timeoutId = setTimeout(() => {
            fetch("/suggest", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: typeSelect.value + "\n\n" + contentDiv.innerText,
                }),
            })
                .then((response) => response.json())
                .then((data) => {
                    // Add the suggestion text in grey color after the existing text in the "content" div
                    const newText = document.createElement("span");
                    newText.style.color = "#adb5bd";
                    newText.innerText = data.suggestion;
                    contentDiv.appendChild(newText);
                    suggestion = data.suggestion;
                });
        }, 1000);
    }
};

contentDiv.addEventListener("input", sendRequest);

contentDiv.addEventListener("keydown", (event) => {
    // If the "Tab" key is pressed, turn the new text black and move the cursor to the end
    if (event.key === "Tab" && suggestion !== "") {
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
        sendRequest();
    } else if (suggestion !== "") {
        // If any other key is pressed, remove the new text and don't move the cursor
        event.preventDefault();
        const newText = contentDiv.lastChild;
        newText.remove();
        suggestion = "";
        // Send a new request one second after the previous response has been rejected
        sendRequest();
    }
});
