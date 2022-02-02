document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('tl-summarize-btn').addEventListener('click', summarizeText)
});

const summarizeText = async () => {
  const textArea = document.getElementById('tl-textarea');
  if (textArea.value.indexOf(' ') === -1) {
    alert('두 단어 이상 입력해주세요');
    return;
  }
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    
    const content = textArea.value;
    
    const threeliner = await fetch(`http://localhost:5000/v1/summary?content=${content}`, { signal: controller.signal });
    clearTimeout(timeout);
    
    const res = await threeliner.text();
    const resJson = JSON.parse(res);
    lines = resJson.lines;

    if (lines.length === 0) {
      textArea.value = '요약을 불러오지 못했습니다';
    } else {
      textArea.value = lines.map(line => '- ' + line).join('\n\n');;
    }
  } catch (e) {
    textArea.value = '내용을 불러오지 못했습니다';
    if (e.name === 'AbortError') {
      textArea.value = '시간 내에 요약을 불러오지 못했습니다';
    }
    console.log(e);
  }
  
}