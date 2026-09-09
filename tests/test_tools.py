import agent.tools.web_search as ws
from agent.tools.file_read import FileReadTool
from agent.tools.web_search import WebSearchTool

_FIXTURE = {
    "answer_box": {"answer": "Lisbon"},
    "knowledge_graph": {"title": "Portugal", "description": "Country in Europe"},
    "organic_results": [
        {"title": "Portugal", "snippet": "A country.", "link": "https://ex.com/pt"},
        {"title": "Lisbon", "snippet": "Its capital.", "link": "https://ex.com/lx"},
    ],
}


class _FakeResp:
    def __init__(self, payload):
        self._payload = payload

    def raise_for_status(self):
        pass

    def json(self):
        return self._payload


def test_web_search_formats_serpapi_payload(monkeypatch):
    monkeypatch.setattr(ws, "require_serpapi_key", lambda: "fake-key")
    monkeypatch.setattr(ws.requests, "get", lambda *a, **k: _FakeResp(_FIXTURE))

    out = WebSearchTool()("capital of Portugal")
    assert "Answer box: Lisbon" in out
    assert "Knowledge graph (Portugal): Country in Europe" in out
    assert "1. Portugal — A country. (https://ex.com/pt)" in out
    assert "2. Lisbon — Its capital. (https://ex.com/lx)" in out


def test_web_search_surfaces_api_error(monkeypatch):
    monkeypatch.setattr(ws, "require_serpapi_key", lambda: "fake-key")
    monkeypatch.setattr(
        ws.requests, "get", lambda *a, **k: _FakeResp({"error": "quota exceeded"})
    )
    assert "quota exceeded" in WebSearchTool()("anything")


def test_file_read_reads_text(tmp_path, monkeypatch):
    import agent.tools.file_read as fr

    monkeypatch.setattr(fr, "FILE_READ_BASE_DIR", tmp_path.resolve())
    f = tmp_path / "note.txt"
    f.write_text("hello world", encoding="utf-8")

    assert FileReadTool()("note.txt") == "hello world"


def test_file_read_truncates(tmp_path, monkeypatch):
    import agent.tools.file_read as fr

    monkeypatch.setattr(fr, "FILE_READ_BASE_DIR", tmp_path.resolve())
    (tmp_path / "big.txt").write_text("x" * 5000, encoding="utf-8")

    out = FileReadTool()({"path": "big.txt", "max_chars": 1000})
    assert out.endswith("...[truncated]")
    assert len(out) < 1100


def test_file_read_blocks_path_escape(tmp_path, monkeypatch):
    import agent.tools.file_read as fr

    monkeypatch.setattr(fr, "FILE_READ_BASE_DIR", tmp_path.resolve())
    out = FileReadTool()("../secrets.txt")
    assert "outside the allowed directory" in out


def test_file_read_missing_file(tmp_path, monkeypatch):
    import agent.tools.file_read as fr

    monkeypatch.setattr(fr, "FILE_READ_BASE_DIR", tmp_path.resolve())
    assert "no such file" in FileReadTool()("ghost.txt")
