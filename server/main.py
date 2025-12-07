from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import meshtastic.serial_interface
from meshtastic import BROADCAST_ADDR
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global variable to store the Meshtastic interface
meshtastic_interface = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage Meshtastic connection lifecycle"""
    global meshtastic_interface
    
    # Startup: Initialize Meshtastic connection
    try:
        logger.info("Initializing Meshtastic connection on /dev/cu.usbserial-0001")
        meshtastic_interface = meshtastic.serial_interface.SerialInterface(devPath="/dev/cu.usbserial-0001")
        logger.info("Meshtastic connection established successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Meshtastic connection: {e}")
        meshtastic_interface = None
    
    yield
    
    # Shutdown: Close Meshtastic connection
    if meshtastic_interface:
        try:
            logger.info("Closing Meshtastic connection")
            meshtastic_interface.close()
            logger.info("Meshtastic connection closed")
        except Exception as e:
            logger.error(f"Error closing Meshtastic connection: {e}")


app = FastAPI(
    title="Meshtastic Broadcast API",
    description="API server for broadcasting messages over Meshtastic",
    version="0.1.0",
    lifespan=lifespan
)


class MessageRequest(BaseModel):
    """Request model for broadcast message"""
    message: str
    destinationId: Optional[str] = None  # Defaults to BROADCAST_ADDR if not specified


@app.post("/broadcast")
async def broadcast_message(request: MessageRequest):
    """
    Broadcast a message over the Meshtastic network.
    
    Args:
        request: MessageRequest containing the message text
        
    Returns:
        dict: Status of the broadcast operation
    """
    global meshtastic_interface
    
    if meshtastic_interface is None:
        raise HTTPException(
            status_code=503,
            detail="Meshtastic interface not available. Check device connection."
        )
    
    if not request.message or not request.message.strip():
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty"
        )
    
    try:
        # Use BROADCAST_ADDR if destinationId is not specified
        destination = request.destinationId if request.destinationId else BROADCAST_ADDR
        logger.info(f"Broadcasting message: {request.message} to destination: {destination}")
        meshtastic_interface.sendText(request.message, destinationId=destination)
        return {
            "status": "success",
            "message": "Message broadcasted successfully",
            "text": request.message,
            "destinationId": destination
        }
    except Exception as e:
        logger.error(f"Error broadcasting message: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to broadcast message: {str(e)}"
        )


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    global meshtastic_interface
    return {
        "status": "healthy",
        "meshtastic_connected": meshtastic_interface is not None
    }

