const mainContainer = document.getElementById("main-container");
const mainTitle = document.getElementById("title");

// On main page init -> create an iframe
if (window == window.parent) {
  mainPageInit();
} else {
  iframeInit();
}

function mainPageInit() {
  createIframe();
  window.onmessage = (m) => {
    console.log("main page", m);
    if (m.ports && m.data === "createChild") {
      const id = createIframe();
      m.ports[0].postMessage(id);
    }
  };
}

function createIframe() {
  const myIframe = document.createElement("iframe");
  myIframe.setAttribute("src", window.location.href);
  mainContainer.appendChild(myIframe);

  const id = Math.random().toString().substring(2, 8);
  setTimeout(() => {
    myIframe.contentWindow.postMessage({ id });
  }, 100);
  return id;
}

function setId(id) {
  mainTitle.innerHTML = `My ID is ${id}`;
}

function iframeInit() {
  onmessage = (e) => {
    console.log("in iframe", e);
    if (e.data.id) {
      setId(e.data.id);
    }
  };

  const myBtn = document.createElement("button");
  myBtn.onclick = () => createChild();
  myBtn.innerText = "Create Child";
  mainContainer.appendChild(myBtn);
}

async function createChild() {
  const childId = await askParentoToCreateChildIframe(window.parent);
  document.getElementById("children").innerText += ` ${childId}`;
  // TODO stocker les ids de tous les enfants
}

function askParentoToCreateChildIframe(target) {
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    // this will fire when iframe will answer
    channel.port1.onmessage = (e) => resolve(e.data);
    // let iframe know we're expecting an answer
    // send it its own port
    target.postMessage("createChild", "*", [channel.port2]);
  });
}
