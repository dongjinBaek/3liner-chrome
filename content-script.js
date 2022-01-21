// checkbox classnames
// .tmp-checkbox        : checkboxes shown when mouse hover
// .confirm-checkbox    : checkboxes after click
// .todoify-checkbox    : checkboxes in todoList
console.log('hi');
document.querySelectorAll('.newspaper_article_lst a').forEach(elem => {
  
    // document.getElementById('ws-iframe').src=`http://localhost:3000/words/new?selection=${selection}&example=${sentence}&pageTitle=${title}&pageUrl=${url}`
  
    elem.addEventListener('mouseenter', async (e) => {
      fetch(chrome.runtime.getURL('/popup.html')).then(r => r.text()).then(html => {
        document.body.insertAdjacentHTML('beforeend', html);
      });

      try {

        const threeliner = await fetch(`https://3liner.djbaek.com:5000?url=${elem.href}`)
        const res = await threeliner.text();
        console.log(res);
        
        const popup = document.getElementById('ws-popup')
        const title = elem.getElementsByTagName('strong')[0].textContent;
        if (popup) {
          popup.innerHTML = '<b>' + title + '<b/>' + res;
        }
      } catch (e) {
        popup.innerHTML = '에러~~~~. 다시시도~'
      }
  });

  elem.addEventListener('mouseleave', async (e) => {
    const old = document.getElementById('ws-popup');
    if (old) {
      old.remove();
    }
});
  
});
