const helpmessage = {
    thumbnail:{
        "url":"https://cdn.discordapp.com/avatars/771901747844349982/7186eca8776a5498ca1ebeafbd559ae5.webp?size=128"
    },
    "footer":{
        "icon_url":"https://t3.rbxcdn.com/ef3c033a3a0185fa573a4ce992aff776",
        "text": "Please report any bugs you encounter with the bot. | Deployed "+new Date()
    },
    "title": "Myth Bot Commands List",
    "description": "Command Prefix: $",
    "color": 0xff0000,
    "fields":[
        {
            "name": "c1 || $c1",
            "value": "A command ranklocked to Associates, which will promote the user to Clearance I in the Roblox group."
        },
        {
            "name": "gamesheet || $gamesheet",
            "value": "This command will return the Google Spreadsheet used to store myth game submissions.",
            "inline": true
        },
        {
            "name": "hiring || $hiring",
            "value": "This command will **only work in the bot's dms.** This command allows users to submit a request to hire others, whether it be for scripting, building, etc."
        },
        {
            "name": "mythsubmit || $mythsubmit",
            "value": "This command will **only work in the bot's dms.** The myth game submission command will (anonymously) request that a myth's game be publically posted.",
            "inline": true
        },
        {
            "name": "randomgame || $randomgame",
            "value": "The random game command will randomly select a publically posted myth game and return the link of said game to the user."
        },
        {
            "name": "globalmessage [text] || $globalmessage [text]",
            "value": "This command is rank-locked to Server Administrators, and will message all running Containment Facility servers with the text given."
        },
        {
            "name": "rank [rank] [target username, case sensitive] || $rank [rank] [user]",
            "value": "Another command rank-locked to Server Administrators, this command will rank the specified member in the ROBLOX group to the specified rank."
        },
        {
            "name": "__Other Functionalities__",
            "value": "Automatic Promotion upon MKA Competion,\nHandles HTTP Post requests for the Department Activity Bot,\nHandles Global Message HTTP Requests"
        }
    ]
}

const express = require("express");
const app = express();
const noblox = require("noblox.js");
const Discord = require("discord.js");
const client = new Discord.Client();
const {GoogleSpreadsheet} = require("google-spreadsheet");
const creds = require("./client_secret.json");
const doc = new GoogleSpreadsheet("1HQEzbINMqrIVBtQtqs_iw2EMLFU7h7OUuiAXRKpUjbM")
const cookiedoc = new GoogleSpreadsheet("1ya_MsmGFkIYIe223NsYt3Eag0jMfnOrdaXXTRZ3BthQ");
const fetch = require("node-fetch");

let linkinggames = []
let gamelinkers = []
let pending = {}
let hiringdetails = []
let hiringdetailsMessageContent = {}
let hiringPaymentInfo = {}
let peoplehiringpending = {}
let hiringembedid = {}
let currentlyactive = false
let shuttingdownservers = false

let globalmessagecd = false
let globalmessagestatus = "empty"

async function signinDiscord(){
    client.login(process.env.token)
    currentlyactive = true
}

app.get("/globalmessage",(req,res)=>{
    res.send(globalmessagestatus)
})

const spamactive = false

function sendusermessageforspam(channel){
    channel.send("hey lol")
    setTimeout(sendusermessageforspam,1000,channel)
}

let modid = "744795716324687963" // ROLE ID for what roles can ACCEPT or DECLINE games

async function banuserfromdisc(message){
    let substr = message.content.substring(7)
    if(substr!=""&&substr!=null){
        if(message.member.roles.cache.get(modid)||message.member.hasPermission(8)){
            noblox.getIdFromUsername(substr).then(userid=>{
                globalmessagestatus = "cfban "+userid.toString()
                globalmessagecd = true
                function resetmessage(){
                    globalmessagestatus = "empty"
                    globalmessagecd = false
                }
                setTimeout(resetmessage,2000)
            }).catch(err=>{
                message.channel.send("Failed to get user id from username. Please make sure you entered the username properly, case sensitive.")
            })
        }
    }
}

app.use(express.json());

client.on("ready",()=>{
    client.guilds.cache.each(svr=>{
        console.log("server name "+svr.name)
    })
    if(spamactive==true){
        let guild = client.guilds.cache.get("381898228410482711")
        let id = "236921470075273216" // user id
        guild.members.fetch(id).then(user=>{
            user.createDM().then(channel=>{
                sendusermessageforspam(channel)
            })
        })
    }
})

