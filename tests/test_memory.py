from agent.memory import HybridMemory


class StubLLM:
    def __init__(self):
        self.calls = []

    def chat(self, messages, *, stop=None, model=None):
        self.calls.append((messages, model))
        return "SUMMARY: earlier turns folded."


def test_window_keeps_last_n_turns_verbatim():
    mem = HybridMemory(StubLLM(), window=3)
    for i in range(3):
        mem.add_turn(f"q{i}", f"a{i}")
    rendered = mem.render()
    assert "q0" in rendered and "q2" in rendered
    assert "Summary of earlier conversation" not in rendered


def test_overflow_triggers_background_summary_fold():
    stub = StubLLM()
    mem = HybridMemory(stub, window=3)
    for i in range(5):
        mem.add_turn(f"q{i}", f"a{i}")
    mem.wait_for_fold(timeout=5)

    assert mem.summary == "SUMMARY: earlier turns folded."
    assert stub.calls and stub.calls[-1][1] == mem.summary_model  # cheap model used

    rendered = mem.render()
    assert "SUMMARY: earlier turns folded." in rendered
    # only the last 3 turns stay verbatim
    assert "q0" not in rendered and "q1" not in rendered
    assert "q2" in rendered and "q4" in rendered


def test_fold_failure_does_not_break_memory():
    class Boom:
        def chat(self, *a, **k):
            raise RuntimeError("groq down")

    mem = HybridMemory(Boom(), window=1)
    mem.add_turn("q0", "a0")
    mem.add_turn("q1", "a1")
    mem.wait_for_fold(timeout=5)
    assert mem.summary == ""  # unchanged
    assert "q1" in mem.render()
