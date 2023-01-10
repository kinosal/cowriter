"""Flask app to autocomplete text with OpenAI GPT-3."""

# Import from standard library
import os

# Import from 3rd party libraries
from flask import Flask, request, render_template, send_from_directory
from flask_wtf.csrf import CSRFProtect

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


@app.route("/favicon.ico")
def favicon():
    return send_from_directory(directory="static", path="favicon.ico")


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/suggest", methods=["POST"])
def suggest() -> dict:
    """Suggest a continuation of the prompt.
    Requires a JSON body with a "type", "content" and optional "topic" or "style" fields.
    """
    app.logger.info(request.json)
    style = request.json["style"] + " " if request.json["style"] else ""
    prompt = (
        f"This is a {style}{request.json['type']} about {request.json['topic']}:"
        f"\n\n{request.json['content']}"
    )[-1024:]
    openai = oai.Openai(app.logger)
    flagged = openai.moderate(prompt)
    if flagged:
        app.logger.info("Prompt flagged")
        return "Inappropriate prompt", 400
    return {"suggestion": openai.complete(prompt)}


if __name__ == "__main__":
    app.run()
