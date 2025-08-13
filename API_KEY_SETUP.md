# Google Maps API Key Setup for GitHub Pages

## Current Issue
The Google Maps API key is restricted and doesn't allow access from GitHub Pages URL.

**Error**: `RefererNotAllowedMapError`
**Your GitHub Pages URL**: `https://erikgalvansrb2-source.github.io/telenor/`

## Fix Instructions

### Step 1: Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/apis/credentials
2. Find your API key: `AIzaSyCVCP7JXnHdf3LUt-WE9uMVpzRuW6dlUYo`
3. Click on the API key name to edit it

### Step 2: Configure HTTP Referrers
1. Under **Application restrictions**, select **HTTP referrers (web sites)**
2. Click **Add an item**
3. Add these referrers:
   ```
   https://erikgalvansrb2-source.github.io/*
   http://localhost:*/*
   ```

### Step 3: Verify API Restrictions
1. Under **API restrictions**, ensure **Maps JavaScript API** is selected
2. Click **Save**

### Step 4: Test
1. Wait 5-10 minutes for changes to take effect
2. Visit your GitHub Pages site: https://erikgalvansrb2-source.github.io/telenor/
3. Grant location permission when prompted
4. The map should now load correctly

## Alternative Solution

If you prefer not to modify the API key restrictions, you can:

1. **Create a new API key** specifically for GitHub Pages
2. **Replace the key** in `app.js` line 8:
   ```javascript
   const GOOGLE_MAPS_API_KEY = 'your_new_unrestricted_key';
   ```

## Security Note

For production deployment, always restrict API keys to specific domains to prevent unauthorized usage and unexpected billing charges.

## Troubleshooting

**Still not working?**
- Check browser developer console for errors
- Verify the exact GitHub Pages URL matches the referrer
- Ensure Maps JavaScript API is enabled in Google Cloud Console
- Wait up to 10 minutes after making changes