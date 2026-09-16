# Fully Custom Deep Linking Plan

## 1. On-The-Fly URL Wrapping (Free URL Shortener)
We use the free `is.gd` API in `games.js` to turn `https://syedszr.github.io/ZeroApp/?shared=1#detail?id=g-254` into a short link like `https://is.gd/xyz123`.

## 2. Triggering Unity's Native Share
The web app sends the short link to UniWebView:
```javascript
// Inside games.js
const longUrl = `${window.location.origin}${window.location.pathname}?shared=1#detail?id=${game.id}`;
const response = await fetch(`https://is.gd/create.php?format=json&url=${encodeURIComponent(longUrl)}`);
const data = await response.json();
const wrappedLink = data.shorturl || longUrl; 

window.location.href = `uniwebview://share?title=${encodeURIComponent(game.name)}&url=${encodeURIComponent(wrappedLink)}`;
```

## 3. Unity Implementation (C#)
Add this to your UniWebView code to catch the message and open the native share sheet:

```csharp
// 1. Handle Share Message
webView.OnMessageReceived += (view, message) => {
    if (message.Path.Equals("share")) {
        string title = WWW.UnEscapeURL(message.Args["title"]);
        string url = WWW.UnEscapeURL(message.Args["url"]);
        new NativeShare().SetText("Check out " + title + " on ZeroApp!").SetUrl(url).Share(); 
    }
};

// 2. Catch Incoming Deep Link (from WhatsApp)
Application.deepLinkActivated += (url) => {
    if (url.Contains("#detail?id=")) {
        string hash = url.Substring(url.IndexOf("#"));
        webView.Load("https://syedszr.github.io/ZeroApp/" + hash);
    }
};
```

## 4. The Smart Redirect Flow (index.html)
When a user clicks `https://is.gd/xyz123`, the browser redirects them to GitHub Pages. `index.html` runs a script checking if they are on Android or iOS.
- **Android**: Redirects to `intent://...package=com.ownGames.zeroapp;end`. Opens the app if installed, otherwise opens the Play Store.
- **iOS**: Redirects to `zeroapp://`. If it fails, falls back to the App Store after 1.5 seconds.
