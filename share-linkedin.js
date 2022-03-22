window.onload = async () => {

  const url = new URL(location.href);
  const summary = url.searchParams.get('3liner-summary');
  
  if (summary) {

    const textarea = document.querySelector('.ql-editor p');
    if (textarea) {
      textarea.textContent = summary.replace(/3l-new-line/gi, '\n\n');
    }
  }
}