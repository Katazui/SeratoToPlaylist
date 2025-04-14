# 🎧 Serato To Playlist 🎹

A powerful tool to convert your DJ history exports (from Serato) to Spotify and Apple Music playlists.

## ✨ Features

- 📊 Upload Serato/Other DJ Software CSV history exports
- 🔄 Automatic matching of tracks across multiple music services:
  - 🟢 Spotify
  - 🔴 Apple Music
  - 🟣 MusicBrainz
  - 🟡 Discogs
  - 🔵 Last.fm
- 📱 Visual indicators for match confidence
- 🔍 Filter and search through tracks
- ✅ Select/deselect tracks before creating a playlist
- 📝 Creates playlists on your preferred music service
- 📋 Export results as CSV or JSON
- ⚙️ Configurable API settings

## 🚀 Setup

1. Clone this repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a Spotify Developer App:

   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
   - Create a new application
   - Note your Client ID and Client Secret
   - Set the Redirect URI to `http://127.0.0.1:3000` (use IP address rather than localhost)

4. (Optional) Create accounts for other music services:

   - [Last.fm API](https://www.last.fm/api/)
   - [Discogs API](https://www.discogs.com/settings/developers)
   - Apple Music Developer Token requires an Apple Developer account

5. Configure environment variables:

   - Copy the `.env.example` file to `.env` in the project root
   - Update the `.env` file with your music service credentials

6. Build the frontend:

   ```bash
   npm run build
   ```

7. Start the application (includes both server and frontend):

   ```bash
   npm start
   ```

8. Open your browser to `http://127.0.0.1:3001`

## 💻 Development Mode

If you want to run the app in development mode:

1. Start the server in one terminal:

   ```bash
   npm run server
   ```

2. Start the Vite dev server in another terminal:

   ```bash
   npm run dev
   ```

3. Open your browser to `http://127.0.0.1:3000`

## 📖 How to Use

1. Export your DJ history as a CSV file:

   - In your DJ software, locate the history/library panel
   - Select the session you want to export
   - Click "Export" and save as CSV

2. Open the Convert To Playlist app in your browser

3. Login with your preferred music service account

4. Upload your CSV file

5. Review the matches:

   - Green: High confidence match
   - Yellow: Possible match, but not certain
   - Red: No match found

6. Use the filters to focus on specific groups of tracks:

   - "All" shows all tracks
   - "Matched" shows only tracks that were found
   - "Unmatched" shows only tracks that couldn't be found
   - Filter by specific music services

7. Search for specific tracks using the search box

8. Select/deselect tracks you want to include in your playlist
   (by default, all matched tracks are selected)

9. Enter a name for your playlist (or use the default name)

10. Click "Create Playlist" to create a new playlist on your music service

## 🛠️ Troubleshooting

- **Insecure Redirect URI error**: Make sure you're using `http://127.0.0.1:3000` as the redirect URI in your Spotify Dashboard, not `localhost`.

- **Authentication errors**: The app uses Authorization Code Flow with PKCE for secure authentication.

- **Rate Limit Issues**: Some music APIs have strict rate limits. The app includes rate limit management, but you might need to enable the "Bypass Rate Limits" option if you're working with large libraries (use with caution).

## ⚙️ How It Works

The app uses the following process to match tracks:

1. Parses the CSV export
2. Cleans track and artist names (removing DJ annotations, etc.)
3. Searches for each track on multiple music services
4. Prioritizes services based on match difficulty and rate limits
5. Displays the results and lets you review them
6. Creates a playlist with the selected tracks on your preferred service

## 🧰 Technology Stack

- Frontend: React, Vite, styled-components
- Backend: Express.js
- APIs: Spotify Web API, Apple Music API, MusicBrainz, Discogs, Last.fm
- Data Parsing: PapaParse for CSV

## 📜 License

MIT

## ☕ Support the Developer

If you find this tool useful, consider buying me a coffee!

[<img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" width="150">](https://buymeacoffee.com/katazui)
