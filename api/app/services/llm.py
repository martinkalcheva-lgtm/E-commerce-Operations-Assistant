import json
from typing import Any

import httpx

from app.core.config import Settings
from app.services.model_settings import get_runtime_settings

# 大模型配置缺失异常
class LLMNotConfiguredError(RuntimeError):
    pass

# 大模型返回响应异常
class LLMResponseError(RuntimeError):
    pass

# 判断llm配置信息是否存在  -> bool
def is_llm_configured(settings: Settings | None = None) -> bool:
    settings = settings or get_runtime_settings()
    return bool(settings.llm_base_url and settings.llm_api_key and settings.llm_model)


def create_json_chat_completion(
    messages: list[dict[str, str]],
    *,
    max_tokens: int = 1800,
    temperature: float = 0.3,
    settings: Settings | None = None,
) -> tuple[dict[str, Any], dict[str, Any]]:
    settings = settings or get_runtime_settings()
    if not is_llm_configured(settings):
        raise LLMNotConfiguredError("LLM provider is not configured.")

    response_json = _post_chat_completion(
        settings=settings,
        messages=messages,
        max_tokens=max_tokens,
        temperature=temperature,
    )
    content = _extract_message_content(response_json)
    try:
        parsed = json.loads(content)
    except json.JSONDecodeError as exc:
        raise LLMResponseError("LLM response was not valid JSON.") from exc

    if not isinstance(parsed, dict):
        raise LLMResponseError("LLM response must be a JSON object.")
    return parsed, response_json


def _post_chat_completion(
    *,
    settings: Settings,
    messages: list[dict[str, str]],
    max_tokens: int,
    temperature: float,
) -> dict[str, Any]:
    url = _chat_completion_url(settings.llm_base_url or "")
    payload: dict[str, Any] = {
        "model": settings.llm_model,
        "messages": messages,
        "response_format": {"type": "json_object"},
        "max_tokens": max_tokens,
        "temperature": temperature,
        "stream": False,
    }
    if (settings.llm_model or "").startswith("deepseek-v4"):
        payload["thinking"] = {"type": "disabled"}

    try:
        with httpx.Client(timeout=60) as client:
            response = client.post(
                url,
                headers={
                    "Authorization": f"Bearer {settings.llm_api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        detail = f"HTTP {exc.response.status_code}"
        raise LLMResponseError(f"LLM provider returned an error: {detail}") from exc
    except httpx.HTTPError as exc:
        raise LLMResponseError("LLM provider request failed.") from exc

    try:
        data = response.json()
    except ValueError as exc:
        raise LLMResponseError("LLM provider response was not JSON.") from exc
    if not isinstance(data, dict):
        raise LLMResponseError("LLM provider response must be a JSON object.")
    return data

# 拼接base_url + /chat/completions
def _chat_completion_url(base_url: str) -> str:
    # 去掉首尾空格，并且删掉末尾多余的斜杠
    normalized = base_url.strip().rstrip("/")
    # 如果已经以 /chat/completions 结尾，直接返回，不再重复拼接
    if normalized.endswith("/chat/completions"):
        return normalized
    # 否则拼接后缀，生成完整对话接口地址
    return f"{normalized}/chat/completions"

# 看内容是否为空/报错原因
def _extract_message_content(response_json: dict[str, Any]) -> str:
    try:
        # 按OpenAI规范路径取值：choices数组第0项 → message → content
        content = response_json["choices"][0]["message"]["content"]
    # 捕获几种报错：key不存在、数组下标越界、类型不是字典/数组
    except (KeyError, IndexError, TypeError) as exc:
        raise LLMResponseError("LLM response did not contain message content.") from exc

    # 校验：content必须是字符串，并且不能全是空白
    if not isinstance(content, str) or not content.strip():
        raise LLMResponseError("LLM response content was empty.")
    
    return content
