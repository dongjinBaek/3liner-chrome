window.onload = async () => {

  const url = new URL(location.href);
  const summary = url.searchParams.get('3liner-summary');
  const originalUrl = url.searchParams.get('3liner-url');
  
  if (summary) {

    const textarea = document.querySelector('#description')
    textarea.value = '✍️ summary by www.3-liner.com :\n\n' + summary.replace(/3l-new-line/gi, '\n\n');

    document.querySelector('#url').value = originalUrl;
  }
}