const loadFonts = (document) => {
  const styleNode           = document.createElement ("style");
  styleNode.type          = "text/css";
  styleNode.textContent   = 
                  "@font-face { font-family: NanumSquare_B; src: url('"
                  + chrome.runtime.getURL ("NanumSquareOTF_acB.otf")
                  + "'); }"
                  + "@font-face { font-family: NanumSquare_R; src: url('"
                  + chrome.runtime.getURL ("NanumSquareOTF_acR.otf")
                  + "'); }"
                  ;
  document.head.appendChild (styleNode);
}

//returns { linkSelector, titleSelector, pageType }
const getPageInfo = (url) => {
  const linkSelectorDict = {
    'googleSearch': '.yuRUbf > a, a.WlydOe, a.srEl',
    'naverSearch': 'a.link_tit, a.total_tit, a.news_tit, a.sub_tit, a.lnk_tit, a.link.elss, a.question_text',
    'naverNews': 'a.cjs_news_a, a.cluster_text_headline, a.offc_ct_wraplink, a.article_lst--title_only'
  };
  const titleSelectorDict = {
    'googleSearch': 'h3, .mCBkyc',
    'naverSearch': null,
    'naverNews': null,
  };
  const searchQueryParamDict = {
    'googleSearch': 'q',
    'naverSearch': 'query',
    'naverNews': null,
  };

  let linkSelector = '', titleSelector = '', pageType = '', searchQueryParam = '';
  if (url.startsWith('https://www.google.com/search') || url.startsWith('https://www.google.co.kr/search')) {
    pageType = 'googleSearch';
  } else if (url.startsWith('https://search.naver.com/search.naver')) {
    pageType = 'naverSearch';
  } else if (url.startsWith('https://news.naver.com')) {
    pageType = 'naverNews';
  }
  
  linkSelector = linkSelectorDict[pageType];
  titleSelector = titleSelectorDict[pageType];
  searchQueryParam = searchQueryParamDict[pageType];

  return {
    linkSelector,
    titleSelector,
    pageType,
    searchQueryParam,
  }
}

const onPreviewSwitchChangeGenerator = (amplitudeEventProperties) => {
  return onPreviewSwitchChange = (e) => {
    chrome.storage.sync.set({'enablePreview': e.target.checked}, () => {
      amplitude.getInstance().logEvent('toggle enable preview', {...amplitudeEventProperties, checked: e.target.checked});
      if (!e.target.checked) {
        alert('우상단의 확장 프로그램 아이콘을 클릭해서 미리보기 기능을 다시 활성화 할 수 있습니다.')
      }
    });
  }
}

// create PreviewElement according to previewLocation and return it.
const createPreviewElement = (previewLocation, previewHtml, document, elem) => {
  let previewElement = null;

  if (previewLocation === 'mouse') {

    document.body.insertAdjacentHTML('beforeend', previewHtml);

    const previewElements = document.body.querySelectorAll('.tl-preview');
    previewElement = previewElements[previewElements.length - 1];
    previewElement.classList.add('mouse');
    previewElement.classList.add('popup');
  } else if (previewLocation === 'top-right') {

    document.body.insertAdjacentHTML('beforeend', previewHtml);

    const previewElements = document.body.querySelectorAll('.tl-preview');
    previewElement = previewElements[previewElements.length - 1];
    previewElement.classList.add('top-right');
    previewElement.classList.add('popup');
  } else if (previewLocation === 'below-link'){

    elem.closest('.hlcw0c, .jtfYYd, .tF2Cxc, .WlydOe')?.insertAdjacentHTML('beforeend', previewHtml);

    previewElement = elem.closest('.hlcw0c, .jtfYYd, .tF2Cxc, .WlydOe')?.querySelector('.tl-preview');
    previewElement.classList.add('below-link');
  }
  return previewElement;
}

