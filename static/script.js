// Define variables
let debug = document.getElementsByName("debug")[0].content; // used in google.js and inspectlet.js
let suggest_endpoint = document.getElementsByName("suggest_endpoint")[0].content;
let csrf = document.getElementsByName("csrf-token")[0].content;
let timeout;
let suggestion = "";
let requesting = false;
let last_key = "";
const contentDiv = document.getElementById("content");
const typeSelect = document.getElementById("type");
const topicInput = document.getElementById("topic");
const styleInput = document.getElementById("style");
const audienceInput = document.getElementById("audience");
const notesInput = document.getElementById("notes");
const errorDiv = document.getElementById("error");
const customType = document.getElementById("custom-type");
const startButton = document.getElementById("start");
const editorRow = document.getElementById("editor");

// Set the Bootstrap theme of the page based on the user's system preferences
if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-bs-theme', 'dark')
    editorRow.classList.add("bg-dark-subtle");
} else {
    document.documentElement.setAttribute('data-bs-theme', 'light')
    editorRow.classList.add("bg-light");
}

// Show custom type input if "custom" is selected
typeSelect.addEventListener("change", (event) => {
    if (typeSelect.value === "custom") {
        customType.removeAttribute("hidden");
    } else {
        customType.setAttribute("hidden", "");
    }
});

// Send a request on start button click
startButton.addEventListener("click", (event) => {
    if (contentDiv.textContent === "") {
        sendRequest(0);
        // Move the cursor to the beginning of the content div
        const range = document.createRange();
        range.selectNodeContents(contentDiv);
        range.collapse(true);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        startButton.setAttribute("hidden", "");
    }
})

// Show start button only when content is empty
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList' || mutation.type === 'characterData') {
      if (contentDiv.textContent === "") {
        startButton.removeAttribute("hidden");
      } else {
        startButton.setAttribute("hidden", "");
      }
    }
  })
})
observer.observe(contentDiv, { childList: true, characterData: true });

// Send a request on new input
contentDiv.addEventListener("input", (event) => {
    if (
        contentDiv.textContent !== ""
        && suggestion === ""
        && last_key !== "Backspace"
        && last_key !== "Delete"
    ) {
        sendRequest(500);
    }
})

// Send a request to the suggest endpoint after wait
const sendRequest = (wait = 1000) => {
    errorDiv.setAttribute("hidden", "");
    clearTimeout(timeout);
    timeout = setTimeout(() => {
        requesting = true;
        // Remove potentially still remaining suggestions
        const suggestions = contentDiv.querySelectorAll("[id^=suggestion]");
        suggestions.forEach((suggestion) => suggestion.remove());
        // Send the request
        const type_value = typeSelect.value === "custom" ? customType.value : typeSelect.value;
        fetch(suggest_endpoint, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrf,
            },
            body: JSON.stringify({
                type: type_value,
                topic: topicInput.value,
                style: styleInput.value,
                audience: audienceInput.value,
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
                // Remove potentially still remaining suggestions
                const suggestions = contentDiv.querySelectorAll("[id^=suggestion]");
                suggestions.forEach((suggestion) => suggestion.remove());
                // Add the suggestion text in grey after the existing content
                const new_suggestion = document.createElement("span");
                new_suggestion.id = "suggestion";
                new_suggestion.classList.add("text-muted");
                // Remove potential leading whitespace from first suggestion
                if (contentDiv.innerText === "") {
                    suggestion = data.suggestion.trimStart();
                } else {
                    suggestion = data.suggestion;
                }
                new_suggestion.innerText = suggestion;
                contentDiv.appendChild(new_suggestion);
            }
        }).catch((error) => {
            errorDiv.innerText = error;
            errorDiv.removeAttribute("hidden");
        })
    }, wait)
};

// Clear style of pasted text
// TODO: Test (style copy seen with some users but can't reproduce)
// contentDiv.addEventListener("paste", (event) => {
//     event.preventDefault();
//     contentDiv.append(event.clipboardData.getData("text/plain"));
// })

contentDiv.addEventListener("keydown", (event) => {
    last_key = event.key;
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
        } else if (
            event.key !== "ArrowLeft"
            && event.key !== "ArrowRight"
            && event.key !== "ArrowUp"
            && event.key !== "ArrowDown"
            && event.key !== "Shift"
            && event.key !== "Control"
            && event.key !== "Alt"
            && event.key !== "Meta"
            && event.key !== "CapsLock"
        ) {
            // If any other non-neutral key is pressed,
            // remove the suggested text and don't move the cursor
            const suggestions = contentDiv.querySelectorAll("[id^=suggestion]");
            suggestions.forEach((suggestion) => suggestion.remove());
            suggestion = "";
        }
    }
})
