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
    'naverNews': 'a.cjs_news_a, a.cluster_text_headline, a.offc_ct_wraplink, a.article_lst--title_only'
  };
  const titleSelectorDict = {
    'googleSearch': 'h3, .mCBkyc',
    'naverSearch': null,
    'naverNews': null,
  };

  let linkSelector = '', titleSelector = '', pageType = '';
  if (url.startsWith('https://www.google.com/search') || url.startsWith('https://www.google.co.kr/search')) {
    pageType = 'googleSearch';
  } else if (url.startsWith('https://search.naver.com/search.naver')) {
    pageType = 'naverSearch';
  } else if (url.startsWith('https://news.naver.com')) {
    pageType = 'naverNews';
  }
  
  linkSelector = linkSelectorDict[pageType];
  titleSelector = titleSelectorDict[pageType];

  return {
    linkSelector,
    titleSelector,
    pageType,
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