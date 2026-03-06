# ZKTeco Device Debugging Guide

## Understanding Device Behavior

### Current Situation Analysis

Based on your observations:

1. **Device is connected** ✅
   - Device successfully calls `GET /iclock/cdata` (handshake)
   - Device sends status/config payloads via `POST /iclock/cdata`
   - Transaction count increases locally on device

2. **Attendance not uploading** ⚠️
   - No attendance events received via POST
   - Device records attendance locally (transaction count increases)
   - Only status/config payloads are being sent

### Server-Side Interpretation

**What's happening:**
- The device is successfully connecting to your server
- The device is sending periodic status updates (device info, transaction counts)
- The device is **NOT** uploading actual attendance transaction data

**Why this might be happening:**

1. **Device Configuration Issue**
   - Push Options may not be enabled for attendance transactions
   - Transaction upload settings may be disabled
   - Device may be in "status only" mode

2. **Protocol Mismatch**
   - SenseFace devices may use different endpoints for attendance
   - May require specific query parameters to trigger upload
   - May need device-side command to enable uploads

3. **Timing/Trigger Issue**
   - Device may only upload on schedule (not real-time)
   - May require manual trigger or specific conditions
   - May need acknowledgment from server first

## Enhanced Logging

The system now logs all requests with clear prefixes:

### Request Types

- `[HANDSHAKE]` - GET requests (ping, cdata GET, getrequest, devicecmd)
- `[PAYLOAD]` - POST requests with actual data
- `[STATUS/CONFIG]` - Device status/config payloads
- `[ATTENDANCE]` - Attendance/event payloads
- `[HEARTBEAT]` - Heartbeat/ping payloads
- `[COMMAND]` - Command-related requests
- `[TRACKER]` - Transaction count tracking

### What to Look For

**In Backend Logs:**

1. **Transaction Count Increases:**
   ```
   [ZKTeco] [TRACKER] Device NYU7253000143: Transaction count increased from 5634 to 5635 (+1)
   [ZKTeco] [TRACKER] ⚠️  WARNING: Device transaction count increased but no attendance payload received!
   ```

2. **Status Updates:**
   ```
   [ZKTeco] [STATUS/CONFIG] Parsed device status: { transactionCount: 5635, ... }
   ```

3. **Attendance Events (if received):**
   ```
   [ZKTeco] [ATTENDANCE] ✅ Parsed SenseFace attendance event: User 102 at 2026-03-06T09:12:21Z
   ```

## Device Configuration Checklist

### SenseFace 2A Configuration Steps

1. **Access Device Web Interface**
   - Navigate to `http://<device-ip>` (usually 192.168.1.10)
   - Login with admin credentials

2. **Communication Settings**
   - Go to **Communication** → **Push SDK** or **ADMS**
   - Verify Server URL: `http://100.29.7.215`
   - Verify Server Port: `80` (or `443` if using HTTPS)

3. **Push Options** (CRITICAL)
   - Enable **"Push Attendance"** or **"Upload Transactions"**
   - Enable **"Real-time Upload"** (if available)
   - Set **Push Interval**: Check if set to reasonable value (e.g., 1 minute)
   - Verify **"Push Options Flag"** is enabled

4. **Transaction Upload Settings**
   - Check **"Upload Attendance Logs"**
   - Check **"Upload Immediately"** or **"Real-time Upload"**
   - Verify **"Transaction Upload"** is enabled
   - Check **"Auto Upload"** settings

5. **Device Type Settings**
   - Verify **DeviceType** is set correctly (should be "att" for attendance)
   - Check **Push Version** compatibility

### Common Issues

**Issue: Device sends status but not attendance**
- **Solution**: Enable "Push Attendance" or "Transaction Upload" in device settings
- **Solution**: Check "Push Options Flag" is set to 1
- **Solution**: Verify device is not in "Status Only" mode

**Issue: Transaction count increases but no uploads**
- **Solution**: Device may need manual trigger to upload
- **Solution**: Check if device requires specific command to enable uploads
- **Solution**: Verify device firmware supports real-time uploads

**Issue: Device uploads on schedule only**
- **Solution**: Enable "Real-time Upload" or "Immediate Upload"
- **Solution**: Reduce push interval to minimum (1 minute)
- **Solution**: Check if device has "Upload on Punch" option

## Debugging Steps

