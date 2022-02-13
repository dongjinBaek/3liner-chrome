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
    'googleSearch': '.jtfYYd a, a.WlydOe, a.srEl',
    'naverSearch': 'a.link_tit, a.total_tit, a.news_tit, a.sub_tit, a.lnk_tit, a.link.elss, a.question_text',
  };
  const titleSelectorDict = {
    'googleSearch': 'h3, .mCBkyc',
    'naverSearch': null,
  };
  
  let linkSelector = '', titleSelector = '', pageType = '';
  if (url.startsWith('https://www.google.com/search') || url.startsWith('https://www.google.co.kr/search')) {
    pageType = 'googleSearch';
  } else if (url.startsWith('https://search.naver.com/search.naver')) {
    pageType = 'naverSearch';
  }
  
  linkSelector = linkSelectorDict[pageType];
  titleSelector = titleSelectorDict[pageType];

  return {
    linkSelector,
    titleSelector,
    pageType,
  }
}