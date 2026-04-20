document.querySelectorAll(".nav-btn").forEach(btn => {
btn.onclick = () => {
document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
btn.classList.add("active");

document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
document.getElementById(btn.dataset.view).classList.add("active");

};
});

document.getElementById("toggleAdvanced").onclick = () => {
document.getElementById("advancedMenu").classList.toggle("hidden");
};

const chat = document.getElementById("chat");
const input = document.getElementById("globalInput");

document.getElementById("sendBtn").onclick = () => {
const msg = input.value;
if (!msg) return;

const div = document.createElement("div");
div.innerHTML = "<b>You:</b> " + msg;
chat.appendChild(div);

setTimeout(() => {
const ai = document.createElement("div");
ai.innerHTML = "<b>AI:</b> Processing " + msg;
chat.appendChild(ai);

document.getElementById("panelContent").innerText = "AI thinking...";

}, 500);

input.value = "";
};

document.getElementById("generateBtn").onclick = () => {
const prompt = document.getElementById("prompt").value;

document.getElementById("results").innerHTML = "Generating...";

setTimeout(() => {
document.getElementById("results").innerHTML =
"<p>Scene 1</p><p>Scene 2</p><p>Scene 3</p>";

document.getElementById("panelContent").innerText =
  "Generated scenes for: " + prompt;

}, 1000);
};
