if(!self.define){let e,i={};const c=(c,n)=>(c=new URL(c+".js",n).href,i[c]||new Promise((i=>{if("document"in self){const e=document.createElement("script");e.src=c,e.onload=i,document.head.appendChild(e)}else e=c,importScripts(c),i()})).then((()=>{let e=i[c];if(!e)throw new Error(`Module ${c} didn’t register its module`);return e})));self.define=(n,o)=>{const r=e||("document"in self?document.currentScript.src:"")||location.href;if(i[r])return;let f={};const a=e=>c(e,r),s={module:{uri:r},exports:f,require:a};i[r]=Promise.all(n.map((e=>s[e]||a(e)))).then((e=>(o(...e),f)))}}define(["./workbox-eaa5ebda"],(function(e){"use strict";self.addEventListener("message",(e=>{e.data&&"SKIP_WAITING"===e.data.type&&self.skipWaiting()})),e.precacheAndRoute([{url:"android-chrome-192x192.png",revision:"8b8468ea6be7ad1b94f78d49c3a7215b"},{url:"android-chrome-512x512.png",revision:"8447d452d955e12b3ef27372fee1f107"},{url:"apple-touch-icon.png",revision:"a768e7230b1a27e325b10a461c63f3fb"},{url:"favicon-16x16.png",revision:"813585f406ad29ebb3120b089e22aab4"},{url:"favicon-32x32.png",revision:"e7ffe1a6cd6b22c14b4c5ebc273034f3"},{url:"favicon.ico",revision:"0055df1b1f75917592c5cf1b5264db26"},{url:"favicon.png",revision:"1911e6baf77352b4adbe74a7193114a1"},{url:"icon.png",revision:"6154a5c8bc3a851cb0fc2d00235fc1df"},{url:"index.html",revision:"a756c697c4f4cb89bdff584b4de7d83e"},{url:"logo192.png",revision:"6154a5c8bc3a851cb0fc2d00235fc1df"},{url:"logo512.png",revision:"6154a5c8bc3a851cb0fc2d00235fc1df"},{url:"manifest.json",revision:"8939a4ea1dee5e4a0424c47f89214c66"},{url:"site.webmanifest",revision:"8ccf1078c1ab4154785341c15fe16019"}],{ignoreURLParametersMatching:[/^utm_/,/^fbclid$/]})}));
//# sourceMappingURL=sw.js.map