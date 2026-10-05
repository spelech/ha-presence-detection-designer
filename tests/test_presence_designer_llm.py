"""Test Presence Detection Designer LLM Verifier."""

import json
from unittest.mock import AsyncMock, MagicMock

import pytest

from custom_components.presence_detection_designer.const import LLMProviderType
from custom_components.presence_detection_designer.llm_verifier import (
    LLMVerifier,
    parse_llm_json_response,
)


def test_parse_llm_json_response():
    """Test extracting person_detected and reason from LLM output."""
    raw = '{"person_detected": true, "confidence": 0.95, "reason": "Man on couch watching TV"}'
    detected, reason = parse_llm_json_response(raw)
    assert detected is True
    assert reason == "Man on couch watching TV"

    # Embedded in markdown codeblock
    raw_md = '```json\n{"person_detected": false, "reason": "Empty living room"}\n```'
    detected, reason = parse_llm_json_response(raw_md)
    assert detected is False
    assert reason == "Empty living room"

    # Fallback to keyword matching if JSON is malformed
    raw_text = "I see a person sitting by the table."
    detected, reason = parse_llm_json_response(raw_text)
    assert detected is True

    raw_empty = "The room is completely empty with no human in sight."
    detected, reason = parse_llm_json_response(raw_empty)
    assert detected is False


@pytest.mark.asyncio
async def test_llm_verifier_vision_api():
    """Test direct Vision API mock execution."""
    mock_session = MagicMock()
    mock_response = AsyncMock()
    mock_response.status = 200
    mock_response.json = AsyncMock(
        return_value={
            "choices": [
                {
                    "message": {
                        "content": json.dumps(
                            {"person_detected": True, "reason": "Person visible"}
                        )
                    }
                }
            ]
        }
    )
    mock_session.post.return_value.__aenter__.return_value = mock_response

    verifier = LLMVerifier(
        provider_type=LLMProviderType.VISION_API,
        api_url="https://api.openai.com/v1/chat/completions",
        api_key="test-key",
        model="gpt-4o-mini",
        session=mock_session,
    )

    detected, reason = await verifier.async_verify(b"dummy_image_data")
    assert detected is True
    assert reason == "Person visible"


@pytest.mark.asyncio
async def test_acquire_snapshot_direct_url():
    """Test acquiring snapshot from direct Frigate / camera URL."""
    mock_session = MagicMock()
    mock_resp = AsyncMock()
    mock_resp.status = 200
    mock_resp.read = AsyncMock(return_value=b"jpeg_bytes_here")
    mock_session.get.return_value.__aenter__.return_value = mock_resp

    verifier = LLMVerifier(session=mock_session)
    data = await verifier.async_acquire_snapshot(
        direct_url="http://10.0.0.10:8301/api/living_room/latest.jpg"
    )
    assert data == b"jpeg_bytes_here"
