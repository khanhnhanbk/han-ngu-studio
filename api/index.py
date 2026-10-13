"""FastAPI app exposed as a Vercel Python Function."""

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

try:
    from ._core.tokenizer import join_tokens, segment
except ImportError:
    # Vercel loads this file as a top-level module, not as part of a package.
    from _core.tokenizer import join_tokens, segment

app = FastAPI()


class SegmentRequest(BaseModel):
    text: str = Field(min_length=1, max_length=5000)


@app.get("/api/py/health")
def health():
    return {"status": "ok"}


@app.post("/api/py/segment")
def segment_endpoint(payload: SegmentRequest):
    lines = segment(payload.text)
    segmented = "\n".join(join_tokens(tokens) for tokens in lines)
    return {"segmented": segmented, "lines": lines}


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "invalid_input",
                "message": "Văn bản phải có từ 1 đến 5000 ký tự.",
            }
        },
    )
