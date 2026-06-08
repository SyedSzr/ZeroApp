# ZeroApp — Session Notes
Last Updated: 2026-06-06

---

## 🔧 Project Stack
- **Frontend**: React (via Babel standalone) + TailwindCSS CDN — no build step
- **Backend**: Supabase (tables: `apps`, `games`, `categories`, `settings`, `promotions`, `profiles`)
- **Mobile**: Unity + UniWebView (renders this web app as Android app)
- **Branch**: `master` (diverged from `main`)
- **Local Server**: `npx -y serve -p 3000` in `/Users/tekrevol/App Project/ZeroApp/ZeroApp`

---

## ✅ Completed This Session

### 1. Games-Only Mode
- Hidden apps tab from bottom nav
- All screens now show only games
- Apps tab click → shows same screen as Games Discovery
- Explore tab → shows games only

### 2. Tab Renaming
- "Feed" tab renamed to **"Play"** across all 9 languages:
  - English, Spanish, French, Chinese, German, Urdu, Hindi, Bengali, Arabic
- Files changed: `js/store.js`

### 3. Developer Screen (NEW)
- New file: `js/screens/developer.js`
- Clicking developer name on Play feed → navigates to DeveloperScreen
- Shows all games by that developer in a 2-column grid
- Registered in `index.html` and `js/app.js`

### 4. Theme Fix — Discovery Header
- Home/Games screen header text now respects light/dark theme
- Dark mode: white text | Light mode: dark text
- File: `js/screens/games.js`

### 5. Home Screen Updates
- Header made consistent with Play screen
- Bell icon replaced with Search icon in Home screen

---

## 🐛 Known Issue — Developer Screen Blank on Mobile

**Symptom**: Clicking developer name on mobile shows blank screen

**Likely Causes**:
1. `window.DeveloperScreen` not registered before `app.js` loads
2. Babel parse error in `developer.js` on mobile browser

**Fix Attempted**: 
- Added `window.DeveloperScreen = DeveloperScreen;` at bottom of `developer.js`
- Script load order in `index.html`: developer.js loads before app.js ✅

**Next Debug Step**:
- Check mobile browser console logs
- Test URL: `http://YOUR_IP:3000/#developer?dev=ZeroApp%20Studios`

---

## 📁 Key Files Modified

| File | What Changed |
|------|-------------|
| `js/store.js` | Tab names, routing params (`dev=`), deep link hydration |
| `js/app.js` | Added `developer` case to route map |
| `js/screens/games.js` | Developer name clickable, share button, theme fixes |
| `js/screens/developer.js` | **NEW** — Developer games screen |
| `js/screens/home.js` | Header & search icon update |
| `js/screens/explore.js` | Games-only filter |
| `index.html` | Added developer.js script tag |

---

## 🗺️ Routing System (How Navigation Works)

```js
// Navigate to a screen
go('developer', { developer: 'ZeroApp Studios' })
go('detail', { detailApp: gameObject })
go('games')   // Play feed
go('explore') // Discovery

// URL hash format
#games              → Play feed
#developer?dev=Name → Developer screen
#detail?id=123      → Game detail
```

All routing lives in `js/store.js` — `go()`, `goBack()`, initial hydration useEffect.

---

## 📋 TODO — Tomorrow's Work

### Priority 1: Localization Updates (1-2 hrs, web only)
Add these missing translation keys to `js/store.js` for all 9 languages:
- `share`, `share_game`, `link_copied`
- `notifications`, `notification_on`, `notification_off`
- `premium`, `remove_ads`, `upgrade_to_premium`
- `no_games_found`, `loading_games`, `open_in_app`

### Priority 2: Deep Linking (Android) (2-3 hrs)
**Web side** — Fix `handleShare()` in `js/screens/games.js`:
```js
// Current (broken — appends share text to URL)
const deepLink = `${origin}${path}#games?gameId=${game.id}`;

// Fix — use detail route with clean ID
const deepLink = `${origin}/#detail?id=${game.id}`;
// Native: zeroapp://detail?id=${game.id}
```

**Android/Unity side** — Add to `AndroidManifest.xml`:
```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="zeroapp" />
</intent-filter>
```

**Unity C# handler**:
```csharp
void Start() {
    string url = Application.absoluteURL;
    if (!string.IsNullOrEmpty(url)) {
        string webUrl = url.Replace("zeroapp://", "https://yourhost/#");
        webView.Load(webUrl);
    }
}
Application.deepLinkActivated += (url) => {
    webView.Load(url.Replace("zeroapp://", "https://yourhost/#"));
};
```

### Priority 3: Push Notifications (4-6 hrs)
1. Add `push_token` column to Supabase `profiles` table
2. Add Firebase SDK to Unity project
3. Add `google-services.json` (download from Firebase Console)
4. C# captures FCM token → JS bridge → save to Supabase
5. Add `NotificationBanner` component to `js/components.js`
6. Add notification toggle to Profile screen
7. Admin panel: add "Send Notification" UI

**JS Bridge Pattern**:
```js
// Called by Unity when token is ready
window.onPushTokenReceived = function(token) { /* save to supabase */ }

// Called by Unity when notification arrives
window.onPushNotificationReceived = function(title, body, data) { /* show banner */ }
```

### Priority 4: Payment / AdMob (3-5 hrs)
- AdMob Unity SDK for ads (rewarded before game launch)
- Optional: Google Play IAP for "Remove Ads" purchase
- Add Premium badge + upgrade UI to Profile screen

---

## 🌐 Supabase Info
- URL: `https://sjotifqahfcylcooaqxm.supabase.co`
- Tables: `apps`, `games`, `categories`, `settings`, `promotions`, `profiles`
- Publishable key in `js/store.js` line 12

---

## 📱 Git Status
- Branch: `master`
- Last commits (local, NOT pushed):
  - `22f3100` Make discovery header text theme-responsive
  - `26ba80e` Add developer screen component
  - `73cfad3` Make developer name clickable on Play feed
  - `1ec1f73` Rename Feed tab to Play in all languages
  - `815389c` Hide apps and show only games
- **Do NOT push until developer blank screen is fixed**

---

## 💡 Quick Commands

```bash
# Start local server
cd "/Users/tekrevol/App Project/ZeroApp/ZeroApp"
npx -y serve -p 3000

# Check git status
git log --oneline -10

# Push when ready
git push origin master
```
