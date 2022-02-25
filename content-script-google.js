amplitude.getInstance().init(AMPLITUDE_KEY);

chrome.storage.sync.get(['enablePreview', 'anonymousID', 'previewLocation'], async (result) => {
  
  const { linkSelector, titleSelector, pageType, searchQueryParam } = getPageInfo(document.URL);

  const popup = await fetch(chrome.runtime.getURL('/preview.html'));
  const previewHtml = await popup.text();

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

      // preview element 생성. 기본적으로 visible: hidden인 상태
      const previewElement = createPreviewElement(result.previewLocation, previewHtml, document, elem);

      // 미리보기 위치 지정 selectbox 설정
      previewElement.querySelector('.preview-location-select').value = result.previewLocation;
      previewElement.querySelector('.preview-location-select').addEventListener('change', (e) => {
        chrome.storage.sync.set({'previewLocation': e.target.value}, () => {
          // amplitude.getInstance().logEvent('toggle enable preview', {...amplitudeEventProperties, checked: e.target.checked});
        });
        alert('새로고침 후 적용됩니다.');
      });

      // 링크 mouse enter eventlisteners. enable preview on/off때 바로 add/remove 할 수 있도록 배열로 관리.
      mouseEnterListeners[index] = async (e) => {
        amplitude.getInstance().logEvent('preview link', amplitudeEventProperties);

        previewElement?.classList.add('visible');
        previewElement.querySelector('.preview-logo').src = chrome.runtime.getURL('logo.png');

        if (result.previewLocation === 'mouse') {
          locatePreviewElementNearMouse(previewElement, elem, e, window);
        }

        const titleElement = previewElement.querySelector('.preview-header');

        try { // preview 정보 backend에서 받아와서 설정하는 try/catch
          const urlParams = new URLSearchParams(window.location.search);
          const terms = urlParams.get(searchQueryParam);
          
          const { lines, keySentences } = await fetchPreviewInfo(elem.href, terms);
          
          let title = elem.textContent;
          if (titleSelector) {
            title = elem.querySelector(titleSelector).textContent;
          }
          titleElement.textContent = title;

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
            titleElement.style.display = 'block';
            if (e.name === 'AbortError') {
              titleElement.textContent = '시간 내에 요약을 불러오지 못했습니다';
              amplitude.getInstance().logEvent('error', { ...amplitudeEventProperties, errorType: 'timeout' });
            } else {
              titleElement.textContent = '내용을 불러오지 못했습니다';
              amplitude.getInstance().logEvent('error', { ...amplitudeEventProperties, errorType: 'error',  errorMessage: e});
            }
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
