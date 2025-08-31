from __future__ import annotations

import os
import tempfile

from link.storage import db as sdb


def test_db_insert_and_fetch_latest():
    fd, path = tempfile.mkstemp()
    os.close(fd)
    try:
        sdb.init_db(path)
        row_id = sdb.insert_result(path, 10.0, 5.0, 20.0, 2.0)
        assert row_id > 0
        latest = sdb.fetch_latest(path)
        assert latest is not None
        assert latest.download_mbps == 10.0
        assert latest.upload_mbps == 5.0
        assert latest.latency_ms == 20.0
        assert latest.jitter_ms == 2.0
    finally:
        os.remove(path) 