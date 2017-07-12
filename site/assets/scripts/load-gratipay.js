(function() {
  fetch('https://gratipay.com/Backstroke/public.json').then(function(resp) {
    return resp.json();
  }).then(function(body) {
    document.getElementById('gratipay').innerHTML = "$" + String(body.receiving);
  });
})();
