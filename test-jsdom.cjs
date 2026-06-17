const jsdom = require("jsdom");
const { JSDOM } = jsdom;
JSDOM.fromURL("http://localhost:5001", {
  runScripts: "dangerously",
  resources: "usable"
}).then(dom => {
  dom.window.document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        console.log("HTML:", dom.window.document.body.innerHTML.substring(0, 500));
    }, 2000);
  });
  dom.window.addEventListener("error", (event) => {
    console.error("JSDOM ERROR:", event.error);
  });
});
