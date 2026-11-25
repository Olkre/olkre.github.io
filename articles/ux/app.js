(function(){
  var root=document.documentElement, btn=document.querySelector('.theme-toggle');
  function cur(){return root.dataset.theme||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');}
  function sync(){btn.setAttribute('aria-pressed', String(cur()==='dark'));}
  btn.addEventListener('click',function(){var n=cur()==='dark'?'light':'dark';root.dataset.theme=n;try{localStorage.setItem('theme',n);}catch(e){}sync();});
  sync();
  var bar=document.querySelector('.progress span');
  function prog(){var h=document.documentElement;var p=h.scrollTop/(h.scrollHeight-h.clientHeight||1);bar.style.transform='scaleX('+Math.min(1,Math.max(0,p))+')';}
  addEventListener('scroll',prog,{passive:true});prog();
  var links=[].slice.call(document.querySelectorAll('.toc a'));
  var map={};links.forEach(function(a){map[a.getAttribute('href').slice(1)]=a;});
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){links.forEach(function(l){l.removeAttribute('aria-current');});var a=map[e.target.id];if(a)a.setAttribute('aria-current','true');}});},{rootMargin:'-20% 0px -70% 0px'});
    document.querySelectorAll('article section').forEach(function(s){io.observe(s);});
  }
})();
