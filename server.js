const http = require('http')
const express = require('express')
const app = express()
const WebSocket = require('ws')
const server = http.createServer(app)
const wss = new WebSocket.Server({ server })
port = process.env.PORT


app.use(express.static('public'))

student_queue = [];
tutor_queue = [];

class Student {
    constructor(client, name, _class, zoom_link) {
        this.client = client
        this.name = name
        this._class = _class
        this.zoom_link = zoom_link
    }
}

class Tutor {
    constructor(client, name) {
        this.client = client
        this.name = name
    }
}

function removeClient(client) {
    console.log("Disconnecting client");
    for (i = 0; i < student_queue.length; i++) {
        if (student_queue[i].client == client) {
            student_queue.splice(i, 1);
            return;
        }
    }
    for (i = 0; i < tutor_queue.length; i++) {
        if (tutor_queue[i].client == client) {
            tutor_queue.splice(i, 1);
            return;
        }
    }

}

function noop() { }

function heartbeat() {
    this.isAlive = true;
}

wss.on('connection', (client) => {
    console.log("A ws connected!")

    client.isAlive = true;
    client.on('pong', heartbeat);

    client.on('message', (msg) => {
        // try {
        const parsed = JSON.parse(msg);
        if (parsed.type == "student") {
            if (parsed.action == "enqueue") {
                student_queue.push(new Student(client, parsed.name, parsed.class, parsed.zoom_link))
            }
        }
        else if (parsed.type == "tutor") {
            if (parsed.action == "enqueue") {
                tutor_queue.push(new Tutor(client, parsed.name))
            }
        }
        console.log(`Client ${parsed.name} sent a message: ${msg}`);
        // } catch (e) {
        //     console.log("error saving client");
        // }
    })
    client.on('close', () => {
        removeClient(client);
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
}, 1000);

function match() {
    while (student_queue.length > 0 && tutor_queue.length > 0) {
        s = student_queue.shift()
        t = tutor_queue.shift()
        t.client.send(`Meet with your student, ${s.name}, here: <a target="_blank" href=${s.zoom_link}>${s.zoom_link}</a>. Resubmit this form when you are finished helping the student to get the next student from the queue.`);
        s.client.send(`Your tutor, ${t.name}, will join your zoom meeting shortly.<br>After this tutor is done helping you, resubmit this form to rejoin the queue.`);

    }
    tutor_queue.forEach(t => {
        t.client.send("Waiting for students...");
    })
    for (i = 0; i < student_queue.length; i++) {
        student_queue[i].client.send(`There are ${i} people ahead of you in the queue.`)
    }
}

const matchInterval = setInterval(match, 1000)

wss.on('close', function close() {
    clearInterval(pingInterval)
    clearInterval(match)
})

server.listen(port, "0.0.0.0", () => console.log(`Listening on port ${port}`))
