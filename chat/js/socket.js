
var socket;
var userid = ""
var curclient = 0
var allwords ={}
var msgTipCount ={}
function connect() {  
	var host = "ws://" + "127.0.0.1" + ":9001/"
	if (socket) socket.close();

	socket = new WebSocket(host);
	try {
		socket.onopen = function (msg) {
			console.log("connect suc")
			if (userid == "lin") {
       			sendlogin("lin", "111")
			}
		};

		socket.onmessage = function (msg) {
			if (typeof msg.data == "string") {  
				console.log(msg.data)
				info = msg.data.replace(new RegExp(/(')/g),'"');
				var js=JSON.parse(info);  
				dealMsg(js)
			} else {
				console.log("非文本消息");
			}
		};
		socket.onclose = function (msg) { 
			console.log("socket close！")
        	showneterr()
		};
	} catch (ex) {
		console.log(ex);
	}
}
function dealMsg(msg) {
	if (msg.msgid == 'text') {
		var curtm = getFormatDate()
		if ( userid == "guest") {
			show_talk(msg.type, msg.text, curtm)
		} else {
			var id = msg.playerid
			if (id == curclient) {
				show_talk(msg.type, msg.text, curtm)
				msgTipCount[curclient]++;
			} else {
				if (allwords[id] === undefined) {
					allwords[id] = []
					msgTipCount[id] = 0
				}
				allwords[id].push([msg.type, msg.text, curtm])
        		$('#p'+id+' span').html(allwords[id].length-msgTipCount[id])
			}
		}
	} else if (msg.msgid == 'addplayer') {
		addplayer(msg.playerid)
	} else if (msg.msgid == 'removeplayer') {
		removeplayer(msg.playerid)
	}

}
//1 "odd"=>客服    2 "even"=>访客
function show_talk(type, talk_word, curtm) {
    var classtype = type==1?"odd":"even"
    var name = ""
    var list = '<li class="'+classtype+'">\
		            <a class="user" href="#">\
		            	<img class="img-responsive avatar_" src="images/avatar-'+type+'.png" alt="">\
		            	<span class="user-name">'+name+'</span>\
		            </a>\
		            <div class="reply-content-box">\
		                <span class="reply-time">'+curtm+'</span>\
		                <div class="reply-content pr">\
		                    <span class="arrow">&nbsp;</span>\
		                    <pre>'+talk_word+'</pre>\
		                </div>\
		            </div>\
		        </li>'
    $('#talk_content').append(list)
    var h = $(document).height()-$(window).height();
    $(document).scrollTop(h);  
}
//提示信息
function showneterr() {
    var str = '<div class="reply-content pr talk_hint">网络连接中断! 请检查您的网络 或者刷新页面</div>'
    $('#talk_content').append(str);
}

function send(){//1客服2用户
    var talk_word = $('#talk_word').val()
    if (talk_word.length==0 || talk_word==='') {
        return
    }
    $('#talk_word').val("")
	if (socket.readyState!=1) {
		showneterr()
		return
	}

    var type = userid=="guest"?2:1
    var curtm = getFormatDate()
    show_talk(type, talk_word, curtm)
    sendmsg(talk_word)
    if (type == 1) {
	    var h = $('#panel-content2 ul').height()-$(window).height();
	    $('#panel-content2').scrollTop(h+120); 
	    if (allwords[curclient]) {
			allwords[curclient].push([type, talk_word, curtm])
			msgTipCount[curclient]++;
		}
    }
} 
function sendmsg(msg) {
	socket.send(JSON.stringify({
		"msgid": "text", 
		"clientid": curclient,
		"id": userid,
		"text": msg,
	}));
}
function sendlogin(user, pwd) {
	var str = '{"msgid":"login", "id":"'+userid+'", "user": "'+user+'", "pwd": "'+pwd+'"}';
	socket.send(str)
}

window.onbeforeunload = function () {
	try {
		socket.close();
		socket = null;
	} catch (ex) {
	}
};























function getFormatDate(){    
    var nowDate = new Date();     
    var year = nowDate.getFullYear();    
    var month = nowDate.getMonth() + 1 < 10 ? "0" + (nowDate.getMonth() + 1) : nowDate.getMonth() + 1;    
    var date = nowDate.getDate() < 10 ? "0" + nowDate.getDate() : nowDate.getDate();    
    var hour = nowDate.getHours()< 10 ? "0" + nowDate.getHours() : nowDate.getHours();    
    var minute = nowDate.getMinutes()< 10 ? "0" + nowDate.getMinutes() : nowDate.getMinutes();    
    var second = nowDate.getSeconds()< 10 ? "0" + nowDate.getSeconds() : nowDate.getSeconds();    
    return year + "-" + month + "-" + date+" "+hour+":"+minute+":"+second;    
} 
