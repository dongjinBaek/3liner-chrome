chrome.runtime.onInstalled.addListener(function(details) {
  /* other 'reason's include 'update' */
  if (details.reason === 'install') {
      const uninstallUrlLink = 'https://forms.gle/RGDDTWCDQrHUsgnq5';
      if (chrome.runtime.setUninstallURL) {
          chrome.runtime.setUninstallURL(uninstallUrlLink);
      }

      chrome.storage.sync.set({'enablePreview': false}, ()=>{});
      chrome.storage.sync.set({'anonymousID': generateAnonymousID()}, ()=>{});
      chrome.storage.sync.set({'previewLocation': 'below-link'}, ()=>{});
      chrome.storage.sync.set({'previewNumSections': 'show-one'}, ()=>{});
      chrome.storage.sync.set({'previewSection': 'summary'}, ()=>{});

      chrome.tabs.create({ url: `https://quaint-nurse-0a4.notion.site/3-Liner-cec53681714047719ee8f2674e4d4538` });
      
    }
});

const generateAnonymousID = () => {
  return `AN${(new Date()).getTime().toString(16).toUpperCase()}${Math.floor(Math.random() * 4096).toString(16).toUpperCase()}`;
}