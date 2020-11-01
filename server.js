const WebSocket = require('ws');
const { ServerResponse } = require('http');

const config = require("./config.json")
const token = config.token
const port = config.port

const server = new WebSocket.Server({ port: port || 3000 });

const selfbot = require('selfbot.js');
const bot = new selfbot.Client();


let LogChannelID 

bot.on('message', (msg) => {
    let json = JSON.stringify({author: msg.author.username, message: msg.content})
    
    if(msg.channel.id != LogChannelID && msg.channel.type != 'dm') return

    server.clients.forEach(client => {
        client.send(json)
    })
})

server.on('connection', (client) => {
    client.on('message', (message) => {
        let obj = JSON.parse(message)
        if (obj['Action'] === 'Keep-Alive') {
            client.send(JSON.stringify({
                Action: 'Keep-Alive'
            }))
        }
        else if(obj['Action'] === 'Send-Message') {
            let msg = obj['Content']
            let server = obj['ServerId']
            let channel = obj['ChannelId']
            let userid = obj['UserId']
            let type = obj['Type']

            if (type === 'Server') {
                let serverobj = bot.guilds.get(server)
                let channelobj = serverobj.channels.get(channel)

                channelobj.send(msg)
                LogChannelID = channel;
            }
            else if (type === 'DM') {
                LogChannelID = userid
                bot.fetchUser(userid).then(user => {
                    user.send(msg)
                })
            }

            
        }
    })
})

server.on('listening', () => {
    console.log(`Server is ready, and listening on port ${port}.`)
})
bot.on('ready', () => {
    console.log('Discord Bot is ready.')
})

bot.login(token)