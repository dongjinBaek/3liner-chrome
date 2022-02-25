amplitude.getInstance().init(AMPLITUDE_KEY);

chrome.storage.sync.get(['enablePreview', 'anonymousID', 'previewLocation'], (result) => {
  
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

      elem.addEventListener('click', () => {
        amplitude.getInstance().logEvent('click link', amplitudeEventProperties);
      });

      let previewElement = null;
      if (result.previewLocation === 'mouse') {

        // TODO: 한번만 fetch하고 나머지는 복사해서 사용하기
        const popup = await fetch(chrome.runtime.getURL('/preview.html'));
        const popupHtml = await popup.text();
        // elem.closest('.hlcw0c, .jtfYYd, .tF2Cxc, .WlydOe')?.insertAdjacentHTML('beforeend', popupHtml);
        document.body.insertAdjacentHTML('beforeend', popupHtml);

        // TODO: abstract getPreviewElement method
        // const previewElement = elem.closest('.hlcw0c, .jtfYYd, .tF2Cxc, .WlydOe')?.querySelector('.tl-preview');
        const previewElements = document.body.querySelectorAll('.tl-preview');
        previewElement = previewElements[previewElements.length - 1];
        previewElement.classList.add('mouse');
        previewElement.classList.add('popup');
      } else if (result.previewLocation === 'top-right') {
        // TODO: 한번만 fetch하고 나머지는 복사해서 사용하기
        const popup = await fetch(chrome.runtime.getURL('/preview.html'));
        const popupHtml = await popup.text();
        // elem.closest('.hlcw0c, .jtfYYd, .tF2Cxc, .WlydOe')?.insertAdjacentHTML('beforeend', popupHtml);
        document.body.insertAdjacentHTML('beforeend', popupHtml);

        // TODO: abstract getPreviewElement method
        // const previewElement = elem.closest('.hlcw0c, .jtfYYd, .tF2Cxc, .WlydOe')?.querySelector('.tl-preview');
        const previewElements = document.body.querySelectorAll('.tl-preview');
        previewElement = previewElements[previewElements.length - 1];
        previewElement.classList.add('top-right');
        previewElement.classList.add('popup');
      } else {
        // TODO: 한번만 fetch하고 나머지는 복사해서 사용하기
        const popup = await fetch(chrome.runtime.getURL('/preview.html'));
        const popupHtml = await popup.text();
        elem.closest('.hlcw0c, .jtfYYd, .tF2Cxc, .WlydOe')?.insertAdjacentHTML('beforeend', popupHtml);
        // document.body.insertAdjacentHTML('beforeend', popupHtml);

        // TODO: abstract getPreviewElement method
        previewElement = elem.closest('.hlcw0c, .jtfYYd, .tF2Cxc, .WlydOe')?.querySelector('.tl-preview');
        // const previewElements = document.body.querySelectorAll('.tl-preview');
        // const previewElement = previewElements[previewElements.length - 1];
        previewElement.classList.add('below-link');
      }

      previewElement.querySelector('.preview-location-select').value = result.previewLocation;
      previewElement.querySelector('.preview-location-select').addEventListener('change', (e) => {
        console.log(e.target.value);
        chrome.storage.sync.set({'previewLocation': e.target.value}, () => {
          // amplitude.getInstance().logEvent('toggle enable preview', {...amplitudeEventProperties, checked: e.target.checked});
        });
        alert('새로고침 후 적용됩니다.');
      });

      mouseEnterListeners[index] = async (e) => {
        amplitude.getInstance().logEvent('preview link', amplitudeEventProperties);

        previewElement?.classList.add('visible');
        previewElement.querySelector('.preview-logo').src = chrome.runtime.getURL('logo.png');

        if (result.previewLocation === 'mouse') {
          locatePreviewElementNearMouse(previewElement, elem, e, window);
        }

        try {
          const urlParams = new URLSearchParams(window.location.search);
          const terms = urlParams.get(searchQueryParam);
          
          const { lines, keySentences } = await fetchPreviewInfo(elem.href, terms);
          
          let title = elem.textContent;
          if (titleSelector) {
            title = elem.querySelector(titleSelector).textContent;
          }
          previewElement.querySelector('.preview-header').textContent = title;

          if (lines) {
            previewElement.querySelector('.preview-content-summary').innerHTML = lines.map(sentence => {
              return toSentenceElement(sentence);
            }).join('');
          }
          if (keySentences) {
            const termList = terms.split(' ');
            previewElement.querySelector('.preview-content-keyword').innerHTML = keySentences.map(sentence => {
              for (const term of termList) {
                const regexRule = new RegExp(term, 'g');
                sentence = sentence.replace(regexRule, `<span style='background-color:yellow;font-weight:bold;'>${term}</span>`);
              }
              return toSentenceElement(sentence);
            }).join('');
          } 
        } catch(e) {
            // TODO: error 처리
            console.log(e);
        }
      }

      if (result.enablePreview) {
        elem.addEventListener('mouseenter', mouseEnterListeners[index]);

        previewElement.addEventListener('mouseleave', () => {
          previewElement?.classList.remove('visible');
          initPreviewElement(previewElement);
        })

        

        elem.closest('.hlcw0c, .jtfYYd, .tF2Cxc, .vJOb1e')?.addEventListener('mouseleave', async (e) => {
          if (!isMouseInElement(e, previewElement, 5)) {
            previewElement?.classList.remove('visible');
            initPreviewElement(previewElement);
          }
        });
      }

  });

});
