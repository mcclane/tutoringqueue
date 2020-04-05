ws = new WebSocket("ws://localhost:3000")
ws.onopen = function (event) {
    document.getElementById("enqueue_button").onclick = function () {
        ws.send(`{"type": "tutor", "action": "enqueue", "name": "${document.getElementById("name").value}"}`)
    }
}
ws.onmessage = function (event) {
    document.getElementById("message").innerHTML = event.data;
}