app.get("/teleportstuff",(req,res)=>{
    if(!shuttingdownservers){
        res.send("no")
    }else if(shuttingdownservers==true){
        res.send("yes")
    }
})

/*client.on("message",message=>{
    
})*/

let mainguild = "381898228410482711" // guild for the submissions
let mainchannel = "771198619121614849" // channel where ACCEPTED games go
let revchannel = "771200119067508786" // channel where games UNDER REVIEW go
let hiringRevChannel = revchannel // CHANNEL ID FOR WHERE HIRING REQUESTS UNDER REVIEW GO
let hiringAccChannel = "771194803790675988" // CHANGE LATER!!! this is the channel for ACCEPTED games

let testingguild = "740682184813182987" // this is just the guild for testing stuff
let testroleid = "767854901706620928"
let testchannel = "744781549391708250";

client.on("guildMemberAdd",memb=>{
    if(memb.guild.id=="381898228410482711"){ //381898228410482711
        memb.roles.add('744905187394846755');
        console.log("Successfully gave user role");
    }
})

async function updateCookieDoc(txt){
    await cookiedoc.useServiceAccountAuth(creds);
    await cookiedoc.loadInfo();
    const sheet = cookiedoc.sheetsByIndex[0];
    await sheet.loadCells();
    let cell = sheet.getCellByA1("A1");
    cell.value = txt;
    await sheet.saveUpdatedCells();
}

async function c1CommandUsed(message){
    let name = message.member.nickname || message.author.username;
    try{
        noblox.getIdFromUsername(name).then(()=>{
            console.log("user exists"); // im only doing this because for some reason the fucking .catch at the bottom isnt working
        })
    }
    catch(err){
        message.channel.send("Unable to find username. Is your Discord nickname/username the same as the Roblox account you're trying to rank?");
        console.log(err);
    }
    noblox.getIdFromUsername(name).then(id=>{
        async function rest(){
            let res = await fetch('https://inventory.roblox.com/v1/users/'+id+'/items/Badge/2124515269')
            let ret = await res.json();
            let res2 = await fetch('https://inventory.roblox.com/v1/users/'+id+'/items/Badge/714605033')
            let ret2 = await res2.json();
            if(ret.data==""&&ret2.data==""){
                message.channel.send("You do not have the MKA Badge.\nTo rank up to Clearance I, please complete the Myth Knowledge Assessment at: `https://www.roblox.com/games/4664906557/RM-Myth-Knowledge-Assessment`")
            }else{
                message.channel.send("Badge found, attempting to rank...").then(newmsg=>{
                    noblox.setRank({group:1106775,target:id,rank:10}).then(res=>{
                        newmsg.edit("Successfully ranked to Clearance 1. You should be given the Clearance 1 role, and if not, run !getroles.");
                        message.member.roles.add("767070892097667085")
                        message.member.roles.remove("767071170624880672")
                    }).catch(err=>{
                        message.channel.send("An error has occurred. Check the console for more information.")
                        console.log(err)
                    })
                })
            }
        }
        noblox.getRankInGroup(1106775,id).then((currentrank)=>{
            console.log(currentrank);
            if(currentrank==1){
                rest();
            }else{
                message.channel.send("This command can only be used by Associates in the group. Are you sure the bot hasn't automatically promoted you already?");
            }
        }).catch(err=>{
            message.channel.send("An error has occurred.");
            console.log(err);
        })
    }).catch(err=>{
        message.channel.send("Unable to find username. Is your Discord nickname the same as the Roblox account you're trying to rank?")
        console.log(err);
    })
}

async function randomgame(message){
    await doc.useServiceAccountAuth(creds);
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];
    await sheet.loadCells();
    let num = 0;
    for(i=1;1<1000;i++){
        let cell = sheet.getCellByA1(`A${i}`);
        if(cell.value==null){
            break;
        }else{
            num=num+1
        }
    }
    let random = Math.floor(Math.random()*Math.floor(num))
    let cell = sheet.getCellByA1(`A${random}`);
    console.log(cell.value);
    if(cell.value!=null&&cell.value!="Game Link"){
        message.channel.send("Random Game Selection: `"+cell.value+"`");
    }else{
        let ncell = sheet.getCellByA1(`A2`)
        message.channel.send("Random Game Selection: `"+ncell.value+"`");
    }
}

