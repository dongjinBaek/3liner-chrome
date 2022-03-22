amplitude.getInstance().init(AMPLITUDE_KEY);

async function getCurrentTab() {
  let queryOptions = { active: true, currentWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

let lines = 3;
let content = '';
let sentences = [];

const amplitudeEventProperties = {
  version: VERSION,
};

window.onload = async () => {
  const summary = (lines) => {
    const contentElement = document.getElementById('content');
    contentElement.textContent = '로딩중...';
    const textRank = new TextRank(sentences, {
        summaryType: 'array',
        extractAmount: lines,
      });
    contentElement.innerHTML = textRank.summarizedArticle.map((s, idx) => {
      return `<div class='summary-item'><div class='summary-item-index'>${idx+1}.</div><div>${s}</div></div>`
    }).join('<br/>');


    const url = document.getElementById('document-url').textContent;
    let shareContent = textRank.summarizedArticle.map((s, idx) => 
      `${idx + 1}. ${s}`
    ).join('3l-new-line');

    amplitudeEventProperties.summary = textRank.summarizedArticle;
    amplitude.getInstance().logEvent('summary loaded', amplitudeEventProperties);

    document.getElementById('share-facebook').addEventListener('click', () => {
      amplitude.getInstance().logEvent('share summary', {...amplitudeEventProperties, to:'facebook'});
      chrome.tabs.create({ url: `https://www.facebook.com/sharer/sharer.php?u=${url}&redirect_uri=https://www.facebook.com&3liner-summary=${shareContent}` });
    });
    document.getElementById('share-careerly').addEventListener('click', () => {
      amplitude.getInstance().logEvent('share summary', {...amplitudeEventProperties, to:'careerly'});
      chrome.tabs.create({ url: `https://careerly.co.kr/posts/create?3liner-summary=${shareContent}&3liner-url=${url}` });
    });
    // document.getElementById('share-linkedin').href = `https://www.linkedin.com/sharing/share-offsite/?url=${url}?3liner-summary=${shareContent}`;
  }

  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {type: "info"}, function(response) {
      const contentElement = document.getElementById('content');
      document.getElementById('document-title').textContent = response.title;
      document.getElementById('document-url').textContent = response.url;
      amplitudeEventProperties.title = response.title;
      amplitudeEventProperties.url = response.url;
      amplitude.getInstance().logEvent('open summary popup', amplitudeEventProperties);

      document.getElementById('feedback-link').addEventListener('click', () => {
        amplitude.getInstance().logEvent('feedback', amplitudeEventProperties);
        chrome.tabs.create({ url: `https://forms.gle/VCmjUZD8n75KJPaQ6` });
      });

      // TODO: 더 잘 나누기. 닫는 태그도 textParts에 포함하게 하기.
      const textParts = response.content.split(/(<\/(p|div|h1|h2|h3|h4|h5|h6)>)|(<br\/?>)/gi);

      textParts.forEach(part => {
        if (!part) {
          return;
        }
        part = part.replace(/(\n|\t|\r)/gi, '');
        if (part.length === 0 || part.match((/^\/?(p|div|h1|h2|h3|h4|h5|h6)$/gi))) {
          return;
        }

        contentElement.innerHTML = part;
        sentences.push(...contentElement.textContent.split(/[!?.] /gi).filter(s => s.length > 0));
      });

      summary(3);
    });
  });
}