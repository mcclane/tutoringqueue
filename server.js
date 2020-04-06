const http = require('http')
const express = require('express')
const app = express()
const WebSocket = require('ws')
const server = http.createServer(app)
const wss = new WebSocket.Server({ server })
const { v4: uuidv4 } = require('uuid');


port = process.env.PORT

app.use(express.static('public'))

student_queue = []
recent_list = []
recent_capacity = 10

class Student {
    constructor(client, name, _class, zoom_link) {
        this.id = uuidv4()
        this.client = client
        this.name = name
        this._class = _class
        this.zoom_link = zoom_link
    }
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            class: this._class,
            zoom_link: this.zoom_link
        }
    }
}

function noop() { }

function heartbeat() {
    this.isAlive = true;
}

wss.on('connection', (client) => {
    console.log("someone connected")
    send_state()

    client.isAlive = true;
    client.on('pong', heartbeat);

    client.on('message', (msg) => {
        try {
            const parsed = JSON.parse(msg);
            if (parsed.action == "enqueue") {
                student_queue.push(new Student(client, parsed.name, parsed.class, parsed.zoom_link))
                send_state()
            }
            else if (parsed.action == "mark_helped") {
                for (i = 0; i < student_queue.length; i++) {
                    if (student_queue[i].id == parsed.id) {
                        recent_list.push(student_queue[i])
                        if (recent_list.length > recent_capacity) {
                            recent_list.splice(0, recent_list.length - recent_capacity)
                        }
                        student_queue.splice(i, 1)
                        send_state()
                        return
                    }
                }
            }
        } catch (e) {
            console.log(e)
        }
    })
})

const pingInterval = setInterval(function ping() {
    wss.clients.forEach(function each(ws) {
        if (ws.isAlive === false) {
            console.log("Closing client")
            return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping(noop);
    });
}, 5000);

function send_state() {
    to_send = JSON.stringify({ queue: student_queue, recent: recent_list })
    wss.clients.forEach(function each(client) {
        if (client.readyState == WebSocket.OPEN) {
            client.send(to_send)
        }
    })
}

// const updateInterval = setInterval(send_state, 1000)

wss.on('close', function close() {
    clearInterval(pingInterval)
    clearInterval(match)
})

server.listen(port, "0.0.0.0", () => console.log(`Listening on port ${port}`))