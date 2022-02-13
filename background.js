chrome.runtime.onInstalled.addListener(function(details) {
  /* other 'reason's include 'update' */
  if (details.reason === 'install') {
      var uninstallUrlLink = 'https://forms.gle/RGDDTWCDQrHUsgnq5';
      if (chrome.runtime.setUninstallURL) {
          chrome.runtime.setUninstallURL(uninstallUrlLink);
      }
  }
});