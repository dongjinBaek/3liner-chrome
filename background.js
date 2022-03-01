chrome.runtime.onInstalled.addListener(function(details) {
  /* other 'reason's include 'update' */
  if (details.reason === 'install') {
      const uninstallUrlLink = 'https://forms.gle/RGDDTWCDQrHUsgnq5';
      if (chrome.runtime.setUninstallURL) {
          chrome.runtime.setUninstallURL(uninstallUrlLink);
      }

      //TODO: update 끝나면 Install 안으로 옮기기
      chrome.storage.sync.set({'enablePreview': true}, ()=>{});
      chrome.storage.sync.set({'anonymousID': generateAnonymousID()}, ()=>{});
      chrome.storage.sync.set({'previewLocation': 'top-right'}, ()=>{});
      chrome.storage.sync.set({'previewNumSections': 'show-one'}, ()=>{});
    }
    chrome.storage.sync.set({'previewSection': 'summary'}, ()=>{});

});

const generateAnonymousID = () => {
  return `AN${(new Date()).getTime().toString(16).toUpperCase()}${Math.floor(Math.random() * 4096).toString(16).toUpperCase()}`;
}