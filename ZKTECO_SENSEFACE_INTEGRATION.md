# ZKTeco SenseFace 2A Integration

## Overview

The ZKTeco integration now supports both legacy ATTLOG format and newer SenseFace 2A device payloads.

## Supported Payload Formats

### 1. Legacy ATTLOG Format
```
ATTLOG:
1 102 2026-03-06 09:12:21 0 0 0
2 105 2026-03-06 09:15:05 0 0 0
```

### 2. SenseFace 2A Key=Value Format
```
~DeviceName=SenseFace 2A,MAC=00:17:61:13:23:42,TransactionCount=5634,~MaxAttLogCount=15,UserCount=24,...
```

## Payload Type Detection

The system automatically detects payload types:

- **attendance** - Attendance/check-in events
- **status** - Device status/config information
- **config** - Device configuration
- **user_sync** - User synchronization data
- **heartbeat** - Device heartbeat/ping
- **unknown** - Unrecognized format (still saved)

## Log Types

- `ATTLOG` - Legacy attendance logs
- `FACE` - Face recognition attendance
- `FINGERPRINT` - Fingerprint attendance
- `DEVICE_STATUS` - Device status information
- `DEVICE_CONFIG` - Device configuration
- `USER_SYNC` - User synchronization
- `HEARTBEAT` - Device heartbeat
- `OPERLOG` - Operation logs
- `USERINFO` - User information
- `OTHER` - Other/unknown

## Configuration

### Debug Mode

Enable debug mode to see full payload details for attendance events:

```env
ZKTECO_DEBUG_MODE=true
```

When enabled, the backend will print:
- Full raw payload for attendance events
- Parsed attendance event details (JSON)

## Data Storage

All payloads are stored in MongoDB with:

- **Full raw payload** - Complete original data from device
- **Parsed data** - Extracted structured information
- **Payload type** - Classification of payload
- **Log type** - Specific log category
- **Device info** - Device ID, SN, IP, User-Agent
- **Processing status** - Whether attendance was processed

## Attendance Event Parsing

For SenseFace devices, the parser looks for:
- `PIN` or `UserID` - User identifier
- `Time` or `DateTime` - Timestamp
- `Verify` or `VerifyMode` - Verification method
- `WorkCode` or `Work` - Work code

## Device Status Parsing

Device status payloads extract:
- `DeviceName` - Device model name
- `MAC` - MAC address
- `TransactionCount` - Total transactions
- `UserCount` - Number of users
- `MaxAttLogCount` - Maximum attendance log count
- And other device-specific fields

## Logging

The system logs:
- `[ZKTeco] CData received from device: ...`
- `[ZKTeco] Detected payload type: ...`
- `[ZKTeco] Parsed ... attendance logs/events`
- `[ZKTeco] Saved ... to database`
- `[ZKTeco] [DEBUG] ...` (when debug mode enabled)

## Error Handling

- Unknown payloads are saved with `payloadType: 'unknown'`
- Unparsed attendance events are saved with full raw data
- All errors are logged but don't break the flow
- Device always receives "OK" response

## Frontend Display

The ZKTeco logs page shows:
- Payload type badge
- Log type badge
- Full raw data (expandable)
- Parsed data (if available)
- Device information
- Processing status

## Testing

To test with a real device:

1. Configure device with server URL: `http://YOUR_SERVER_IP`
2. Enable ADMS/Push SDK mode
3. Enable debug mode: `ZKTECO_DEBUG_MODE=true`
4. Monitor backend logs for `[ZKTeco]` entries
5. Check frontend logs page for received data

## Troubleshooting

### No logs appearing
- Check device is configured correctly
- Verify Nginx routing `/iclock/*` to Express
- Check backend logs for `[ZKTeco]` entries
- Verify MongoDB connection

### Payloads saved as "unknown"
- Check raw data format in logs
- Verify parser logic matches your device format
- May need custom parser for your device model

### Attendance not processing
- Verify employee codes match device user IDs
- Check parsed data contains userId and timestamp
- Review error field in logs for processing errors
