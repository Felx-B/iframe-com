const mainContainer = document.getElementById("main-container");
const childrenDiv = document.getElementById("children");
const idDiv = document.getElementById("id");
const innerDiv = document.getElementById("inner");
const parentDiv = document.getElementById("parent");

let iframes = {};

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
  childrenDiv.innerText += firstIframeId;
  idDiv.innerText += "mainPage";
  window.onmessage = async (m) => {
    if (m.ports && m.data.type === "createChild") {
      const id = createIframe(m.data.parent);
      m.ports[0].postMessage(id);
    }
    if (m.ports && m.data.type == "getProperty") {
      const result = await askTargetGetProperty(
        iframes[m.data.childId],
        m.data.childId,
        m.data.propertyName
      );
      m.ports[0].postMessage(result);
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
  iframes[id] = myIframe.contentWindow;
  return id;
}

function iframeInit() {
  onmessage = (e) => {
    // console.log("in iframe", e);
    if (e.data.type == "init") {
      idDiv.innerHTML += e.data.id;
      myId = e.data.id;
      parentDiv.innerHTML += e.data.parent;
      parentId = e.data.parent;
    }
    if (e.data.type == "getProperty") {
      e.ports[0].postMessage(window[e.data.propertyName]);
    }
  };

  const myBtn = document.createElement("button");
  myBtn.onclick = () => createChild();
  myBtn.innerText = "Create Child";
  mainContainer.appendChild(myBtn);
  window.innerId = Math.random().toString().substring(2, 8);
  innerDiv.innerText += window.innerId;
}

async function createChild() {
  const childId = await askParentoToCreateChildIframe();
  childrenDiv.innerText += ` ${childId}`;
  childrenIds.push(childId);

  const myBtn = document.createElement("button");
  myBtn.onclick = () => getChildProperty(childId);
  myBtn.innerText = `Get ${childId} property`;
  mainContainer.appendChild(myBtn);
}

function askParentoToCreateChildIframe() {
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    // this will fire when iframe will answer
    channel.port1.onmessage = (e) => resolve(e.data);
    // let iframe know we're expecting an answer
    // send it its own port
    window.parent.postMessage({ type: "createChild", parent: myId }, "*", [
      channel.port2,
    ]);
  });
}

async function getChildProperty(childId) {
  const result = await askTargetGetProperty(window.parent, childId, "innerId");
  console.log(`myId is ${myId} innerId of iframe ${childId} is ${result}`);
}

function askTargetGetProperty(target, childId, propertyName) {
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    // this will fire when iframe will answer
    channel.port1.onmessage = (e) => resolve(e.data);
    // let iframe know we're expecting an answer
    // send it its own port
    target.postMessage({ type: "getProperty", childId, propertyName }, "*", [
      channel.port2,
    ]);
  });
}
