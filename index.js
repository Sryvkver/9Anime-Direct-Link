const express = require('express');
const chrome = require('puppeteer');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;
const qualityText = "&q=480p";

//app.engine('pug', require('pug').__express)
app.set('views', __dirname + '/views');
app.set('view engine', 'pug');
app.use(express.static(__dirname+"/public"));

app.get('/', (request, response) => {
    response.sendFile( __dirname + "/" + "index.htm" );
    //response.render('test', { title: 'TEST' });
});

app.get('/process', async (request, response) =>  {
    let link9Anime = request.query.link;
    if(link9Anime == "TEST"){
        response.render('test', { 'directLink': 'Hey just a Test!' });
        return;
    }
    console.clear();
    console.log("Checking:", link9Anime);
    let directLink = await chromeGoto(link9Anime);
    //response.send(directLink);
    response.render('test', { 'directLink': directLink });
});

app.get('/test', (request, response) => {
    response.render('test', { 'directLink': 'http://127.0.0.1:3000' });
});

app.listen(port, (err) => {
    if (err) {
        return console.log('something bad happened', err);
    }
    console.log(`server is listening on ${port}`);
});


let playBtnSelector = '#player > div.cover';
let iframeSelector = '#player > iframe';
function chromeGoto(url){
    return new Promise(async resolve => {
        const browser = await chrome.launch();
        const page = await browser.newPage();
        //Disable Picture loading
        await page.setRequestInterception(true);
        page.on('request', request => {
            if (request.resourceType() === 'image')
              request.abort();
            else
              request.continue();
          });
        
        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 3000000
        });
        await page.screenshot({path: 'public/example.png', fullPage: true});
        await page.click(playBtnSelector);
        await wait(1000);
        let iframeLink = await page.evaluate((sel) => {
            return $('#player > iframe')[0].src;
        }, iframeSelector);
        await browser.close();
        console.log("Finished", iframeLink);
        let directLink = await processRapidVideo(iframeLink+qualityText);
        resolve(directLink);
    });
}

let regex = /<source src=".*.mp4" type/gmi;
function processRapidVideo(url){
    return new Promise(async resolve => {
        let html = await axios.get(url);
        let finding = regex.exec(html.data);
        if(finding.length < 1){
            resolve("Fuck!");
            return;
        }
        let directLink = finding[0];
		directLink = directLink.replace('<source src="', "").replace('" type', "");
		console.log(directLink);
        resolve(directLink);
    });
}

function wait(ms){
    return new Promise(resolve=>{
        setTimeout(resolve, ms);
    })
}