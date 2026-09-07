from agent.parser import freetext_final, parse_step


def test_parses_action_and_string_input():
    text = (
        "Thought: I should look this up.\n"
        "Action: web_search\n"
        "Action Input: population of Portugal\n"
    )
    step = parse_step(text)
    assert step.action == "web_search"
    assert step.action_input == "population of Portugal"
    assert step.thought.startswith("I should look this up")
    assert not step.is_final


def test_parses_json_action_input():
    text = (
        'Thought: read the file.\n'
        'Action: file_read\n'
        'Action Input: {"path": "notes.txt", "max_chars": 500}\n'
    )
    step = parse_step(text)
    assert step.action == "file_read"
    assert step.action_input == {"path": "notes.txt", "max_chars": 500}


def test_parses_final_answer():
    text = "Thought: I now know the final answer.\nFinal Answer: 42 is the answer."
    step = parse_step(text)
    assert step.is_final
    assert step.final_answer == "42 is the answer."


def test_final_answer_wins_over_action():
    text = "Action: web_search\nAction Input: x\nFinal Answer: done"
    step = parse_step(text)
    assert step.is_final
    assert step.final_answer == "done"


def test_malformed_output_reports_error():
    step = parse_step("The capital of France is Paris.")
    assert step.action is None
    assert step.final_answer is None
    assert step.error is not None


def test_freetext_final_strips_thought_label():
    assert freetext_final("Thought: The answer is clearly 7.") == "The answer is clearly 7."
    assert freetext_final("Final Answer: 7") == "7"
