const Discord = require('discord.js');
const ytdl = require('ytdl-core');
const client = new Discord.Client();
const axios = require('axios');
const fs = require('fs');
require('dotenv').config()

let activeConnection = null;
const MESSAGE_DELETE_TIMEOUT = 7500;
const queue = [];

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
  let goOn = false;

    if(msg.content.startsWith('!music')) {
        goOn = true;
    }

  if (goOn) {
    let content = msg.content;
    let result = content.replace('!music', '').trim();

    const voiceChannel = msg.member.voice.channel;

    if(result === "queue" || result ==='help' || result === "stop" || result === "next" || result === "skip" || result === "pause" || result === "resume" || result.includes('queue remove') || result.includes('queue delete')) {
        switch(result) {
            case 'queue':
                sendQueue(msg);
                break;
            case 'next': case 'skip':
                goNext(voiceChannel);
                break;
            case 'pause':
                activeConnection.pause();
                break;
            case 'resume':
                activeConnection.resume();
                break;
            case 'stop':
                voiceChannel.leave();
                break;
            case 'help':
                sendHelpText(msg);
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
                            queue.forEach((elm, index) => {
                                if(cnt >= from && cnt <= to) {
                                    delete queue[index];
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
            axios.get('https://www.googleapis.com/youtube/v3/search', {
                params: {
                    part: 'snippet',
                    q: result,
                    topicID: '/m/04rlf',
                    maxResults: 1,
                    key: process.env.YOUTUBE_KEY
                  }
            }).then(result => {
                if(result.data.items[0]) {
                    const videoDetails = result.data.items[0];
                    const videoTitle = videoDetails.snippet.title;
                    const videoID = videoDetails.id.videoId;
                    if(queue.length === 0) {
                        queue.push({videoTitle, videoID});
                        playVideo(voiceChannel, {videoTitle, videoID});
                    } else {
                        queue.push({videoTitle, videoID});
                        msg.reply('Added '+decodeURIComponent(videoTitle)+' to queue').then(message => {
                            message.delete({timeout: MESSAGE_DELETE_TIMEOUT});
                        }).catch(err => {
                            console.log(err);
                        });
                    }
    
                }
                
            }).catch(err => {
                console.log(err);
                console.log('somethng went wrong');
            });
            
        }
    }
    msg.delete();
  }
});

function sendQueue(msg) {
    let queueString = '';
    let cnt = 0;
    queue.forEach(elm => {
        if(cnt === 0) {
            queueString += '**Now Playing: ' + decodeURIComponent(elm.videoTitle) +'**\n';
        } else {
            queueString += cnt + '. ' + decodeURIComponent(elm.videoTitle) +'\n';
        }
        cnt++;
    });
    if(queue.length === 0) {
        msg.reply("The queue is empty").then(message => {
            message.delete({timeout: MESSAGE_DELETE_TIMEOUT});
        }).catch(err => {
            console.log(err);
        });
    } else {
        msg.reply("The queue looks like this\n"+queueString).then(message => {
            message.delete({timeout: MESSAGE_DELETE_TIMEOUT});
        }).catch(err => {
            console.log(err);
        });
    }
}

function sendHelpText(msg) {
    let returnString = 'These are the commands\n';

    returnString += '**queue** - *Show the queue*\n';
    returnString += '**next | skip** - *Go to next song*\n';
    returnString += '**pause** - *Pause the music*\n';
    returnString += '**resume** - *Resume Music*\n';
    returnString += '**stop** - *Stop the bot and disconnect*\n';
    returnString += '**queue delete [start-end]** - *Remove elements from the queue. start and end should be numbers*\n';

    msg.reply(returnString).then(message => {
        message.delete({timeout: 20000});
    }).catch(err => {
        console.log(err);
    });

}

function playVideo(voiceChannel, obj) {
    voiceChannel.join().then(async connection => {
        const stream = ytdl('https://www.youtube.com/watch?v='+obj.videoID, { filter: 'audioonly' });

        const dispatcher = connection.play(stream, {bitrate: 256});
        activeConnection = dispatcher;
        dispatcher.on('finish', () => {
            goNext(voiceChannel);
        });
    
        dispatcher.on('error', (err) => {
            console.log(err);
        });
    });
}

function goNext(voiceChannel) {
    if(queue.length > 0) {
        queue.shift();
        let tmpQueue = [...queue];
        let next = tmpQueue.shift();
        if(next) {
            playVideo(voiceChannel, next);
        }
    }
}

client.login(process.env.BOT_TOKEN);