async function gametosheet(link){
    await doc.useServiceAccountAuth(creds);
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];
    await sheet.loadCells();
    for(i=1;i<1000;i++){
        let cell = sheet.getCellByA1(`A${i}`)
        if(cell.value==null||cell.value==link){
            cell.value = link
            break;
        }
    }
    async function updatecells(sheet){
        await sheet.saveUpdatedCells();
    }
    setTimeout(updatecells,5000,sheet);
}

async function addgame(message){
    let substr = message.content.substring(8);
    await doc.useServiceAccountAuth(creds);
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];
    await sheet.loadCells();
    let found = false
    for(i=1;i<1000;i++){
        let cell = sheet.getCellByA1(`A${i}`)
        if(cell.value==null){
            found = true
            message.channel.messages.fetch(substr).then(msg=>{
                console.log("message found");
                msg.embeds.forEach(current=>{
                    console.log(current.fields[0].value);
                    cell.value = current.fields[0].value;
                    message.channel.send("Cell updated.");
                })
            }).catch(err=>{
                message.channel.send(err);
            })
            break;
        }
    }
    console.log("updating cells")
    async function save(sheet){
        await sheet.saveUpdatedCells();
        console.log("saved")
    }
    setTimeout(save,5000,sheet);
    if(!found){
        message.channel.send("Available cell not found");
    }
}

async function login(txt){
  await noblox.setCookie(txt);
  noblox.getPlayerInfo(75151039).then(res=>{
    console.log(res);
    return "success!"
  })
}

//set cookie
async function botStartSetCookie(){
    await cookiedoc.useServiceAccountAuth(creds);
    await cookiedoc.loadInfo();
    const sheet = cookiedoc.sheetsByIndex[0];
    await sheet.loadCells();
    let cell = sheet.getCellByA1("A1");
    login(cell.value);
}


app.post("/admincommandlogs",(req,res)=>{
    let guild = client.guilds.cache.get("381898228410482711")
    let chnl = guild.channels.cache.get("745129451754356737")
    let user = req.body.username
    let cmd = req.body.command
    if(user!="illucyte"&&user!="5pisak"&&user!="PapaBreadd"){
        chnl.send(`User ${user} used the ${cmd} command!`)
        res.send("complete")
    }else{
        res.send("wlist")
    }
})

async function promoteuser(id,message,req){
  noblox.setRank({group: 1106775, target: id, rank: 10}).then(res=>{
    console.log("Success!");
      if(message){
        message.channel.send("Successfully ranked user.");
      }
      if(req){
        req.send("success")
        noblox.getUsernameFromId(id).then(username=>{
        console.log("USERNAME OBTAINED FROM ID")
        let guild = client.guilds.cache.get(rmMainServerId);
        guild.members.fetch().then(memberlist=>{
            console.log("MEMBER LIST FOUND")
            let member = guild.members.cache.find(u=>u.nickname==username||u.user.username==username)
            try{
                console.log("GIVING ROLEEEE")
                member.roles.add("767070892097667085")
                member.roles.remove("767071170624880672")
            }catch(err){
                console.log(err)
            }
        }).catch(err=>{
            console.log(err)
        })
        })
      }
  }).catch(err=>{
    console.log("An error has occured ranking a user. Id: "+id);
    console.log(err);
    client.guilds.fetch('381898228410482711').then(guild=>{
      let channel = guild.channels.cache.get('771916520631828490');
      channel.send("Automated rank failure for user id "+id+".\n"+err+" <@236921470075273216>");
    })
  })
}

app.post("/setrank",(req,res)=>{
  promoteuser(req.body.target,false,res);
})

app.get("/",(req,res)=>{
  console.log("GET request received, probably ping");
  res.send("Ping received and handled accordingly.");
})

async function removecooldown(id){
    let indexnum = gamelinkers.indexOf(id);
    gamelinkers.splice(indexnum,1);
}
async function cancelrequest(message){
    linkinggames.forEach(currentid=>{
        if(currentid==message.author.id){
            let index = linkinggames.indexOf(message.author.id)
            linkinggames.splice(index);
            message.channel.send("Your request has timed out.")
        }
    })
}

async function removecd(uid,message){
    if(peoplehiringpending[uid]){
        delete peoplehiringpending[uid]
        message.channel.send("Your cooldown on hiring has been removed.")
    }
}

