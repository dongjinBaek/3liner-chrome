amplitude.getInstance().init(AMPLITUDE_KEY);
loadFonts(document);

chrome.storage.sync.get(['enablePreview', 'anonymousID', 'previewLocation', 'previewNumSections', 'previewSection'], async (result) => {
  
  const { linkSelector, titleSelector, pageType, searchQueryParam } = getPageInfo(document.URL);

  const popup = await fetch(chrome.runtime.getURL('/preview.html'));
  const previewHtml = await popup.text();

  let mouseEnterListeners = [];

  const urlParams = new URLSearchParams(window.location.search);
  const terms = urlParams.get(searchQueryParam);

  // mouse
  const isMouseHeading = generateIsMouseHeading(window);

  // iterate for links
  document.querySelectorAll(linkSelector).forEach(async (elem, index) => {
      const amplitudeEventProperties = {
        pageType: pageType,
        source: window.location.href,
        destination: elem.href,
        searchQueryParam: terms,
        version: VERSION,
        anonymousID: result.anonymousID,
        previewLocation: result.previewLocation,
        previewNumSections: result.previewNumSections,
        previewSection: result.previewSection,
      };

      elem.addEventListener('click', () => {
        amplitude.getInstance().logEvent('click link', amplitudeEventProperties);
      });

      // preview element 생성. 기본적으로 visible: hidden인 상태
      const previewElement = createPreviewElement(result.previewLocation, previewHtml, document, elem);
      initPreviewElement(previewElement);

      // 내용 전환
      previewElement.querySelector('.content-title-summary').addEventListener('click', () => {
        changeSection(previewElement, 'keyword', 'summary');
        chrome.storage.sync.set({'previewSection': 'summary'}, () => {
          amplitude.getInstance().logEvent('change preview section', {...amplitudeEventProperties, value: 'summary'});
        });
        result.previewSection = 'summary';
      });
      previewElement.querySelector('.content-title-keyword').addEventListener('click', () => {
        changeSection(previewElement, 'summary', 'keyword');
        chrome.storage.sync.set({'previewSection': 'keyword'}, () => {
          amplitude.getInstance().logEvent('change preview section', {...amplitudeEventProperties, value: 'keyword'});
        });
        result.previewSection = 'keyword';
      });

      // 미리보기 섹션 개수 지정 selectbox 설정
      previewElement.querySelector('.preview-num-sections-select').addEventListener('change', (e) => {
        chrome.storage.sync.set({'previewNumSections': e.target.value}, () => {
          amplitude.getInstance().logEvent('change num section', {...amplitudeEventProperties, value: e.target.value});
        });
        result.previewNumSections = e.target.value;
        setPreviewElementStyle(previewElement, result);
        previewElement.classList.add('visible');
      });

      // 미리보기 위치 지정 selectbox 설정
      previewElement.querySelector('.preview-location-select').addEventListener('change', (e) => {
        chrome.storage.sync.set({'previewLocation': e.target.value}, () => {
          amplitude.getInstance().logEvent('change preview location', {...amplitudeEventProperties, value: e.target.value});
        });
        // result.previewLocation = e.target.value;
        alert('새로고침 후 적용됩니다.');
        // setPreviewElementLocation(previewElement, result);
        // setPreviewElementMouseHandler(previewElement, result, document, elem);
      });

      // 미리보기 enablePreview switch
      previewElement.querySelector('.preview-switch').checked = result.enablePreview;
      
      onPreviewSwitchChange = (e) => {
        chrome.storage.sync.set({'enablePreview': e.target.checked}, () => {
          amplitude.getInstance().logEvent('toggle enable preview', {...amplitudeEventProperties, checked: e.target.checked});
        });
        if (!e.target.checked) {
          alert('우측 상단 3L 확장 프로그램 아이콘을 눌러 다시 활성화 할 수 있습니다.');
        }
      }
      
      previewElement.querySelector('.preview-switch').addEventListener('change', onPreviewSwitchChange);
      
      
      const removeMouseMoveHandler = setPreviewElementMouseHandler(previewElement, result, document, elem);
        
      // 링크 mouse enter eventlisteners. enable preview on/off때 바로 add/remove 할 수 있도록 배열로 관리.
      mouseEnterListeners[index] = async (e) => {

        inlink = true;
        amplitude.getInstance().logEvent('preview link', amplitudeEventProperties);

        document.body.querySelectorAll('.tl-preview').forEach((prev) => {
          if (prev.classList.contains('visible')) {
            prev?.classList.remove('visible');
            initPreviewElement(prev);
            amplitude.getInstance().logEvent('remove preview link', {...amplitudeEventProperties, 'removedBy': 'new preview'});
          }
        })

        previewElement?.classList.add('visible');
        previewElement.querySelector('.preview-logo').src = chrome.runtime.getURL('logo.png');

        setPreviewElementLocation(previewElement, result);
        setPreviewElementStyle(previewElement, result);
        if (result.previewLocation === 'mouse') {
          locatePreviewElementNearMouse(previewElement, elem, e, window, result);
        }

        const titleElement = previewElement.querySelector('.preview-header');


        try { // preview 정보 backend에서 받아와서 설정하는 try/catch
          
          
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
          amplitude.getInstance().logEvent('preview load', { ...amplitudeEventProperties, summary: lines, keyword: keySentences });
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
          amplitude.getInstance().logEvent('remove preview link', {...amplitudeEventProperties, 'removedBy': 'mouse out'});
        });
        
      }

  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.enablePreview) {
      if (changes.enablePreview.newValue === false) {
        document.querySelectorAll(linkSelector).forEach((elem, index) => {
          elem.removeEventListener('mouseenter', mouseEnterListeners[index]);
        });
        document.querySelectorAll('.preview-switch').forEach((elem => elem.checked = false));
      } else if (changes.enablePreview.newValue === true) {
        document.querySelectorAll(linkSelector).forEach((elem, index) => {
          elem.addEventListener('mouseenter', mouseEnterListeners[index]);
        });
        document.querySelectorAll('.preview-switch').forEach((elem => elem.checked = true));
      }
    }
  });

});
