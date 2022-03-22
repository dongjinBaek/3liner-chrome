chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.type === "info") {
      const documentClone = document.cloneNode(true);
        const article = new Readability(documentClone).parse();
        sendResponse({
          url: location.href,
          title: document.title,
          content: article.content
        });
    }
  }
);