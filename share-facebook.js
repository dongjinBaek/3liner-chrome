window.onload = async () => {

  const url = new URL(location.href);
  const summary = url.searchParams.get('3liner-summary');
  
  if (summary) {

    const textarea = document.querySelector('.uiMentionsInput textarea');
    const hidden = document.querySelector('.mentionsHidden');
    textarea.value = '✍️ summary by www.3-liner.com :\n\n' + summary.replace(/3l-new-line/gi, '\n\n');
    hidden.value = '✍️ summary by www.3-liner.com :\n\n' + summary.replace(/3l-new-line/gi, '\n\n');
    textarea.style.setProperty('height', `${textarea.scrollHeight}px`, 'important');
    textarea.focus();
  }
}