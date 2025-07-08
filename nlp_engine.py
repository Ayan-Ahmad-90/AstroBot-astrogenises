import json

with open("back-end/data1/qa_pairs.json", "r", encoding="utf-8") as file:
    qa_data = json.load(file)

def get_bot_response(user_input):
    user_input = user_input.lower()
    for item in qa_data:
        if item["question"].lower() in user_input:
            return item["answer"]
    return "Sorry, I couldn't understand that. Please try asking differently."
