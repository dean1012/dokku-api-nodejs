const express = require('express')
const app = express()
const net = require('net')
const bodyParser = require('body-parser')

const socket = net.createConnection('/var/run/dokku-daemon/dokku-daemon.sock')

app.use(bodyParser.urlencoded({ extended: false }))

function send_command(command, callback) {
  try {
    socket.write(command + "\n");
  } catch (error) {
    callback(error.message, null, null)
    return
  }

  socket.removeAllListeners('data').on('data', function (data) {
    let str = data.toString().replace(/\u001b.*?m/g, '').trim()
    let obj = null

    try {
      console.log("trying to parse: " + str)
      obj = JSON.parse(str)
    } catch (error) {
      callback(error.message, null, null)
      return
    }

    let ok = obj.ok
    let output = obj.output

    callback(null, ok, output)
  })

  socket.removeAllListeners('error').on('error', function (error) {
    callback(error.message, null, null)
  })
}

app.post('/', function (req, res) {
  send_command(req.body.command, function (error, ok, output) {
    if (error) {
      res.status(400).json({"ok": false, "output": error})
      return
    }

    res.json({"ok": ok, "output": output})
  })
})

let server = app.listen(process.env.PORT, function () {
  let host = server.address().address
  let port = server.address().port

  console.log('Listening at http://%s:%s', host, port)
})
