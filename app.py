"""Flask app to autocomplete text with OpenAI GPT-3."""

# Import from standard library
import os

# Import from 3rd party libraries
import sentry_sdk
from flask import Flask, request, render_template, send_from_directory
from sentry_sdk.integrations.flask import FlaskIntegration
from flask_wtf.csrf import CSRFProtect
import func_timeout

# Import modules
import oai

# Instantiate and configure Flask app
sentry_sdk.init(
    dsn=os.environ.get("SENTRY_DSN"),
    integrations=[FlaskIntegration()],
    traces_sample_rate=1.0
)
app = Flask(__name__)
app.config.update(
    SECRET_KEY=os.environ.get("FLASK_SECRET"),
    SESSION_COOKIE_HTTPONLY=True,
    REMEMBER_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Strict",
)
csrf = CSRFProtect()
csrf.init_app(app)


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
            "notes": str (optional)
        }
    """
    app.logger.info(request.json)
    style_prompt = request.json["style"] + " " if request.json["style"] else ""
    topic_prompt = f" about {request.json['topic']}" if request.json["topic"] else ""
    if request.json["notes"]:
        notes_prompt = f", considering the following notes:\n{request.json['notes']}" 
    else:
        notes_prompt = ""
    prompt = (
        f"Write a {style_prompt}{request.json['type']}{topic_prompt}"
        f"{notes_prompt}:\n\n{request.json['content']}"
    )[-1024:]
    openai = oai.Openai(app.logger)
    # TODO: Add moderation without making the overall response time too slow
    # flagged = openai.moderate(prompt)
    # if flagged:
    #     app.logger.info("Prompt flagged")
    #     return "Inappropriate prompt", 400
    try:
        completion = func_timeout.func_timeout(5, openai.complete, args=(prompt,))
    except func_timeout.exceptions.FunctionTimedOut:
        app.logger.error("OpenAI timed out")
        return "OpenAI timed out", 500
    if completion["status"] == "error":
        app.logger.error(completion["text"])
        return completion["text"], 500
    return {"suggestion": completion["text"]}


if __name__ == "__main__":
    app.run()
