export const BOOKMARKLET_SOURCE = `
(function() {
  var reels = [];
  var seen = {};
  document.querySelectorAll('a[href*="/reel/"]').forEach(function(el) {
    var path = el.getAttribute('href').split('?')[0];
    if (path.startsWith('/reel/') && !seen[path]) {
      seen[path] = true;
      reels.push('https://www.instagram.com' + path);
    }
  });
  var payload = JSON.stringify({ v: 1, reels: reels });
  navigator.clipboard.writeText(payload).then(function() {
    var t = document.createElement('div');
    t.setAttribute('style', [
      'position:fixed','top:16px','left:50%',
      'transform:translateX(-50%)',
      'background:#facc15','color:#000',
      'padding:12px 24px',
      'border-radius:8px',
      'border:3px solid #000',
      'font-weight:900',
      'font-size:16px',
      'z-index:2147483647',
      'box-shadow:4px 4px 0 #000'
    ].join(';'));
    t.textContent = '\\u2705 ' + reels.length + ' Reels copied! Paste in the game.';
    document.body.appendChild(t);
    setTimeout(function() { t.remove(); }, 3500);
  });
})();
`

export function getBookmarkletHref(): string {
  return `javascript:${encodeURIComponent(BOOKMARKLET_SOURCE.trim())}`
}

