const styleNode           = document.createElement ("style");
styleNode.type          = "text/css";
styleNode.textContent   = "@font-face { font-family: SCDream9; src: url('"
                + chrome.runtime.getURL ("SCDream9.otf")
                + "'); }"
                + "@font-face { font-family: SCDream4; src: url('"
                + chrome.runtime.getURL ("SCDream4.otf")
                + "'); }"
                + "@font-face { font-family: NanumSquare_B; src: url('"
                + chrome.runtime.getURL ("NanumSquareOTF_acB.otf")
                + "'); }"
                + "@font-face { font-family: NanumSquare_R; src: url('"
                + chrome.runtime.getURL ("NanumSquareOTF_acR.otf")
                + "'); }"
                ;
document.head.appendChild (styleNode);

const linkSelectorDict = {
  'google': '.jtfYYd a, a.WlydOe, a.srEl',
  'naverNews': '.newspaper_article_lst a',
  'naverNewsMain': '.cjs_journal_wrap a, a.cluster_text_headline',
  'naverSearch': 'a.link_tit, a.total_tit, a.news_tit, a.sub_tit, a.lnk_tit, a.link.elss, a.question_text',
};
const titleSelectorDict = {
  'google': 'h3, .mCBkyc',
  'naverNews': 'strong',
  'naverNewsMain': '.cjs_t',
  'naverSearch': null,
};

let linkSelector = '', titleSelector = '', pageType = '';
if (document.URL.startsWith('https://www.google.com/search') || document.URL.startsWith('https://www.google.co.kr/search')) {
  pageType = 'google';
} else if (document.URL.startsWith('https://search.naver.com/search.naver')) {
  pageType = 'naverSearch';
}

linkSelector = linkSelectorDict[pageType];
titleSelector = titleSelectorDict[pageType];

document.querySelectorAll(linkSelector).forEach(elem => {
  
    elem.addEventListener('mouseenter', async (e) => {
      const old = document.getElementById('tl-popup');
      if (old) {
        old.remove();
      }

      const popup = await fetch(chrome.runtime.getURL('/popup.html'));
      const popupHtml = await popup.text();
      document.body.insertAdjacentHTML('beforeend', popupHtml);

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
        // console.log(e.clientX, e.clientY, lastX, lastY)
        lastX = e.clientX;
        lastY = e.clientY;
        if (movementX < 0) {
          return false;
        }

        const topLeftSlope = (rect.top - e.clientY) / (rect.left - e.clientX);
        const bottomLeftSlope = (rect.bottom - e.clientY) / (rect.left - e.clientX);
        const headingSlope = movementY / movementX;

        return bottomLeftSlope > headingSlope && headingSlope > topLeftSlope;
      }

      const mouseMoveHandler = async (e) => {
        console.log(e.movementX, e.movementY);
        if (!isMouseInLinkArea && !isMouseHeading(e, rect)) {
          document.removeEventListener('mousemove', mouseMoveHandler);
          const old = document.getElementById('tl-popup');
          if (old) {
            old.remove();
          }
        }
      };

      document.addEventListener('mousemove', mouseMoveHandler);

      elem.addEventListener('mouseleave', async (e) => {
        console.log('leave', e);
        isMouseInLinkArea = false;
      });

      try {
        let lines = [];

        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 5000)

          const threeliner = await fetch(`http://localhost:5000/v1/summary?url=${elem.href}`, { signal: controller.signal });
          clearTimeout(timeout);

          const res = await threeliner.text();
          const resJson = JSON.parse(res);
          lines = resJson.lines;
        
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
            popupContent.innerHTML = '요약을 불러오지 못했습니다';
          } else {
            popupContent.innerHTML = lines.map(line => '- ' + line).join('<br/><br/>');
          }
        }
      } catch (e) {
        titleElement.textContent = '';
        popupContent.innerHTML = '내용을 불러오지 못했습니다';
        if (e.name === 'AbortError') {
          popupContent.innerHTML = 'timeout';
        }
        console.log(e);
      }

  });

});
