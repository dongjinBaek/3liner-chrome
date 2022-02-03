amplitude.getInstance().init("b864283ca45efdcb2c800fb109d6643f");

const amplitudeEventProperties = {
  pageType: 'popup',
  version: '0.1.0',
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('tl-summarize-btn').addEventListener('click', summarizeText);

  amplitude.getInstance().logEvent('open popup', amplitudeEventProperties);

  document.getElementById('tl-feedback-btn').addEventListener('click', () => {
    amplitude.getInstance().logEvent('feedback', amplitudeEventProperties);
    chrome.tabs.create({ url: 'https://forms.gle/VCmjUZD8n75KJPaQ6' });
  });
});

const summarizeText = async () => {
  const textArea = document.getElementById('tl-textarea');
  if (textArea.value.indexOf(' ') === -1) {
    alert('두 단어 이상 입력해주세요');
    return;
  }

  const summarizeBtn = document.getElementById('tl-summarize-btn');

  try {
    amplitude.getInstance().logEvent('summarize text', {...amplitudeEventProperties, data: textArea.value});
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    
    const content = textArea.value;

    summarizeBtn.textContent = '요약중';
    summarizeBtn.disabled = true;

    const threeliner = await fetch(`https://api.3-liner.com:5000/v1/summary?content=${content}`, { signal: controller.signal });
    clearTimeout(timeout);
    
    const res = await threeliner.text();
    const resJson = JSON.parse(res);
    lines = resJson.lines;

    if (lines.length === 0) {
      textArea.value = '요약을 불러오지 못했습니다';
      amplitude.getInstance().logEvent('error', {...amplitudeEventProperties, errorType: 'empty result'});
    } else {
      textArea.value = lines.map(line => '- ' + line).join('\n\n');
      amplitude.getInstance().logEvent('summarize text loaded', {...amplitudeEventProperties, lines: lines});
    }
  } catch (e) {
    if (e.name === 'AbortError') {
      textArea.value = '시간 내에 요약을 불러오지 못했습니다';
      amplitude.getInstance().logEvent('error', { ...amplitudeEventProperties, errorType: 'timeout' });
    } else {
      textArea.value = '내용을 불러오지 못했습니다';
      amplitude.getInstance().logEvent('error', { ...amplitudeEventProperties, errorType: 'error',  errorMessage: e});
    }

    console.log(e);
  }

  summarizeBtn.textContent = '요약하기';
  summarizeBtn.disabled = false;
}