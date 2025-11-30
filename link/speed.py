from __future__ import annotations

from typing import Dict

from speedtest import Speedtest

from .logger import get_logger

logger = get_logger(__name__)


def run_speed_test(timeout: int = 30) -> Dict[str, float]:
    """Run internet speed test with timeout"""
    logger.info(f"Starting speed test with {timeout}s timeout")
    
    try:
        st = Speedtest(timeout=timeout)
    except Exception as e:
        logger.error(f"Failed to initialize speed test: {e}")
        return {"download_mbps": 0.0, "upload_mbps": 0.0}
    
    try:
        logger.debug("Getting server list...")
        st.get_servers()
        
        logger.debug("Selecting best server...")
        best_server = st.get_best_server()
        logger.info(f"Using server: {best_server['sponsor']} ({best_server['name']})")
        
    except Exception as e:
        logger.warning(f"Server selection failed, using auto-selection: {e}")

    try:
        logger.debug("Starting download test...")
        download_bps = st.download()
        download_mbps = download_bps / 1_000_000.0
        logger.debug(f"Download: {download_mbps:.2f} Mbps")
        
        logger.debug("Starting upload test...")
        upload_bps = st.upload(pre_allocate=False)
        upload_mbps = upload_bps / 1_000_000.0
        logger.debug(f"Upload: {upload_mbps:.2f} Mbps")
        
        logger.info(f"Speed test completed: {download_mbps:.2f}/{upload_mbps:.2f} Mbps")
        
        return {
            "download_mbps": round(download_mbps, 2), 
            "upload_mbps": round(upload_mbps, 2)
        }
        
    except Exception as e:
        logger.error(f"Speed test failed: {e}")
        return {"download_mbps": 0.0, "upload_mbps": 0.0}