const iframeContainer = document.getElementById("iframe-container");

if (window == window.parent) {
  const myIframe = document.createElement("iframe");
  myIframe.setAttribute("src", window.location.href);

  const mySpan = document.createElement("span");
  mySpan.innerText = window.location.href;

  iframeContainer.appendChild(mySpan);
  iframeContainer.appendChild(myIframe);
}
