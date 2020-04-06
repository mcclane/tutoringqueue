ws = new WebSocket(`wss://${window.location.host}`)

ws.onopen = function (event) {
    console.log("ws open")
    document.getElementById("enqueue_button").onclick = send_enqueue
}

ws.onmessage = function (event) {
    document.getElementById("message").innerHTML = ""
    info = JSON.parse(event.data)
    queue_html = "Queue:<br><ul>"
    info.queue.forEach(function (s) {
        queue_html += `<li>${s.name} ${s.class} <a href="${s.zoom_link} target="_blank">${s.zoom_link}</a> <input value="mark helped" type="button" onclick="mark_helped('${s.id}')"/></li>`
    })
    queue_html += "</ul><br>Recents:"
    info.recent.forEach(function (s) {
        queue_html += `<li>${s.name} ${s.class} <a href="${s.zoom_link} target="_blank">${s.zoom_link}</a></li>`
    })

    document.getElementById("message").innerHTML = queue_html
}

function send_enqueue() {
    console.log("enqueue")
    ws.send(`{"type": "student", "action": "enqueue", "name": "${document.getElementById("name").value}", "class": "${document.getElementById("class").value}", "zoom_link": "${document.getElementById("zoom").value}"}`)
}

function mark_helped(id) {
    console.log("mark helped")
    ws.send(JSON.stringify({
        action: "mark_helped",
        id: id
    }))
}