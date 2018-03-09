# _*_ coding:utf-8 _*_
from websocket_server import WebsocketServer
import json
import bot
waiterMgr = {}
clientMgr = {}
# 当新的客户端连接时会提示
def new_client(client, server):
    print("New client connected and was given id %d" % client['id'])
    server.send_message(client, "{'msgid':'text','text':'XX科技人工客服正在为您服务', 'type':1}")
    text = "请回复数字666查询问题目录，回复数字888转接人工服务"
    data = {'msgid': 'text', 'text': text, 'type': 1}
    sendmsg(server, client, data)

    clientMgr[client['id']] = client
    clientMgr[client['id']]['waiter'] = ""
    clientMgr[client['id']]['basestr'] = ""

#当旧的客户端离开
def client_left(client, server):
    id = client['id']
    if clientMgr.has_key(id):
        if clientMgr[id]['waiter'] != "":
            sendmsg(server, clientMgr[id]['waiter'], {'msgid':'removeplayer','playerid':id})
        clientMgr.pop(id)
    for id in waiterMgr:
        if waiterMgr[id]['client'] == client:
            count = len(waiterMgr[id]['boy'])
            for i in waiterMgr[id]['boy']:
                clientMgr[i]['waiter'] = ""
            break
    print("Client(%d) disconnected" % client['id'])

#接收客户端的信息。
def message_received(client, server, msg):
    print msg
    x = json.loads( msg);
    delaMsg(client, server, x)
    # try:
    #     x = json.loads( msg);
    #     delaMsg(client, server, x)
    # except:
    #     print "msg is not json data or json data err"
    #     print msg

def findWaiter(client, server):
    min = 100000
    for key in waiterMgr:
        count = len(waiterMgr[key]['boy'])
        if min > count:
            min = count
            id = key
    if min < 100000:
        waiterMgr[id]['boy'][client['id']] = client
        clientMgr[client['id']]['waiter'] = waiterMgr[id]['client']
        sendmsg(server, waiterMgr[id]['client'], {'msgid':'addplayer','playerid': client['id']})


def sendmsg(server, client, data):
    server.send_message(client, json.dumps(data))

def botanswer(client, msg):
    if msg['text'].isdigit():
        id = client['id']
        if msg['text'] == '666':
            clientMgr[client['id']]['basestr'] = ""
        index = clientMgr[client['id']]['basestr']+msg['text']
        if bot.answer.has_key(index):
            num = int(msg['text'])
            if num<10 or num>100:
                clientMgr[id]['basestr'] = index
            data = {'msgid': 'text', 'text': bot.answer[index], 'playerid': id,'type': 1}
            sendmsg(server, client, data)
            if clientMgr[id]['waiter'] != "":
                sendmsg(server, clientMgr[id]['waiter'], data)

def delaMsg(client, server, msg):
    id = msg['id']
    if msg['msgid'] == "text":
        if waiterMgr.has_key(id): #客服端
            if client == waiterMgr[id]['client']:
                clientid = msg['clientid']
                if clientMgr.has_key(clientid):
                    sendmsg(server, clientMgr[clientid], {'msgid':'text','text':msg['text'],'type':1})
        else:#游客端

            botanswer(client, msg)
            if clientMgr[client['id']]['waiter'] == "":
                findWaiter(client, server)
            if clientMgr[client['id']]['waiter'] != "":
                data = {
                    'msgid':'text',
                    'playerid': client['id'],
                    'text': msg['text'],
                    'type':2,
                }
                sendmsg(server, clientMgr[client['id']]['waiter'], data)

        print("Client(%d) said: %s" % (client['id'], msg['text']))
    elif msg['msgid'] == "login":
        user = msg['user']
        pwd = msg['pwd']
        if waiterMgr.has_key(id):
            pass
        else:
            waiterMgr[id] = {}
            waiterMgr[id]['boy'] = {}
        waiterMgr[id]['client'] = client
        print "waiter %s is login"%user

if __name__ == '__main__':
    PORT = 9001
    server = WebsocketServer(PORT, "0.0.0.0")
    server.set_fn_new_client(new_client)
    server.set_fn_client_left(client_left)
    server.set_fn_message_received(message_received)
    server.run_forever()