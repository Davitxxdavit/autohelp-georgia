# Manual device tests

Run these on a real phone after map, GPS, or permission changes. Do **not** repeat API lifecycle checks — `python scripts/staging_smoke_test.py --all` covers those.

1. Android location permission popup appears for Start Driving (and customer request GPS).
2. Android “Turn on location?” / location-services system dialog appears when GPS is off.
3. User can turn GPS off and on; the app does not invent coordinates.
4. Physically moving the mechanic device moves the customer’s mechanic marker.
5. Map tiles render on iOS and Android (Expo Go vs a production build if you ship one).
6. Route polyline follows roads when routing is available (not a straight line presented as a road).
7. Call customer / call mechanic opens the phone dialer (`tel:`).
8. Locking the phone or backgrounding the mechanic app stops or pauses foreground GPS (expected MVP limit).
9. Layout on a real device: tracking card, map, ETA, buttons, and safe areas.

Optional: deny permission, cancel the Android enable-location dialog, then Retry / Open Settings.
