const exspress = require('express')
const app = exspress()

app.listen(3000)

let index = 0
const fs = require('fs')
const url = require('url')
const gbk = require('gbk') 
const JSDOM = require('jsdom').JSDOM 
const segment = require('segment') 

let seg = new segment()
seg.useDefault()

//设置跨域访问
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    next();
});

app.use('/getMsg', (req, res) => {
    // console.log(req.query);

    getUrl(req.query.str, data => { 
        let dom = new JSDOM(data)
        let document = dom.window.document
        let innerhtml = document.querySelector('body').innerHTML.replace(/<[^>]+>/g, "") //去掉所有html标签
        let arr = seg.doSegment(innerhtml)

        let myarr = []
        arr.forEach(data => {
            if (data.w != '的'&& data.w != '是'&& /^[\u3220-\uFA29]+$/.test(data.w)) { //去掉无用的字符,去掉英文
                myarr.push(data.w)
            }
        });

        //计算词出现个数
        var myJson = {}
        myarr.forEach(data => {
            if (!myJson[data]) {
                myJson[data] = 1
            } else {
                myJson[data]++
            }
        })
        // 去掉出现次数是1的词
        let arr2 = []
        for (let word in myJson) {
            if (myJson[word] <= 1) {
                continue
            }
            arr2.push({
                w: word,
                c: myJson[word]
            })
        }

        arr2.sort((a, b) => b.c - a.c) //按arr2.c排序



        res.send({
            'words': arr2
        })

    })

    // res.send({
    //     ok: 1
    // })

})

function getUrl(sUrl, success) {
    index++
    let http = ''
    let urlObj = url.parse(sUrl)
    if (urlObj.protocol == 'http:') {
        http = require('http')
    } else {
        http = require('https')
    }
    let req = http.request({
        'hostname': urlObj.hostname,
        'path': urlObj.path
    }, res => {

        if (res.statusCode == 200) {
            let arr = []
            let str = ''
            res.on('data', buffer => {
                str += buffer
            })
            res.on('end', () => {
                success && success(str)
            })
        } else if (res.statusCode == 302 || res.statusCode == 301) {
            console.log(`我是第${index}次重定向`);

            getUrl(res.headers.location, success) 
        }

    })
    req.end()
    req.on('error', () => {
        console.log('404');
    })
}


app.use(exspress.static('./'))