async function cancelhiringrequest(uid,message){
    let first = hiringdetails.indexOf(uid);
    let second = hiringdetails.indexOf(uid+"DETAILS");
    let third = hiringdetails.indexOf(uid+"ACCPENDING");
    if(first!=-1){
        hiringdetails.splice[first,1]
    }
    if(second!=-1){
        hiringdetails.splice[second,1]
    }
    if(third!=-1){
        hiringdetails.splice[third,1]
    }
    if(hiringdetailsMessageContent[uid]){
        delete hiringdetailsMessageContent[uid]
    }
    if(hiringPaymentInfo[uid]){
        delete hiringPaymentInfo[uid]
        message.channel.send("Your request has been cancelled.")
    }
    setTimeout(removecd,600000,uid,message)
}

async function stuff(message,currentid,indexnum){
    linkinggames.splice(indexnum,1);
    message.channel.send("Okay, your game will be sent for review.");
    let guild = client.guilds.cache.get(mainguild)
    let channel = guild.channels.cache.get(revchannel);
    gamelinkers.push(message.author.id);
    setTimeout(removecooldown,600000,message.author.id);
    pending[message.content] = message.author.id
    console.log(pending)
    let newmsg = await channel.send({embed:{
        'title': 'Game Submission'
    }})
    await newmsg.edit({embed:{
        'title': 'Game Submission',
        'timestamp': new Date(),
        'color':0xff0000,
        'thumbnail':{
            'url': 'https://t7.rbxcdn.com/63bdf06ecb8eb208f4d9ac5c491ff005'
        },
        'author':{
            'name': message.author.tag,
            'icon_url': message.author.defaultAvatarURL
        },
        'fields':[
            {
                'name': '__Game Link__',
                'value': message.content
            },
            {
                'name': '__Acceptance ID__',
                'value': newmsg.id
            }
        ]
    }})
}

// department activity posting
const medServerId = "448131740561833994"
const hubdoc = new GoogleSpreadsheet("1-zndqaDpIPC4nPVtn8xHg95qc8UOFXwRcc0ZP58anAk")
const tfServerId = "768839871480725575"
const sentinelServerId = "768672474950664193"
const rmMainServerId = "381898228410482711"
const scientificServerId = "404727889775427585"
const toiletScrubberId = "590036133908447233"
const pogDeptId = "771857719690919946"
const receptionid = "468837623096672289"
const humanresourcesid = "785908962255306773"

async function updateactivityforanyserver(id,req,res){
    console.log("request received")
    await hubdoc.useServiceAccountAuth(creds);
    await hubdoc.loadInfo()
    const sheet = hubdoc.sheetsByIndex[0]
    await sheet.loadCells()
    for(i=1;i<75;i++){
        console.log("running first loop")
        let cell = sheet.getCellByA1(`A${i}`)
        if(cell.value==id){
            console.log("Server found")
            let newsheetid = sheet.getCellByA1(`D${i}`)
            const newdoc = new GoogleSpreadsheet(newsheetid.value)
            try{
                console.log("new sheet reached")
                await newdoc.useServiceAccountAuth(creds)
                await newdoc.loadInfo()
                const nsheet = newdoc.sheetsByIndex[0]
                await nsheet.loadCells()
                let testcell = nsheet.getCellByA1("D1")
                testcell.value = "test stuff"
                await nsheet.saveUpdatedCells()
                for(x=1;x<1000;x++){
                    console.log("second loop reached")
                    let ncell = nsheet.getCellByA1(`A${x}`)
                    if(ncell.value==req.body.username){
                        let timecell = nsheet.getCellByA1(`B${x}`)
                        let hourcell = nsheet.getCellByA1(`C${x}`)
                        if(timecell.value==null){
                            timecell.value=req.body.time
                            console.log("TIME UPDATED")
                        }else{
                            let currenttime = Number(timecell.value)
                            let newnumber = Number(req.body.time)+currenttime
                            timecell.value=newnumber.toString()
                        }
                        await nsheet.saveUpdatedCells()
                        hourcell.formula = `=${Number(timecell.value)/60}`
                        await nsheet.saveUpdatedCells()
                        await res.send("successfully updated activity")
                        break
                    }else if(ncell.value==null){
                        console.log("cell is empty, adding username time and hours")
                        ncell.value = req.body.username
                        let timecell = nsheet.getCellByA1(`B${x}`)
                        timecell.value = req.body.time
                        let hourcell = nsheet.getCellByA1(`C${x}`)
                        hourcell.formula = `=${Number(req.body.time)/60}`
                        await nsheet.saveUpdatedCells()
                        await res.send("successfully updated activity")
                        break
                    }
                }
            }catch(err){
                console.log(err)
                res.send("error")
            }
            break
        }
    }
}
// DONT FORGET THAT ITS REQ.USERNAME AND REQ.TIME
app.post("/medical",(req,res)=>{
    updateactivityforanyserver(medServerId,req,res)
})
app.post("/taskforce",(req,res)=>{
    updateactivityforanyserver(tfServerId,req,res)
})
app.post("/sentinels",(req,res)=>{
    updateactivityforanyserver(sentinelServerId,req,res)
})
app.post("/executive",(req,res)=>{
    updateactivityforanyserver(rmMainServerId,req,res)
})
app.post("/scientific",(req,res)=>{
    updateactivityforanyserver(scientificServerId,req,res)
})
app.post("/janitorial",(req,res)=>{
    updateactivityforanyserver(toiletScrubberId,req,res)
})
app.post("/romtech",(req,res)=>{
    updateactivityforanyserver(pogDeptId,req,res)
})
app.post("/reception",(req,res)=>{
    updateactivityforanyserver(receptionid,req,res)
})
app.post("/humresources",(req,res)=>{
    updateactivityforanyserver(humanresourcesid,req,res)
})


