ws = new WebSocket(`ws://${window.location.host}`)
ws.onopen = function (event) {
    document.getElementById("enqueue_button").onclick = function () {
        ws.send(`{"type": "student", "action": "enqueue", "name": "${document.getElementById("name").value}", "class": "${document.getElementById("class").value}", "zoom_link": "${document.getElementById("zoom").value}"}`)
    }
}
ws.onmessage = function (event) {
    document.getElementById("message").innerHTML = event.data;
}