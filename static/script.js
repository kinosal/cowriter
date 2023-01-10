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
let suggestion = "";
let requesting = false;
const contentDiv = document.getElementById("content");
const typeSelect = document.getElementById("type");
const topicInput = document.getElementById("topic");
const styleInput = document.getElementById("style");
const notesInput = document.getElementById("notes");
const errorDiv = document.getElementById("error");

// Send a request to the suggest endpoint after wait
const sendRequest = (wait = 1000) => {
    errorDiv.setAttribute("hidden", "");
    clearTimeout(timeout);
    timeout = setTimeout(() => {
        requesting = true;
        // Remove potentially still remaining suggestions
        const suggestions = contentDiv.querySelectorAll("[id^=suggestion]");
        suggestions.forEach((suggestion) => suggestion.remove());
        suggestion = "";
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
                notes: notesInput.value,
                content: contentDiv.innerText,
            }),
        }).then((response) => {
            requesting = false;
            if (!requesting) {
                if (response.ok) {
                    return response.json();
                } else {
                    return response.text().then(text => {throw new Error(text)})
                }
            }
        }).then((data) => {
            if (!requesting) {
                // Add the suggestion text in grey after the existing content
                const new_suggestion = document.createElement("span");
                new_suggestion.id = "suggestion";
                new_suggestion.classList.add("text-muted");
                new_suggestion.innerText = data.suggestion;
                contentDiv.appendChild(new_suggestion);
                suggestion = data.suggestion;
            }
        }).catch((error) => {
            errorDiv.innerText = error;
            errorDiv.removeAttribute("hidden");
        })
    }, wait)
};

// Send a request on new input
contentDiv.addEventListener("input", (event) => {
    if (contentDiv.textContent !== "" && suggestion === "") {
        sendRequest(500);
    }
});

contentDiv.addEventListener("keydown", (event) => {
    if (suggestion !== "") {
        if (event.key === "Tab"  || event.key === "Enter") {
            // If the "Tab" or "Enter" key is pressed,
            // turn the suggested text black and move the cursor to the end
            event.preventDefault();
            const suggestions = contentDiv.querySelectorAll("[id^=suggestion]");
            suggestions.forEach((suggestion) => {
                suggestion.id = "accepted";
                suggestion.classList.remove("text-muted");
            });
            // Move the cursor to the end of the text
            const range = document.createRange();
            range.selectNodeContents(contentDiv);
            range.collapse(false);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            suggestion = "";
            // Send a new request after the previous response has been accepted
            sendRequest(100);
        } else if (event.key === suggestion[0]) {
            // If the next suggested character is pressed,
            // accept only it (remove the first character from the suggestion)
            suggestion = suggestion.slice(1);
            const suggestion_span = document.getElementById("suggestion");
            suggestion_span.innerText = suggestion;
        } else {
            // If any other key is pressed, remove the suggested text and don't move the cursor
            const suggestions = contentDiv.querySelectorAll("[id^=suggestion]");
            suggestions.forEach((suggestion) => suggestion.remove());
            suggestion = "";
        }
    }
});
