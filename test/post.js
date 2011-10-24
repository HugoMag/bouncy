var test = require('tap').test;
var bouncy = require('bouncy');
var http = require('http');
var Stream = require('net').Stream;

test('POST with http', function (t) {
    var port = Math.floor(Math.random() * (Math.pow(2,16) - 1e4) + 1e4);
    t.plan(4);
    var s = bouncy(function (req, bounce) {
        t.equal(req.headers.host, 'localhost:' + port);
        
        var data = '';
        var alive = true;
        
        var stream = new Stream;
        stream.writable = true;
        stream.readable = true;
        
        stream.write = function (buf) {
            data += buf.toString();
            if (alive && data.match(/pow!/)) {
                t.ok(true, 'got post data');
                stream.end();
                alive = false;
            }
        };
        
        bounce(stream);
        
        stream.emit('data', [
            'HTTP/1.1 200 200 OK',
            'Content-Type: text/plain',
            'Connection: close',
            '',
            'oh hello'
        ].join('\r\n'));
        
        stream.emit('end');
    });
    
    s.listen(port, function () {
        var opts = {
            method : 'POST',
            host : 'localhost',
            port : port,
            path : '/'
        };
        var req = http.request(opts, function (res) {
            t.equal(res.headers['content-type'], 'text/plain');
            
            var data = '';
            res.on('data', function (buf) {
                data += buf.toString();
                if (data === 'oh hello') {
                    t.equal(data, 'oh hello');
                    res.socket.end();
                    s.close();
                    t.end();
                }
            });
        });
        req.write('pow!');
        req.end();
    });
});
