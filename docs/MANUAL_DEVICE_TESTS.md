# Manual device tests

Run these **once** on real phones after staging `python scripts/staging_smoke_test.py --all` is green. Do **not** repeat API lifecycle, quotes, ratings, earnings math, or routing availability — the smoke test covers those.

## Customer

1. Registration and login screens, including the country picker.
2. Add / edit vehicle UI (nickname and primary come from the backend).
3. Close and reopen the app during an in-progress request: it resumes Searching / Found / Tracking from the backend request, not a stale local UUID. GPS is not recaptured.
4. Map tiles render. The mechanic marker moves with the mechanic phone.
5. ETA and distance look like live values (not a frozen 2.3 km / 7 min).
6. Quote approve/reject UI on Auto Key.
7. Call mechanic opens the system dialer.
8. History and request-detail screens show readable local dates.
9. Profile first-name edit; phone is read-only.

## Mechanic

1. Registration, pending screen, and pull-to-refresh after admin approval.
2. “Services I provide” toggles; offers stop matching unselected services.
3. Android location permission and the native “Turn on location?” dialog.
4. Map tiles; Start Driving / Arrive / quote / complete on a physical device.
5. Call customer opens the dialer.
6. Earnings, job history, and profile first-name edit.
7. After restart during an active job, Home shows Active job → Continue (no second accept).

## Physical / hardware

1. Move the mechanic phone and watch the customer marker follow.
2. Turn GPS off/on; the app does not invent coordinates.
3. Close and reopen **both** apps during an active request.
4. Route polyline follows roads visually (not a fake straight line presented as a road).
5. Layout, safe areas, tracking card, and map on a real screen.
6. Locking or backgrounding the mechanic app pauses foreground GPS (expected MVP limit).

Optional: deny permission, cancel the enable-location dialog, then Retry / Open Settings.
