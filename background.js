chrome.runtime.onInstalled.addListener(function(details) {
  /* other 'reason's include 'update' */
  if (details.reason === 'install') {
      const uninstallUrlLink = 'https://forms.gle/RGDDTWCDQrHUsgnq5';
      if (chrome.runtime.setUninstallURL) {
          chrome.runtime.setUninstallURL(uninstallUrlLink);
      }

      chrome.storage.sync.set({'enablePreview': true}, ()=>{});
      chrome.storage.sync.set({'anonymousID': generateAnonymousID()}, ()=>{});
  }
});

const generateAnonymousID = () => {
  return `AN${(new Date()).getTime().toString(16).toUpperCase()}${Math.floor(Math.random() * 4096).toString(16).toUpperCase()}`;
}