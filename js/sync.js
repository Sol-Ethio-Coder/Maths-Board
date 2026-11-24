/* Math Board sync: connects two or more devices through a free public relay (MQTT over secure WebSocket).
   A relay works on any network (mobile data, different Wi-Fi), unlike direct device-to-device links.
   The first page opened creates a room code (host). Open the link with ?room=CODE on a second device to join.
   Note: the public relays are open to anyone who knows the room code, so do not draw private information. */
(function () {
  var BROKERS = ['wss://broker.hivemq.com:8884/mqtt', 'wss://broker.emqx.io:8084/mqtt', 'wss://test.mosquitto.org:8081/mqtt'];
  var CH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  function rnd(n) { var s = ''; for (var i = 0; i < n; i++) s += CH[Math.floor(Math.random() * CH.length)]; return s; }
  var me = rnd(8), seq = 0, client = null, topic = '', bi = 0, online = false, peers = {}, seen = [], timers = [], tryTimer = null;
  var Sync = { code: '', role: 'offline', broker: '', me: me, onMsg: function () {}, onStatus: function () {} };

  function count() { var now = Date.now(), n = 0; Object.keys(peers).forEach(function (k) { if (now - peers[k] < 14000) n++; }); return n; }
  function status() {
    if (Sync.role === 'offline') return;
    var base = 'Room ' + Sync.code;
    if (!online) { Sync.onStatus(base + ' · connecting…'); return; }
    var n = count();
    Sync.onStatus(base + ' · ' + (n ? n + ' other device' + (n > 1 ? 's' : '') + ' connected' : 'online, waiting for another device'));
  }
  Sync.link = function () { return location.origin + '/?room=' + Sync.code; };
  Sync.send = function (m, except) {
    if (!client || !online) return;
    m.f = me; m.i = me + (seq++);
    try { client.publish(topic, JSON.stringify(m)); } catch (e) {}
  };
  Sync.sendTo = function (c, m) { Sync.send(m); };       /* a relay broadcasts to every device in the room */

  function onPacket(buf) {
    var m; try { m = JSON.parse(buf.toString()); } catch (e) { return; }
    if (!m || typeof m !== 'object' || m.f === me || typeof m.f !== 'string') return;
    if (m.i) { if (seen.indexOf(m.i) > -1) return; seen.push(m.i); if (seen.length > 400) seen.shift(); }
    if (m.op === 'ping') {
      var isNew = !peers[m.f] || Date.now() - peers[m.f] > 14000; peers[m.f] = Date.now();
      status();
      if (isNew && Sync.role === 'host') Sync.onMsg({ op: 'peer-joined' }, null);   /* the host sends its board to a newcomer */
      return;
    }
    peers[m.f] = Date.now();
    Sync.onMsg(m, null);
  }
  function clear() { timers.forEach(clearInterval); timers = []; clearTimeout(tryTimer); }
  function connect() {
    if (!window.mqtt) { Sync.onStatus('Offline: the sync library did not load. Reload the page.'); return; }
    var url = BROKERS[bi % BROKERS.length]; Sync.broker = url; online = false; status();
    var c; try { c = mqtt.connect(url, { clientId: 'mb-' + me + '-' + Math.floor(Math.random() * 1e4), clean: true, connectTimeout: 7000, reconnectPeriod: 0, keepalive: 30 }); } catch (e) { next(); return; }
    client = c; var done = false;
    function next() { if (done) return; done = true; online = false; try { c.end(true); } catch (e) {} bi++; Sync.onStatus('Relay ' + (bi % BROKERS.length === 0 ? 'unreachable, retrying…' : 'busy, trying another…')); tryTimer = setTimeout(connect, bi % BROKERS.length === 0 ? 4000 : 400); }
    c.on('connect', function () {
      c.subscribe(topic, { qos: 0 }, function (err) {
        if (err) { next(); return; }
        online = true; status(); clear();
        var ping = function () { Sync.send({ op: 'ping', r: Sync.role }); };
        ping(); setTimeout(ping, 700); timers.push(setInterval(ping, 4000)); timers.push(setInterval(status, 3000));
      });
    });
    c.on('message', function (t, buf) { onPacket(buf); });
    c.on('error', function () { if (!online) next(); });
    c.on('close', function () { if (!done) { if (online) { online = false; status(); } next(); } });
    c.on('offline', function () { if (!online) next(); });
    setTimeout(function () { if (!online) next(); }, 9000);
  }
  Sync.start = function (joinCode) {
    var host = !joinCode;
    Sync.code = joinCode || rnd(6); Sync.role = host ? 'host' : 'guest'; topic = 'mathboard/v1/' + Sync.code;
    connect();
    window.addEventListener('online', function () { if (!online) { clearTimeout(tryTimer); connect(); } });
  };
  window.Sync = Sync;
})();
