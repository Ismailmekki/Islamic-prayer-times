/**
 * iOS WebClip (.mobileconfig) Profile Generator and Offline Installer Utilities
 * Provides direct download of iOS installation profile (equivalent to IPA for web apps)
 * and APK generation helpers for Android.
 */

export async function downloadIOSWebClipProfile(appName = 'صلاتي', appUrl?: string): Promise<boolean> {
  const url = appUrl || (typeof window !== 'undefined' ? window.location.href.split('?')[0].split('#')[0] : '');

  let base64Icon = '';
  try {
    const res = await fetch('/apple-touch-icon.png');
    if (res.ok) {
      const blob = await res.blob();
      base64Icon = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1] || '';
          resolve(base64);
        };
        reader.onerror = () => resolve('');
        reader.readAsDataURL(blob);
      });
    }
  } catch (err) {
    console.warn('Could not read icon for profile:', err);
  }

  const profileXml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        <dict>
            <key>FullScreen</key>
            <true/>
            ${base64Icon ? `<key>Icon</key><data>${base64Icon}</data>` : ''}
            <key>IsRemovable</key>
            <true/>
            <key>Label</key>
            <string>${appName}</string>
            <key>PayloadDescription</key>
            <string>تثبيت تطبيق ${appName} على الشاشة الرئيسية للآيفون</string>
            <key>PayloadDisplayName</key>
            <string>${appName}</string>
            <key>PayloadIdentifier</key>
            <string>com.salati.app.webclip</string>
            <key>PayloadType</key>
            <string>com.apple.webclip.managed</string>
            <key>PayloadUUID</key>
            <string>98E4B8AC-2C3E-4B02-B791-3E55B39A01B4</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            <key>Precomposed</key>
            <true/>
            <key>URL</key>
            <string>${url}</string>
        </dict>
    </array>
    <key>PayloadDescription</key>
    <string>تطبيق صلاتي - مواقيت الصلاة والأذان والقبلة والسبحة</string>
    <key>PayloadDisplayName</key>
    <string>${appName} - تطبيق الصلاة والأذان</string>
    <key>PayloadIdentifier</key>
    <string>com.salati.app.profile</string>
    <key>PayloadOrganization</key>
    <string>صلاتي</string>
    <key>PayloadRemovalDisallowed</key>
    <false/>
    <key>PayloadType</key>
    <string>Configuration</string>
    <key>PayloadUUID</key>
    <string>56B3A8AC-4D1E-4E02-A791-9F55C39B02C8</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
</dict>
</plist>`;

  try {
    const blob = new Blob([profileXml], { type: 'application/x-apple-aspen-config' });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = 'salati-ios-install.mobileconfig';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);
    return true;
  } catch (err) {
    console.error('Failed to download mobileconfig:', err);
    return false;
  }
}

export function getPWABuilderUrl(appUrl?: string): string {
  const url = appUrl || (typeof window !== 'undefined' ? window.location.href.split('?')[0].split('#')[0] : '');
  return `https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(url)}`;
}

export function downloadOfflineLauncher(appName = 'صلاتي', appUrl?: string): void {
  const url = appUrl || (typeof window !== 'undefined' ? window.location.href.split('?')[0].split('#')[0] : '');
  const htmlContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${appName} - مشغل التطبيق السريع</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0c0a09; color: #fff; text-align: center; padding: 2rem; }
    .card { max-width: 400px; margin: 50px auto; background: #1c1917; padding: 30px; border-radius: 20px; border: 1px solid #059669; }
    h2 { color: #34d399; margin-bottom: 10px; }
    p { color: #a8a29e; font-size: 14px; line-height: 1.6; }
    .btn { display: inline-block; background: #059669; color: #fff; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold; margin-top: 20px; }
    .btn:hover { background: #10b981; }
  </style>
</head>
<body>
  <div class="card">
    <h2>🕌 تطبيق ${appName}</h2>
    <p>مشغل سريع لتطبيق مواقيت الصلاة والأذان الشامل بدون أي إعلانات.</p>
    <a href="${url}" class="btn" target="_blank" rel="noopener">فتح تطبيق صلاتي الآن ↗</a>
  </div>
  <script>
    // Auto redirect
    setTimeout(function() { window.location.href = "${url}"; }, 1000);
  </script>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = 'salati-quick-launcher.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);
}
