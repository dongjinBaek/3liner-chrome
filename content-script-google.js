amplitude.getInstance().init(AMPLITUDE_KEY);

chrome.storage.sync.get(['enablePreview', 'anonymousID'], (result) => {
  
  const { linkSelector, titleSelector, pageType, searchQueryParam } = getPageInfo(document.URL);

  let mouseEnterListeners = [];

  document.querySelectorAll(linkSelector).forEach(async (elem, index) => {
      const amplitudeEventProperties = {
        pageType: pageType,
        source: window.location.href,
        destination: elem.href,
        searchQueryParam: searchQueryParam,
        version: VERSION,
        anonymousID: result.anonymousID,
      };

      const popup = await fetch(chrome.runtime.getURL('/preview.html'));
        const popupHtml = await popup.text();
      elem.closest('.hlcw0c, .jtfYYd, .tF2Cxc, .WlydOe')?.insertAdjacentHTML('beforeend', popupHtml);

      const previewElement = elem.closest('.hlcw0c, .jtfYYd, .tF2Cxc, .WlydOe')?.querySelector('.tl-preview');
      mouseEnterListeners[index] = async (e) => {
        previewElement?.classList.add('visible');
        previewElement.querySelector('.preview-logo').src = chrome.runtime.getURL('logo.png');

        
        const urlParams = new URLSearchParams(window.location.search);
        const terms = urlParams.get(searchQueryParam);
        previewElement.querySelector('.preview-content-keyword-title').textContent = `'${terms}' 포함 문장`;

        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 7000)

        const threeliner = await fetch(`${BACKEND_PREFIX}/v1/preview?url=${elem.href}&terms=${terms}`, { signal: controller.signal });
        clearTimeout(timeout);

        const res = await threeliner.text();
        const resJson = JSON.parse(res);
        lines = resJson.lines;
        keySentences = resJson.keySentences;
        console.log(resJson);

        if (lines) {
          previewElement.querySelector('.preview-content-summary').innerHTML = lines.map(sentence => {

            return `<div class='preview-sentence'>
                      <div class='preview-bullet'>-</div>
                      <div class='preview-content-sentence'>${sentence}</div>
                    </div>`;
          }).join('');
        }
        if (keySentences) {
          const termList = terms.split(' ');
          previewElement.querySelector('.preview-content-keyword').innerHTML = keySentences.map(sentence => {
            for (const term of termList) {
              const regexRule = new RegExp(term, 'g');
              sentence = sentence.replace(regexRule, `<span style='background-color:yellow;font-weight:bold;'>${term}</span>`);
            }
            return `<div class='preview-sentence'>
                      <div class='preview-bullet'>-</div>
                      <div class='preview-content-sentence'>${sentence}</div>
                    </div>`;
          }).join('');
        }

      }

      if (result.enablePreview) {
        elem.addEventListener('mouseenter', mouseEnterListeners[index]);

        elem.closest('.hlcw0c, .jtfYYd, .tF2Cxc, .vJOb1e')?.addEventListener('mouseleave', async (e) => {
          previewElement?.classList.remove('visible');
        });
      }

  });

});
