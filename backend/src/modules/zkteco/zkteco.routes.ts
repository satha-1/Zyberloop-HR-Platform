import { Router } from 'express';
import { ping, cdata, cdataGet, getrequest, devicecmd } from './zkteco.controller';

const router = Router();

/**
 * ZKTeco Push SDK Protocol Routes
 * 
 * These routes handle communication with ZKTeco biometric devices
 * configured in ADMS (Advanced Device Management System) mode.
 * 
 * Protocol Documentation:
 * - Devices send attendance data via POST /iclock/cdata
 * - Devices check for commands via GET /iclock/getrequest
 * - Devices send commands via GET /iclock/devicecmd
 * - Devices ping server via GET /iclock/ping
 */

// Health check endpoint - must return plain text "OK"
router.get('/ping', ping);

// CData endpoint - handles both GET (handshake) and POST (payload)
// GET: Device handshake/query - returns "OK"
// POST: Device sends attendance data - processes and returns "OK"
router.get('/cdata', cdataGet);
router.post('/cdata', cdata);

// Device requests commands/data from server
router.get('/getrequest', getrequest);

// Device command endpoint
router.get('/devicecmd', devicecmd);

export const zktecoRouter = router;
