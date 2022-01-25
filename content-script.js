const styleNode           = document.createElement ("style");
styleNode.type          = "text/css";
styleNode.textContent   = "@font-face { font-family: SCDream9; src: url('"
                + chrome.runtime.getURL ("SCDream9.otf")
                + "'); }"
                + "@font-face { font-family: SCDream4; src: url('"
                + chrome.runtime.getURL ("SCDream4.otf")
                + "'); }"
                ;
document.head.appendChild (styleNode);

const linkSelectorDict = {
  'google': '.jtfYYd a, a.WlydOe',
  'naverNews': '.newspaper_article_lst a',
};
const titleSelectorDict = {
  'google': 'h3, .mCBkyc',
  'naverNews': 'strong',
};

let linkSelector = '', titleSelector = '', pageType = '';
if (document.URL.startsWith('https://www.google.com/search') || document.URL.startsWith('https://www.google.co.kr/search')) {
  pageType = 'google';
} else if (document.URL.startsWith('https://media.naver.com/press/')) {
  pageType = 'naverNews';
}

linkSelector = linkSelectorDict[pageType];
titleSelector = titleSelectorDict[pageType];

document.querySelectorAll(linkSelector).forEach(elem => {
  
    elem.addEventListener('mouseenter', async (e) => {
      const old = document.getElementById('ws-popup');
      if (old) {
        old.remove();
      }

      const popup = await fetch(chrome.runtime.getURL('/popup.html'));
      const popupHtml = await popup.text();
      document.body.insertAdjacentHTML('beforeend', popupHtml);

      // document.getElementById('ws-popup').style.top = `${e.clientY}px`;
      // document.getElementById('ws-popup').style.left = `${e.clientX + 5}px`;

      const popupElement =  document.getElementById('ws-popup');
      const popupContent = document.getElementById('ws-popup-content');
      const titleElement = document.getElementById('ws-popup-title');
      try {
        let lines = [];

          const threeliner = await fetch(`https://api.3-liner.com:5000?url=${elem.href}`)
          const res = await threeliner.text();
          const resJson = JSON.parse(res);
          lines = resJson.lines;
          console.log(resJson);
        
        document.getElementById('ws-popup-icon').style.display = 'inline-block';
        document.getElementById('ws-popup-icon').src = chrome.runtime.getURL("logo.png");
        
        const title = elem.querySelector(titleSelector).textContent;
        titleElement.textContent = title;
        // document.getElementById('ws-popup-save').style.display = 'inline-block';
        
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
        console.log(e);
      }

      const removePopup = () => {
        const old = document.getElementById('ws-popup');
        if (old) {
          old.remove();
        }
      }

      const rect = document.getElementById('ws-popup').getBoundingClientRect();
      console.log(rect);
      let isMouseInLinkArea = true;

      let count = -1, lastX = 0, lastY = 0;
      
      const isMouseHeading = (e, rect) => {
        console.log(rect.top, e.clientY, rect.bottom);
        console.log(rect.left, e.clientX)
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
        console.log(topLeftSlope, bottomLeftSlope, headingSlope);

        return bottomLeftSlope > headingSlope && headingSlope > topLeftSlope;
      }

      const mouseMoveHandler = async (e) => {
        console.log(e.movementX, e.movementY);
        if (!isMouseInLinkArea && !isMouseHeading(e, rect)) {
          console.log('not heading popup');
          document.removeEventListener('mousemove', mouseMoveHandler);
          const old = document.getElementById('ws-popup');
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

  });

  

  

  
  
});
