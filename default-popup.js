document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('tl-summarize-btn').addEventListener('click', summarizeText)
});

const summarizeText = async () => {
  console.log('clicked')
  const textArea = document.getElementById('tl-textarea');
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    
    const content = textArea.value;
    
    const threeliner = await fetch(`http://localhost:5000/v1/summary?content=${content}`, { signal: controller.signal });
    clearTimeout(timeout);
    
    const res = await threeliner.text();
    const resJson = JSON.parse(res);
    lines = resJson.lines;
    console.log(lines);

    document.getElementById('tl-textarea').value = lines.map(line => '- ' + line).join('\n\n');;
  } catch (e) {
    cons
    textArea.textContent = '내용을 불러오지 못했습니다';
    if (e.name === 'AbortError') {
      textArea.textContent = 'timeout';
    }
    console.log(e);
  }
  
}