### Step 1: Monitor Backend Logs

Watch for these patterns:

```bash
# Watch all ZKTeco logs
pm2 logs zyberhr-backend | grep "\[ZKTeco\]"

# Watch for transaction count changes
pm2 logs zyberhr-backend | grep "\[TRACKER\]"

# Watch for attendance events
pm2 logs zyberhr-backend | grep "\[ATTENDANCE\]"
```

### Step 2: Check Device State

The tracker service maintains device state. Check logs for:
- Transaction count changes
- Last attendance received timestamp
- Status update frequency

### Step 3: Verify Device Configuration

1. Check device web interface for:
   - Push SDK/ADMS enabled
   - Attendance upload enabled
   - Real-time upload enabled

2. Check device query parameters in GET requests:
   - `PushOptionsFlag=1` (should be 1)
   - `DeviceType=att` (should be "att")
   - `options=all` (may need to be "attlog" or "transaction")

### Step 4: Test Manual Upload

Some devices support manual upload trigger:
- Check device web interface for "Upload Now" or "Sync Now" button
- Try triggering manual upload after a test punch
- Monitor logs to see if attendance payload arrives

## Expected Behavior

### Normal Flow

1. **Device connects:**
   ```
   [ZKTeco] [HANDSHAKE] GET /iclock/cdata from device: NYU7253000143
   ```

2. **Device sends status:**
   ```
   [ZKTeco] [STATUS/CONFIG] Parsed device status: { transactionCount: 5634, ... }
   [ZKTeco] [TRACKER] Device NYU7253000143: Transaction count: 5634
   ```

3. **User punches in:**
   - Device records locally (transaction count increases to 5635)

4. **Device uploads attendance:**
   ```
   [ZKTeco] [ATTENDANCE] ✅ Parsed SenseFace attendance event: User 102 at ...
   [ZKTeco] [TRACKER] Attendance received for device NYU7253000143
   ```

### Current Flow (Issue)

1. **Device connects:** ✅
2. **Device sends status:** ✅
3. **User punches in:** ✅ (transaction count increases)
4. **Device uploads attendance:** ❌ (missing)

## Recommendations

### Immediate Actions

1. **Check Device Settings:**
   - Verify "Push Attendance" is enabled
   - Verify "Real-time Upload" is enabled
   - Check "Push Options Flag" in query params

2. **Monitor Transaction Count:**
   - Watch for transaction count increases
   - Check if increases correlate with actual punches
   - Verify if attendance arrives after count increases

3. **Check Device Firmware:**
   - Verify firmware version supports real-time uploads
   - Check if firmware update is needed
   - Verify Push SDK version compatibility

### Device-Specific Settings

For SenseFace 2A devices, check:

- **Communication** → **Push SDK** → **Push Options**
  - Enable: "Push Attendance Log"
  - Enable: "Real-time Push"
  - Set: Push Interval = 1 minute (minimum)

- **System** → **Data Management**
  - Enable: "Auto Upload"
  - Enable: "Upload on Transaction"

### Alternative Approaches

If real-time upload doesn't work:

1. **Scheduled Upload:**
   - Device may upload on schedule (e.g., every hour)
   - Monitor logs during scheduled times

2. **Manual Trigger:**
   - Some devices require manual upload trigger
   - Check device interface for upload button

3. **Different Endpoint:**
   - Some devices use `/iclock/getrequest` to receive upload commands
   - May need to send command to trigger upload

## Monitoring Commands

```bash
# Watch all ZKTeco activity
pm2 logs zyberhr-backend --lines 100 | grep "\[ZKTeco\]"

# Count status updates vs attendance events
pm2 logs zyberhr-backend | grep "\[STATUS/CONFIG\]" | wc -l
pm2 logs zyberhr-backend | grep "\[ATTENDANCE\]" | wc -l

# Watch transaction count changes
pm2 logs zyberhr-backend | grep "transaction count"
```

## Next Steps

1. **Enable enhanced logging** (already done)
2. **Monitor logs** for transaction count changes
3. **Check device configuration** for upload settings
4. **Test manual upload** if available
5. **Contact ZKTeco support** if device settings don't resolve issue

The enhanced logging will help identify:
- When transaction counts increase
- Whether attendance payloads are being sent but not recognized
- Device communication patterns
- Missing upload triggers