// returns { lines, keySentences }
const fetchPreviewInfo = async (url, terms) => {
  // 7초간 응답이 없으면 abort
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000)
  
  const threeliner = await fetch(`${BACKEND_PREFIX}/v1/preview?url=${url}&terms=${terms}`, { signal: controller.signal });
  clearTimeout(timeout);
  
  const res = await threeliner.text();
  const resJson = JSON.parse(res);

  return resJson;
}

// returns sentence html element in preview content area
const toSentenceElement = (sentence) => {
  return `<div class='preview-sentence'>
            <div class='preview-bullet'>-</div>
            <div class='preview-content-sentence'>${sentence}</div>
          </div>`;
}

const locatePreviewElementNearMouse = (previewElement, elem, e, window) => {
  if (e.clientY < window.innerHeight / 2) {
    previewElement.style.top = `${elem.getBoundingClientRect().bottom + 10}px`;
    previewElement.style.left = `${e.clientX + 10}px`;
    previewElement.style.right = 'auto';
  } else {
    previewElement.style.top = `${elem.getBoundingClientRect().top - 15 - 180}px`;
    previewElement.style.left = `${e.clientX + 10}px`;
    previewElement.style.right = 'auto';
  }
  if (parseInt(previewElement.style.top) + 420 + 10 >= window.innerHeight) {
    previewElement.style.bottom = '10px';
    previewElement.style.top = 'auto';
  }
  if (parseInt(previewElement.style.top) < 0) {
    previewElement.style.top = '10px';
    previewElement.style.bottom = 'auto';
  }
}

const initPreviewElement = (previewElement) => {
  previewElement.querySelector('.preview-header').textContent = '로딩중...';
  previewElement.querySelector('.preview-content-summary').innerHTML = '';
  previewElement.querySelector('.preview-content-keyword').innerHTML = '';
}

const isMouseInElement = (e, element, padding) => {
  const rect = element.getBoundingClientRect();
  if (e.clientY < rect.top - padding || e.clientY > rect.bottom + padding) {
    return false;
  }
  if (e.clientX < rect.left - padding || e.clientX > rect.right + padding) {
    return false;
  }
  return true;
}

const generateIsMouseHeading = (window) => {
  let count = -1, lastX = 0, lastY = 0;
  let top = 10;
  let bottom = 10 + 450;
  let right = window.innerWidth - 10;
  let left = window.innerWidth - 10 - 400;
  
  return isMouseHeading = (e) => {
    console.log(count, e.clientX, e.clientY, lastX,lastY)
    count++;
    // buffer for rectangle

    if (left <= e.clientX && e.clientX <= right
        && top <= e.clientY && e.clientY <= bottom) {
          return true;
    }
    if (count === 0) {
      lastX = e.clientX;
      lastY = e.clientY;
      return true;
    }
    if (count % 5 !== 0) {
      return true;
    }
    const movementX = e.clientX - lastX;
    const movementY = e.clientY - lastY;

    let sector = 1;
    if (lastX < left && lastY < bottom) {
      sector = 2;
    } else if (lastX < left && lastY >= bottom) {
      sector = 3;
    } else if (lastX >= left && lastY >= bottom) {
      sector = 4;
    }

    lastX = e.clientX;
    lastY = e.clientY;

    if (left === e.clientX || right === e.clientX) {
      return true;
    }

    const topLeftSlope = (top - e.clientY) / (left - e.clientX);
    const bottomLeftSlope = (bottom - e.clientY) / (left - e.clientX);
    const bottomRightSlope = (bottom - e.clientY) / (right - e.clientX);
    const headingSlope = movementY / movementX;

    console.log(topLeftSlope, bottomLeftSlope, bottomRightSlope, headingSlope);

    if (sector === 2) {
      return movementX > 0 && 
        bottomLeftSlope > headingSlope && headingSlope > topLeftSlope;
    } else if (sector === 4) {
      return movementX > 0 && movementY < 0 &&
        (bottomLeftSlope < headingSlope || headingSlope < bottomRightSlope);
    } else if (sector === 3) {
      return movementY < 0 && 
        topLeftSlope < headingSlope && headingSlope < bottomRightSlope;
    } else {
      return true;
    }
  }
}
