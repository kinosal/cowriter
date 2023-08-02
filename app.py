"""Flask app to autocomplete text with OpenAI GPT-3."""

# Import from standard library
import os
import time

# Import from 3rd party libraries
from flask import Flask, request, render_template, send_from_directory, session
import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration
from flask_wtf.csrf import CSRFProtect
import func_timeout

# Import modules
import oai

# Instantiate and configure Flask app
app = Flask(__name__)
app.config.update(
    SECRET_KEY=os.environ.get("FLASK_SECRET"),
    SESSION_COOKIE_HTTPONLY=True,
    REMEMBER_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Strict",
)
csrf = CSRFProtect()
csrf.init_app(app)
if not app.config["DEBUG"]:
    sentry_sdk.init(
        dsn=os.environ.get("SENTRY_DSN"),
        integrations=[FlaskIntegration()],
        traces_sample_rate=1.0,
    )


@app.route("/favicon.ico")
def favicon():
    return send_from_directory(directory="static", path="favicon.ico")


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/suggest", methods=["POST"])
def suggest() -> dict:
    """Suggest a continuation of the prompt.

    Expected request body:
        {
            "type": str,
            "content": str,
            "topic": str (optional),
            "style": str (optional),
            "audience": str (optional),
            "notes": str (optional)
        }
    """
    session["n_requests"] = session.get("n_requests", 0) + 1
    request_data = request.json
    request_data["session_token"] = session["csrf_token"]
    request_data["n_session_requests"] = session["n_requests"]
    request_data["ip"] = request.remote_addr
    app.logger.info(request_data)

    if session["n_requests"] % 10 == 0:
        time.sleep(2)
        return "Too many requests, please wait a few seconds", 429
    # model = "text-davinci-003" if session["n_requests"] <= 20 else "text-curie-001"
    model = "gpt-3.5-turbo"

    style_prompt = f", {request.json['style']}" if request.json["style"] else ""
    audience_prompt = f" for {request.json['audience']}" if request.json["audience"] else ""
    topic_prompt = f"{request.json['topic']}" if request.json["topic"] else "an interesting topic"
    notes_prompt = f", considering these notes:\n{request.json['notes']}" if request.json["notes"] else ":"
    prompt = (
        f"Write a well structured{style_prompt} {request.json['type']}"
        f"{audience_prompt} about {topic_prompt}{notes_prompt}\n\n"
        f"[...]\n\n"
        f"{' '.join(request.json['content'].split(' ')[-200:])}"
    )

    openai = oai.Openai(app.logger)
    # TODO: Add moderation without making the overall response time too slow
    # flagged = openai.moderate(prompt)
    # if flagged:
    #     app.logger.info("Prompt flagged")
    #     return "Inappropriate prompt", 400
    try:
        completion = func_timeout.func_timeout(
            5, openai.complete, args=(prompt, model)
        )
    except func_timeout.exceptions.FunctionTimedOut:
        app.logger.error("OpenAI timed out")
        return "OpenAI timed out", 500
    if completion["status"] == "error":
        app.logger.error(completion["text"])
        return completion["text"], 500
    return {"suggestion": completion["text"]}


if __name__ == "__main__":
    app.run()
