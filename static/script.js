const mainContainer = document.getElementById("main-container");
const mainTitle = document.getElementById("title");

let parentId;
let myId;
let childrenIds = [];

// On main page init -> create first iframe
if (window == window.parent) {
  mainPageInit();
} else {
  iframeInit();
}

function mainPageInit() {
  const firstIframeId = createIframe("mainPage");
  document.getElementById("children").innerText += ` ${firstIframeId}`;
  window.onmessage = (m) => {
    console.log("main page", m);
    if (m.ports && m.data.type === "createChild") {
      const id = createIframe(m.data.parent);
      m.ports[0].postMessage(id);
    }
  };
}

// Create iframe, generate id, set id in iframe, and return id to the caller
function createIframe(parentId) {
  const myIframe = document.createElement("iframe");
  myIframe.setAttribute("src", window.location.href);
  mainContainer.appendChild(myIframe);

  const id = Math.random().toString().substring(2, 8);
  setTimeout(() => {
    myIframe.contentWindow.postMessage({ type: "init", id, parent: parentId });
  }, 100);
  return id;
}

function setParent(id) {
  mainTitle.innerHTML += ` My Parent is ${id}`;
  parentId = id;
}

function setId(id) {
  mainTitle.innerHTML = `My ID is ${id}`;
  myId = id;
}

function iframeInit() {
  onmessage = (e) => {
    console.log("in iframe", e);
    if (e.data.type == "init") {
      setId(e.data.id);
      setParent(e.data.parent);
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
  childrenIds.push(childId);
}

function askParentoToCreateChildIframe(target) {
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    // this will fire when iframe will answer
    channel.port1.onmessage = (e) => resolve(e.data);
    // let iframe know we're expecting an answer
    // send it its own port
    target.postMessage({ type: "createChild", parent: myId }, "*", [
      channel.port2,
    ]);
  });
}
