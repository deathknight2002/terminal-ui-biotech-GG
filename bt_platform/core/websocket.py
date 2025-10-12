"""
WebSocket router placeholder.

Provides a lightweight echo stream so the client can verify the
real-time channel is alive while proper data feeds are under
development.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

websocket_router = APIRouter()


@websocket_router.websocket("/ws/echo")
async def websocket_echo(socket: WebSocket) -> None:
    """Simple echo socket used during development."""

    await socket.accept()
    try:
        while True:
            message = await socket.receive_text()
            await socket.send_text(message)
    except WebSocketDisconnect:
        return
