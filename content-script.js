amplitude.getInstance().init("b864283ca45efdcb2c800fb109d6643f");



const styleNode           = document.createElement ("style");
styleNode.type          = "text/css";
styleNode.textContent   = "@font-face { font-family: NanumSquare_B; src: url('"
                + chrome.runtime.getURL ("NanumSquareOTF_acB.otf")
                + "'); }"
                + "@font-face { font-family: NanumSquare_R; src: url('"
                + chrome.runtime.getURL ("NanumSquareOTF_acR.otf")
                + "'); }"
                ;
document.head.appendChild (styleNode);

const linkSelectorDict = {
  'googleSearch': '.jtfYYd a, a.WlydOe, a.srEl',
  'naverSearch': 'a.link_tit, a.total_tit, a.news_tit, a.sub_tit, a.lnk_tit, a.link.elss, a.question_text',
};
const titleSelectorDict = {
  'googleSearch': 'h3, .mCBkyc',
  'naverSearch': null,
};

let linkSelector = '', titleSelector = '', pageType = '';
if (document.URL.startsWith('https://www.google.com/search') || document.URL.startsWith('https://www.google.co.kr/search')) {
  pageType = 'googleSearch';
} else if (document.URL.startsWith('https://search.naver.com/search.naver')) {
  pageType = 'naverSearch';
}

linkSelector = linkSelectorDict[pageType];
titleSelector = titleSelectorDict[pageType];

document.querySelectorAll(linkSelector).forEach(elem => {
    const amplitudeEventProperties = {
      pageType: pageType,
      source: window.location.href,
      destination: elem.href,
      version: '0.1.0',
    };

    elem.addEventListener('click', () => {
      amplitude.getInstance().logEvent('click link', amplitudeEventProperties);
    });

    
  
    elem.addEventListener('mouseenter', async (e) => {
      const old = document.getElementById('tl-popup');
      if (old) {
        old.remove();
        amplitude.getInstance().logEvent('remove preview link', {...amplitudeEventProperties, 'removedBy': 'new preview'});
      }

      

      amplitude.getInstance().logEvent('preview link', amplitudeEventProperties);

      const popup = await fetch(chrome.runtime.getURL('/popup.html'));
      const popupHtml = await popup.text();
      document.body.insertAdjacentHTML('beforeend', popupHtml);

      document.getElementById('tl-popup').addEventListener('mouseenter', () => {
        amplitude.getInstance().logEvent('mouse enter preview', amplitudeEventProperties);
      });

      // document.getElementById('tl-popup').style.top = `${e.clientY}px`;
      // document.getElementById('tl-popup').style.left = `${e.clientX + 5}px`;

      const popupElement =  document.getElementById('tl-popup');
      const popupContent = document.getElementById('tl-popup-content');
      const titleElement = document.getElementById('tl-popup-title');
      

      const removePopup = () => {
        const old = document.getElementById('tl-popup');
        if (old) {
          old.remove();
        }
      }

      const rect = document.getElementById('tl-popup').getBoundingClientRect();
      let isMouseInLinkArea = true;

      let count = -1, lastX = 0, lastY = 0;
      
      const isMouseHeading = (e, rect) => {
        count++;
        // buffer for rectangle
        rect.left -= 50;
        rect.bottom += 50;

        if (rect.left <= e.clientX && e.clientX <= rect.right
            && rect.top <= e.clientY && e.clientY <= rect.bottom) {
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
        if (lastX < rect.left && lastY < rect.bottom) {
          sector = 2;
        } else if (lastX < rect.left && lastY >= rect.bottom) {
          sector = 3;
        } else if (lastX >= rect.left && lastY >= rect.bottom) {
          sector = 4;
        }

        lastX = e.clientX;
        lastY = e.clientY;

        if (rect.left === e.clientX || rect.right === e.clientX) {
          return true;
        }

        const topLeftSlope = (rect.top - e.clientY) / (rect.left - e.clientX);
        const bottomLeftSlope = (rect.bottom - e.clientY) / (rect.left - e.clientX);
        const bottomRightSlope = (rect.bottom - e.clientY) / (rect.right - e.clientX);
        const headingSlope = movementY / movementX;


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

      const mouseMoveHandler = async (e) => {
        if (!isMouseInLinkArea && !isMouseHeading(e, rect)) {
          document.removeEventListener('mousemove', mouseMoveHandler);
          const old = document.getElementById('tl-popup');
          if (old) {
            old.remove();
            amplitude.getInstance().logEvent('remove preview link', {...amplitudeEventProperties, 'removedBy': 'mouse not heading preview'});
          }
        }
      };

      document.addEventListener('mousemove', mouseMoveHandler);

      elem.addEventListener('mouseleave', async (e) => {
        isMouseInLinkArea = false;
      });

      try {
        let lines = [];

        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 7000)

        const threeliner = await fetch(`https://api.3-liner.com:5000/v1/summary?url=${elem.href}`, { signal: controller.signal });
        clearTimeout(timeout);

        const res = await threeliner.text();
        const resJson = JSON.parse(res);
        lines = resJson.lines;

        // 요약을 로딩하는 동안 팝업이 사라졌으면, 그대로 종료.
        if (document.getElementById('tl-popup') === null) {
          return;
        }
        document.getElementById('tl-popup-icon').style.display = 'inline-block';
        document.getElementById('tl-popup-icon').src = chrome.runtime.getURL("logo.png");
        
        let title = elem.textContent;
        if (titleSelector) {
          title = elem.querySelector(titleSelector).textContent;
        }
        titleElement.textContent = title;
        // document.getElementById('tl-popup-save').style.display = 'inline-block';
        
        if (popupContent) {
          if (lines.length === 0) {
            titleElement.textContent = '요약을 불러오지 못했습니다';
            amplitude.getInstance().logEvent('error', {...amplitudeEventProperties, errorType: 'empty result'});
          } else {
            popupContent.innerHTML = lines.map(line => '- ' + line).join('<br/><br/>');
            amplitude.getInstance().logEvent('preview load', { ...amplitudeEventProperties, lines: lines });
          }
        }
      } catch (e) {
        if (e.name === 'AbortError') {
          titleElement.textContent = '시간 내에 요약을 불러오지 못했습니다';
          amplitude.getInstance().logEvent('error', { ...amplitudeEventProperties, errorType: 'timeout' });
        } else {
          titleElement.textContent = '내용을 불러오지 못했습니다';
          amplitude.getInstance().logEvent('error', { ...amplitudeEventProperties, errorType: 'error',  errorMessage: e});
        }
      }

  });

});
