# ZKTeco Device Integration

This module handles integration with ZKTeco biometric attendance devices using the Push SDK protocol (ADMS mode).

## Overview

ZKTeco devices configured in ADMS (Advanced Device Management System) mode push attendance data to the server automatically. This module provides the necessary endpoints to receive and process this data.

## Endpoints

### `GET /iclock/ping`
Health check endpoint. Devices ping this endpoint to verify server connectivity.

**Response:** Plain text `OK`

### `POST /iclock/cdata`
Receives attendance data from the device. Accepts raw text data in ATTLOG format.

**Request Format:**
```
ATTLOG:
1 102 2026-03-06 09:12:21 0 0 0
2 105 2026-03-06 09:15:05 0 0 0
```

**Response:** Plain text `OK`

### `GET /iclock/getrequest`
Device requests commands/data from the server. Currently returns empty response (no pending commands).

**Response:** Plain text (empty or command string)

### `GET /iclock/devicecmd`
Device command endpoint for device management.

**Response:** Plain text `OK`

## Data Flow

1. Device sends attendance data via `POST /iclock/cdata`
2. Service parses ATTLOG format
3. Maps device `user_id` to employee (by `employeeCode`, `employeeNumber`, or `empNo`)
4. Saves raw log to `ZKTecoDeviceLog` collection
5. Creates/updates `AttendanceRecord` for the employee
6. Returns `OK` to device

## Database Models

### ZKTecoDeviceLog
Stores raw device logs with parsed data:
- `deviceId`: Device identifier
- `deviceSn`: Device serial number
- `logType`: Type of log (ATTLOG, OPERLOG, etc.)
- `rawData`: Original raw data from device
- `parsedData`: Parsed attendance information
- `employeeId`: Linked employee (if found)
- `processed`: Whether attendance record was created
- `ipAddress`: Device IP address
- `userAgent`: Device user agent

### AttendanceRecord
Standard attendance records are created/updated based on device logs.

## Employee Mapping

The system attempts to match device `user_id` to employees in this order:
1. `employeeCode` (uppercase match)
2. `employeeNumber` (uppercase match)
3. `empNo` (uppercase match)

**Important:** Ensure employee codes in your system match the user IDs configured in the ZKTeco device.

## Logging

All device connections and data processing are logged to the console with `[ZKTeco]` prefix:
- Device connections (ping, getrequest, devicecmd)
- Data reception (cdata)
- Parsing results
- Database operations
- Errors

## Configuration

No additional configuration required. The module uses the existing MongoDB connection and employee/attendance models.

## Troubleshooting

### Device receives 404
- Ensure routes are registered at `/iclock/*` (not under `/api/v1`)
- Check server is running and accessible from device network
- Verify device server URL is correct (e.g., `http://100.29.7.215`)

### Attendance not being saved
- Check device logs in `ZKTecoDeviceLog` collection
- Verify employee codes match between device and system
- Check console logs for parsing errors
- Verify MongoDB connection is working

### Data format issues
- ZKTeco devices send raw text, not JSON
- Ensure `/iclock/cdata` route has raw body parser middleware
- Check ATTLOG format matches expected structure

## Future Enhancements

- Device command queue for sending commands to devices
- User synchronization (push employee data to devices)
- Device settings management
- Multi-device support with device registration
- Real-time attendance dashboard
- Attendance reconciliation and conflict resolution
