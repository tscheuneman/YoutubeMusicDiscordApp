import cheerio from 'cheerio';
import request from 'request';
export default class YoutubeHelper {
    constructor() {

    }

    searchYoutube(term) {
        return new Promise((resolve, reject) => {
            request('http://m.youtube.com/results?search_query='+term, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    const $ = cheerio.load(body);
                    let link = $('.yt-lockup-content').first();
        
                    let href = $('a.yt-uix-tile-link', link).first().attr('href');
                    let title = $('a.yt-uix-tile-link', link).first().attr('title');
                    
                    if(href === undefined) {
                        href = $('a.yt-uix-tile-link', link).first().attr('href');
                    }
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
                else {
                    console.log(error);
                    console.log(response);
                    reject(response.statusCode);
                }
              })
        });
    }
}