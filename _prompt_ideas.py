# Prompt 1
any_criteria = (
    request.json["topic"]
    or request.json["style"]
    or request.json["audience"]
    or request.json["notes"]
)
prompt = (
    "You are a passionate subject matter expert and an excellent writer. "
    "Your content is powerful, concise, insightful, and engaging. "
    "You structure your text to be easy to read and understand, "
    "using sections with headlines and lists. "
    f"You are now writing a new {request.json['type']}"
    f"{' considering these notes' if any_criteria else ''}:\n"
    f"{'Topic: ' + request.json['topic'] + chr(10) if request.json['topic'] else ''}"
    f"{'Style: ' + request.json['style'] + chr(10) if request.json['style'] else ''}"
    f"{'Audience: ' + request.json['audience'] + chr(10) if request.json['audience'] else ''}"
    f"{'Other: ' + request.json['notes'] + chr(10) if request.json['notes'] else ''}"
    "\n"
    "---\n"
    "\n"
    f"{request.json['content']}"
)

# Prompt 2
prompt = (
    "Author: passionate expert, excellent writer\n"
    "Style: powerful, concise, insightful, engaging\n"
    "Structure: easy to read and understand, includes headlines and lists\n"
    f"Type: {request.json['type']}\n"
    f"Topic: {request.json['topic'] if request.json['topic'] else 'something interesting'}\n"
    f"{'Audience: ' + request.json['audience'] + chr(10) if request.json['audience'] else ''}"
    f"{'Other: ' + request.json['notes'] + chr(10) if request.json['notes'] else ''}"
    "\n"
    "Content:\n"
    f"{request.json['content']}"
)