import cheerio from 'cheerio';
import request from 'request';

export default class YoutubeHelper {
    constructor() {

    }

    searchYoutube(term) {
        return new Promise((resolve, reject) => {
            if(typeof(term) !== 'string') {
                resolve({
                    videoTitle: 'Error, Not Found',
                    videoID: '0lhhrUuw2N8'
                });
            } else {
                try {
                    request('http://m.youtube.com/results?search_query='+term, function (error, response, body) {
                        if (!error && response.statusCode == 200) {
                            const $ = cheerio.load(body);
                            let link = $('.yt-lockup-content').first();
                
                            let href = $('a.yt-uix-tile-link', link).first().attr('href');
                            let title = $('a.yt-uix-tile-link', link).first().attr('title');
                            
                            if(href === undefined) {
                                resolve({
                                    videoTitle: 'Error, Not Found',
                                    videoID: '0lhhrUuw2N8'
                                });
                            } else {
                                href = href.replace('/watch?v=', '');
                                if(href !== undefined) {
                                    resolve({
                                        videoTitle: title,
                                        videoID: href
                                    });
                                } else {
                                    console.log(error);
                                    console.log(response);
                                    reject(response.statusCode);
                                }
        
                            }
                        }
                        else {
                            console.log(error);
                            console.log(response);
                            reject(response.statusCode);
                        }
                      });
                } catch(err) {
                    reject('not worky');
                    console.log(err);
                }
            }
        });
    }
}