client.on("message",(message)=>{
    let prefix = "$"
    if(!message.author.bot){
        if(message.content.toLowerCase()==prefix+"c1"){
            c1CommandUsed(message);
        }
        else if(message.content.toLowerCase()==prefix+"gamesheet"){
            message.channel.send("https://docs.google.com/spreadsheets/d/1HQEzbINMqrIVBtQtqs_iw2EMLFU7h7OUuiAXRKpUjbM/edit?usp=sharing")
        }
        else if(message.content.startsWith("$rank ")&&message.member.hasPermission(8)){
            try{
                let base = message.content
                let words = base.split(" ")
                let name = words[1]
                let trgt = words[2].toLowerCase()
                noblox.getIdFromUsername(name).then(id=>{
                    let ranks = []
                    ranks["c1"] = 10
                    ranks["c2"] = 20
                    ranks["c3"] = 30
                    ranks["c4"] = 35
                    ranks["c5"] = 38
                    ranks["honorary"] = 85
                    ranks["notable"] = 86
                    ranks["documented"] = 88
                    ranks["contained"] = 90
                    ranks["supervisor"] = 200
                    ranks["council"] = 210
                    if(ranks[trgt]){
                        if(message.member.roles.cache.get("381901828708630558")){
                            if(trgt=="c1"||trgt=="c2"||trgt=="c3"||trgt=="c4"||trgt=="c5"){
                                noblox.setRank(1106775,id,ranks[trgt]).then(res=>{
                                    message.channel.send("Successfully ranked user "+name+" to "+trgt+".")
                                }).catch(err=>{
                                    message.channel.send("Failed to rank user. Please contact nub if this issue continues.")
                                })
                            }else{
                                message.channel.send('Members with ["The Council"] rank cannot rank members higher than Clearance V through this command.')
                            }
                        }else{
                            noblox.setRank(1106775,id,ranks[trgt]).then(res=>{
                                message.channel.send("Successfully ranked user "+name+" to "+trgt+".")
                            }).catch(err=>{
                                message.channel.send("Failed to rank user. Please contact nub if this issue continues.")
                            })
                        }
                    }else{
                        message.channel.send("The rank you provided was invalid.")
                    }
                }).catch(err=>{
                    message.channel.send("Unable to find user.\nError message: "+err)
                })
            }catch(err){
                message.channel.send("This command has errored. Correct usage is $rank [name] [rank]. Please note clearances should be referred to as (c1, c2, c3, c4, c5).\nError message: "+err)
            }
        }
        else if(message.content.startsWith("addgame ")&&message.author.id=="236921470075273216"){
            addgame(message);
        }
        else if(message.channel.id=="744927981922680983"){
            console.log("channel is suggestions")
            let sub = message.content.toLowerCase()
            let ch1 = sub.indexOf("suggestion")
            let ch2 = sub.indexOf("pros")
            let ch3 = sub.indexOf("cons")
            if(ch1!=-1&&ch2!=-1&&ch3!=-1){
                message.react("👍").then(s=>{
                    message.react("👎").then(ss=>{
                        console.log("reactions added")
                    })
                })
            }
        }
        else if(message.content.toLowerCase()==prefix+"randomgame"){
            randomgame(message);
        }
        else if(message.content.toLowerCase()==prefix+"mythsubmit"&&message.guild==null){
            let found = false
            gamelinkers.forEach(personid=>{
                if(personid==message.author.id){
                    found = true
                }
            })
            if(found==true){
                message.channel.send("You have already linked a game!")
            }
            else if(found!=true){
                message.channel.send('Please send the link of the game you would like to link.\nNote that your link must start with `"https://www.roblox.com/games/"`');
                linkinggames.push(message.author.id);
                console.log(linkinggames[0])
                setTimeout(cancelrequest,25000,message)
            }
        }
        else if(message.content.startsWith("https://www.roblox.com/games/")&&message.guild==null){
            linkinggames.forEach(function (currentid,indexnum){
                if(currentid==message.author.id){
                    stuff(message,currentid,indexnum)
                }
            })
        }
        else if(message.content.startsWith(prefix+"globalmessage ")&&message.member.hasPermission(8)){
            if(globalmessagecd==false){
                globalmessagecd = true
                globalmessagestatus = message.content.substring(15)
                function resetmessage(){
                    globalmessagestatus = "empty"
                    globalmessagecd = false
                }
                setTimeout(resetmessage,2000)
            }else{
                message.channel.send("This command is currently on a global cooldown. Please wait a few seconds before using this command again.")
            }
        }
        else if(message.content.startsWith(prefix+"accept ")){
            if(message.member.roles.cache.get(modid)||message.member.roles.cache.get("744801811495387156")){
                message.channel.messages.fetch(message.content.substring(8).toString()).then(msg=>{
                    msg.embeds.forEach(current=>{
                        if(current.fields[0].name=="__Game Link__"){
                            message.guild.channels.cache.get(mainchannel).send({embed:{
                                'title': 'Myth Game Submission',
                                'timestamp': new Date(),
                                'color':0xff0000,
                                'thumbnail':{
                                    'url':'https://t3.rbxcdn.com/ef3c033a3a0185fa573a4ce992aff776'
                                },
                                'fields':[
                                    {
                                        'name': '__Game Link__',
                                        'value': current.fields[0].value
                                    }
                                ]
                            }})
                            gametosheet(current.fields[0].value);
                            message.channel.send("Game successfully accepted.")
                            let submitter = pending[current.fields[0].value]
                            if(submitter){
                                console.log("message found")
                                let guildmember = message.guild.members.cache.get(submitter);
                                if(guildmember){
                                    console.log("guildmember found")
                                    guildmember.createDM().then(function(dmchannel){
                                        dmchannel.send("Your game submission has been accepted!")
                                    })
                                }
                                delete pending[current.fields[0].value]
                            }
                            msg.delete();
                        }
                        else if(current.fields[0].name=="__Job Details__"){
                            let usertag = current.fields[2].value.substring(14+msg.id.length)
                            message.guild.channels.cache.get(hiringAccChannel).send({embed:{
                                'title': 'Myth Hiring Submission',
                                'timestamp': new Date(),
                                'color':0xff0000,
                                'thumbnail':{
                                    'url':'https://t3.rbxcdn.com/ef3c033a3a0185fa573a4ce992aff776'
                                },
                                'footer':{
                                    'icon_url': "https://cdn.discordapp.com/embed/avatars/0.png",
                                    'text': `DM me the command $hiring if you want to hire someone.`
                                },
                                'fields':[
                                    {
                                        'name': '__Job Details__',
                                        'value': current.fields[0].value
                                    },
                                    {
                                        'name': '__Payment Information__',
                                        'value': current.fields[1].value
                                    },
                                    {
                                        'name': '__User Contact__',
                                        'value': "Message <@"+current.footer.text.substring(5)+"> ("+usertag+") for more information."
                                    }
                                ]
                            }})
                            msg.delete();
                            message.channel.send("Submission accepted.");
                            let submitter = message.guild.members.cache.get(current.footer.text.substring(5))
                            if(submitter){
                                submitter.createDM().then(chnl=>{
                                    chnl.send("Your hiring post was accepted! Congrats!");
                                })
                            }
                        }
                    })
                }).catch(err=>{
                    message.channel.send(err.message);
                })
            }
        }
        else if(message.content.startsWith(prefix+"decline ")){
            if(message.member.roles.cache.get(modid)||message.member.roles.cache.get("744801811495387156")){
                message.channel.messages.fetch(message.content.substring(9)).then(msg=>{
                    msg.embeds.forEach(current=>{
                        if(current.fields[0].name=="__Game Link__"){
                            message.channel.send("Game declined.")
                            let submitter = pending[current.fields[0].value]
                            if(submitter){
                                console.log("message found")
                                let guildmember = message.guild.members.cache.get(submitter);
                                if(guildmember){
                                    console.log("guildmember found")
                                    guildmember.createDM().then(function(dmchannel){
                                        dmchannel.send("Your game submission has been declined.")
                                    })
                                }
                                delete pending[current.fields[0].value]
                                msg.delete();
                            }
                        }else if(current.fields[0].name=="__Job Details__"){
                            message.channel.send("Hiring submission declined.");
                            msg.delete();
                            let submitter = message.guild.members.cache.get(current.footer.text.substring(5))
                            if(submitter){
                                submitter.createDM().then(chnl=>{
                                    chnl.send("Unfortunately, your submission was declined. Better luck next time.");
                                })
                            }
                        }
                    })
                }).catch(function(err){
                    message.channel.send(err.message);
                })
            }
        }
        else if(message.content.toLowerCase()==prefix+"shutdown"){
            if(message.member.roles.cache.get("466040154402979863")){
               shuttingdownservers = true
               message.channel.send("Shutting down servers.")
               async function resetShutdownVar(){
                   shuttingdownservers = false
               }
               setTimeout(resetShutdownVar,3000)
            }else{
                message.channel.send("You do not have the Developer rank.")
            }
        }


        // hiring people through the bot


        else if(message.content.toLowerCase()==prefix+"hiring"&&message.guild==null){
            if(!peoplehiringpending[message.author.id]){
                message.channel.send("What is the description of the job you're hiring for? Say $cancel at any time to cancel this request. If you're on cooldown, I will notify you when you can use this command again.");
                hiringdetails.push(message.author.id)
                peoplehiringpending[message.author.id] = "true"
            }
            else{
                message.channel.send("You're currently on command cooldown, or you are already running this command.");
            }
        }
        else if(hiringdetails.find(element=>element==message.author.id)&&!message.content.startsWith(prefix)){
            if(message.guild==null){
                let userindex = hiringdetails.indexOf(message.author.id);
                hiringdetails.splice(userindex,1);
                console.log("USERID REMOVED, ASKING FOR PAYMENT")
                console.log(hiringdetails[userindex])
                message.channel.send("Got it. What is your payment for this job?");
                hiringdetails.push(message.author.id+"DETAILS");
                hiringdetailsMessageContent[message.author.id] = message.content
            }
        }



        else if(hiringdetails.find(element=> element==message.author.id+"DETAILS"&&!message.content.startsWith(prefix))){
            let userindex = hiringdetails.indexOf(message.author.id+"DETAILS")
            hiringdetails.splice(userindex,1);
            hiringdetails.push(message.author.id+"ACCPENDING")
            hiringPaymentInfo[message.author.id] = message.content
            message.channel.send({embed:{
                'title': 'Hiring Submission',
                "timestamp": new Date(),
                'footer':{
                    "icon_url":"https://cdn.discordapp.com/embed/avatars/0.png",
                    "text": "Submitted by "+message.author.tag
                },
                'color':0xff0000,
                'thumbnail':{
                    'url':'https://t3.rbxcdn.com/ef3c033a3a0185fa573a4ce992aff776'
                },
                'fields':[
                    {
                        'name': '__Job Details__',
                        'value': hiringdetailsMessageContent[message.author.id]
                    },
                    {
                        'name': '__Payment Information__',
                        'value': message.content
                    }
                ]
            }}).then(newmsg=>{
                console.log("EMBED ID SET")
                hiringembedid[message.author.id]=newmsg.id
                console.log(newmsg.id)
                console.log(hiringembedid[message.author.id])
            })
            message.channel.send("This is what your request will look like. Are you sure you want to proceed? If so, please say 'yes'. If not, say 'no'. This request will time out after 60 seconds.");
            setTimeout(cancelhiringrequest,60000,message.author.id,message);
        }
        else if(message.content.toLowerCase()=="yes"&&hiringdetails.find(element=> element==message.author.id+"ACCPENDING")){
            let accpendingIndex = hiringdetails.indexOf(message.author.id+"ACCPENDING")
            hiringdetails.splice(accpendingIndex,1)
            console.log(hiringdetails[accpendingIndex])
            console.log("ARRAY spliceD")
            message.channel.send("Your request has been posted. Good luck.");
            let guild = client.guilds.cache.get(mainguild);
            let channel = guild.channels.cache.get(hiringRevChannel);
            channel.send("A hiring request has been posted by "+message.author.tag+". Please say '$accept [acceptance id]' or '$decline [acceptance id]'").then(newmsg=>{
                console.log(hiringembedid[message.author.id])
                message.channel.messages.fetch(hiringembedid[message.author.id]).then(embedid=>{
                    embedid.embeds.forEach(cembed=>{
                        newmsg.edit({embed:{
                            'title': 'Hiring Submission',
                            "timestamp": new Date(),
                            'footer':{
                                "icon_url":"https://cdn.discordapp.com/embed/avatars/0.png",
                                "text": "UID: "+message.author.id
                            },
                            'color':0xff0000,
                            'thumbnail':{
                                'url':'https://t3.rbxcdn.com/ef3c033a3a0185fa573a4ce992aff776'
                            },
                            'fields':[
                                {
                                    'name': '__Job Details__',
                                    'value': cembed.fields[0].value
                                },
                                {
                                    'name': '__Payment Information__',
                                    'value': hiringPaymentInfo[message.author.id]
                                },
                                {
                                    "name": "__Acceptance ID__",
                                    "value": newmsg.id+` - Created by ${message.author.tag}`
                                }
                            ]
                        }}).then(edited=>{
                            delete hiringembedid[message.author.id]
                            console.log("id deleted")
                            if(hiringPaymentInfo[message.author.id]){
                                try{
                                    delete hiringPaymentInfo[message.author.id]
                                }catch(err){
                                    console.log(err)
                                }
                                cancelhiringrequest(message.author.id,message)
                            }
                        })
                    })
                })
            })
        }
        else if(message.content.toLowerCase()=="no"&&hiringdetails.find(element=> element==message.author.id+"ACCPENDING")){
            let accpendingIndex = hiringdetails.indexOf(message.author.id+"ACCPENDING")
            hiringdetails.splice(accpendingIndex,1)
            delete peoplehiringpending[message.author.id]
            cancelhiringrequest(message.author.id,message)
        }
        else if(message.content.toLowerCase().startsWith(prefix+"cfban ")){
            banuserfromdisc(message)
        }
        else if(message.content.toLowerCase()==prefix+"cancel"){
            try{
                delete hiringPaymentInfo[message.author.id]
            }catch(err){
                console.log(err)
            }
            cancelhiringrequest(message.author.id,message)
            message.channel.send("Your request has been cancelled.")
            delete peoplehiringpending[message.author.id]
        }
        else if(message.guild==null&&message.author.id=="236921470075273216"){
            if(message.content.startsWith("!cookie ")){
                let substr = message.content.substring(8);
                try{
                    let res = login(substr);
                    updateCookieDoc(substr);
                    if(res=="success!"){
                        message.channel.send("Success!")
                    }
                }catch(err){
                    message.channel.send(err);
                }
            }
            else if(message.content=="!checkcookie"){
                noblox.setRank({group: 1106775, target: 916375542, rank: 10}).then(res=>{
                    message.channel.send("Successfully ranked alt account, therefore the cookie is likely valid.")
                }).catch(err=>{
                    message.channel.send("Failed to rank alt account. The cookie is probably outdated.");
                })
            }
        }else if(message.content.toLowerCase()==prefix+"help"){
            message.author.createDM().then(channel=>{
                channel.send({embed:helpmessage})
                message.channel.send("A list of commands has been sent to your dms.");
            }).catch(err=>{
                message.channel.send(err)
            })
        }
        else if(message.author.id=="236921470075273216"/*nub id*/||message.author.id=="410612687156805633"/*crab id*/){
            if(message.content.toLowerCase()=="killswitch"&&currentlyactive==true){
                message.channel.send("Shutting down client.").then(msg=>{
                    client.destroy()
                    currentlyactive = false
                })  
            }
        }
    }
})


client.on("ready",()=>{
    botStartSetCookie();
    console.log("yessir")
    try{
        client.user.setActivity("$help", {type:"LISTENING"});
    }catch(err){
        console.log(err) // this is ONLY a try catch thing because im writing this into github directly so no bugtests allowed haha
    }
})

const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

signinDiscord()
