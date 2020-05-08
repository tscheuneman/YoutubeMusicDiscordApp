import Discord from 'discord.js';
import ytdl from 'ytdl-core';
import dotenv from 'dotenv'
dotenv.config();

import YoutubeHelper from './Helpers/YoutubeHelper.js';
import {actionTerms, helpTerms} from './Helpers/Dictionary.js';

const client = new Discord.Client();
const Youtube = new YoutubeHelper();
let activeConnection = {};

const MESSAGE_DELETE_TIMEOUT = 7500;
const QUEUE_MESSAGE_TIMEOUT = 15000;
const queue = {};

let activator = process.env.ACTIVATOR ? process.env.ACTIVATOR : '!music';
let videoActivator = process.env.VIDEO_ACTIVATOR ? process.env.VIDEO_ACTIVATOR : '!video';

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
  let goOn = false;

    if(msg.content.startsWith(activator)) {
        goOn = true;
    }
    if(videoActivator) {
        let content = msg.content;
        let result = content.replace(videoActivator, '').trim();

        postVideo(msg, result);
    }

  if (goOn) {
    let content = msg.content;
    let result = content.replace(activator, '').trim();

    const guild = msg.guild.id;
    const voiceChannel = msg.member.voice.channel;

    if(queue[guild] === undefined) {
        queue[guild] = [];
    }
    let msgTimeout = MESSAGE_DELETE_TIMEOUT;


    if(actionTerms.includes(result) || result.includes('queue remove') || result.includes('queue delete')) {
        switch(result) {
            case 'queue':
                sendQueue(msg);
                break;
            case 'next': case 'skip':
                goNext(voiceChannel, guild);
                break;
            case 'pause':
                activeConnection[guild].pause();
                break;
            case 'resume':
                activeConnection[guild].resume();
                break;
            case 'stop':
                voiceChannel.leave();
                break;
            case 'help':
                sendHelpText(msg);
                msgTimeout = 10000;
                break;
            default:
                if(result.includes('queue remove') || result.includes('queue delete')) {
                    let start = result.indexOf('[');
                    let end = result.indexOf(']');
                    if( start > 0 && end > 0) {
                        let substring = result.substring(start + 1, end);
                        let range = substring.split('-');
                        if(range[0] && range[1] && !Number.isNaN(Number.parseInt(range[0]) !== NaN) && !Number.isNaN(Number.parseInt(range[1]) !== NaN)) {
                            const from = Number.parseInt(range[0]);
                            const to = Number.parseInt(range[1]);
                            let cnt = 0;
                            queue[guild].forEach((elm, index) => {
                                if(cnt >= from && cnt <= to) {
                                    delete queue[guild][index];
                                }
                                cnt++;
                            });
                        }
                    }
                }
        }
        
    } else {
        if(!voiceChannel) {
            msg.reply('You need to join a voice channel bruh');
        } else {
            Youtube.searchYoutube(result).then(result => {
                if(queue[guild].length === 0) {
                    queue[guild].push({...result});
                    playVideo(voiceChannel, {...result}, guild);
                } else {
                    queue[guild].push({...result});
                    msg.reply('Added '+decodeURIComponent(result.videoTitle)+' to queue').then(message => {
                        message.delete({timeout: MESSAGE_DELETE_TIMEOUT});
                    }).catch(err => {
                        console.log(err);
                    });
                }
            }).catch(err => {
                console.log(err);
            }); 
        }
    }
    setTimeout(() => {
        msg.delete();
      }, msgTimeout);
  }
});

function postVideo(msg, result) {
    Youtube.searchYoutube(result).then(result => {
        msg.reply(`Here's ${result.videoTitle} https://www.youtube.com/watch?v=${result.videoID}`)
    }).catch(err => {
        console.log(err);
    }); 
}

function sendQueue(msg) {
    const guild = msg.guild.id;

    let queueString = '';
    let cnt = 0;
    queue[guild].forEach(elm => {
        if(cnt === 0) {
            queueString += '**Now Playing: ' + decodeURIComponent(elm.videoTitle) +'**\n';
        } else {
            queueString += cnt + '. ' + decodeURIComponent(elm.videoTitle) +'\n';
        }
        cnt++;
    });
    if(queue[guild].length === 0) {
        msg.reply("The queue is empty").then(message => {
            message.delete({timeout: MESSAGE_DELETE_TIMEOUT});
        }).catch(err => {
            console.log(err);
        });
    } else {
        msg.reply("The queue looks like this\n"+queueString).then(message => {
            message.delete({timeout: QUEUE_MESSAGE_TIMEOUT});
        }).catch(err => {
            console.log(err);
        });
    }
}

function sendHelpText(msg) {
    let returnString = 'These are the commands\n';

    let terms = Object.keys(helpTerms);
    terms.forEach((elm) => {
        returnString += `**${elm}** - *${helpTerms[elm]}*\n`;
    });

    msg.reply(returnString).then(message => {
        message.delete({timeout: 20000});
    }).catch(err => {
        console.log(err);
    });
}

function playVideo(voiceChannel, obj, guild) {
    voiceChannel.join().then(async connection => {
        const stream = ytdl('https://www.youtube.com/watch?v='+obj.videoID, { quality: 'highestaudio', filter: 'audioonly' });
        const dispatcher = connection.play(stream, {volume: 0.5, bitrate: 256});
        activeConnection[guild] = dispatcher;
        dispatcher.on('finish', () => {
            goNext(voiceChannel, guild);
        });
        dispatcher.on('error', (err) => {
            console.log(err);
        });
    }).catch(err => {
        console.log(err);
    });
}

function goNext(voiceChannel, guild) {
    if(queue[guild].length > 1) {
        queue[guild].shift();
        let tmpQueue = [...queue[guild]];
        let next = tmpQueue.shift();
        if(next) {
            playVideo(voiceChannel, next, guild);
        }
    }
}

client.login(process.env.BOT_TOKEN);