const mainContainer = document.getElementById("main-container");
const childrenDiv = document.getElementById("children");
const idDiv = document.getElementById("id");
const innerDiv = document.getElementById("inner");
const parentDiv = document.getElementById("parent");

let iframes = {};
let parentId, myId;
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
      const result = await askTarget(iframes[m.data.childId],m.data);
      m.ports[0].postMessage(result);
    }
    if (m.ports && m.data.type == "callMethod") {
      const result = await askTarget(iframes[m.data.childId], m.data);
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
  // Wait until iframe is ready, and init id and parent id
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
    if (e.data.type == "callMethod") {
      e.ports[0].postMessage(
        window[e.data.methodName].apply(this, e.data.parameters)
      );
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
  const childId = await askTarget(window.parent, {
    type: "createChild",
    parent: myId,
  });
  childrenDiv.innerText += ` ${childId}`;
  childrenIds.push(childId);

  const myBtn = document.createElement("button");
  myBtn.onclick = () => getChildProperty(childId);
  myBtn.innerText = `Get ${childId} inner ID`;
  mainContainer.appendChild(myBtn);
  const myBtnFn = document.createElement("button");
  myBtnFn.onclick = () => callChildMethod(childId);
  myBtnFn.innerText = `Call ${childId} method`;
  mainContainer.appendChild(myBtnFn);
}

async function getChildProperty(childId) {
  const result = await askTarget(window.parent, {
    type: "getProperty",
    childId,
    propertyName: "innerId",
  });
  console.log(`myId is ${myId} innerId of iframe ${childId} is ${result}`);
}

function compute(a, b) {
  return `${myId} - ${a * b}`;
}

async function callChildMethod(childId) {
  const result = await askTarget(window.parent, {
    type: "callMethod",
    childId,
    methodName: "compute",
    parameters: [7, 3],
  });
  console.log(
    `myId is ${myId} compute method of iframe ${childId}, with parameters ${[
      7, 3,
    ]} is "${result}"`
  );
}

function askTarget(target, message) {
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    // this will fire when iframe will answer
    channel.port1.onmessage = (e) => resolve(e.data);
    // let iframe know we're expecting an answer
    // send it its own port
    target.postMessage(message, "*", [channel.port2]);
  });
}
