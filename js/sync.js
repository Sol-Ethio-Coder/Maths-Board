/* Math Board sync: device-to-device (WebRTC via PeerJS). No server of your own is needed.
   The first page opened creates a room code (host). Open the link with ?room=CODE on a second device to join. */
(function () {
  var CH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  function rnd() { var s = ''; for (var i = 0; i < 5; i++) s += CH[Math.floor(Math.random() * CH.length)]; return s; }
  var Sync = { code: '', role: 'offline', conns: [], onMsg: function () {}, onStatus: function () {} };
  function count() { return Sync.conns.filter(function (c) { return c.open; }).length; }
  function status() {
    if (Sync.role === 'offline') return;
    var n = count();
    Sync.onStatus('Room ' + Sync.code + ' · ' + (n ? n + ' device' + (n > 1 ? 's' : '') + ' connected' : 'waiting for a device'));
  }
  Sync.send = function (m, except) {
    Sync.conns.forEach(function (c) { if (c !== except && c.open) { try { c.send(m); } catch (e) {} } });
  };
  Sync.sendTo = function (c, m) { if (c && c.open) { try { c.send(m); } catch (e) {} } };
  Sync.link = function () { return location.origin + '/?room=' + Sync.code; };
  function wire(c) {
    Sync.conns.push(c);
    c.on('open', function () { status(); if (Sync.role === 'host') Sync.onMsg({ op: 'peer-joined' }, c); });
    c.on('data', function (d) { Sync.onMsg(d, c); if (Sync.role === 'host') Sync.send(d, c); });
    c.on('close', function () { Sync.conns = Sync.conns.filter(function (x) { return x !== c; }); status(); });
    c.on('error', function () {});
  }
  Sync.start = function (joinCode) {
    if (!window.Peer) { Sync.onStatus('Offline: sync library not loaded'); return; }
    var host = !joinCode;
    Sync.code = joinCode || rnd();
    Sync.role = host ? 'host' : 'guest';
    var id = 'mathboard-' + Sync.code;
    var peer = new Peer(host ? id : undefined);
    peer.on('open', function () {
      if (host) status();
      else { Sync.onStatus('Joining room ' + Sync.code + '…'); wire(peer.connect(id, { serialization: 'json', reliable: true })); }
    });
    peer.on('connection', function (c) { wire(c); });
    peer.on('error', function (e) {
      if (e.type === 'unavailable-id' && host) { try { peer.destroy(); } catch (x) {} Sync.start(); }
      else if (e.type === 'peer-unavailable') Sync.onStatus('Room ' + Sync.code + ' not found. Check the code.');
      else Sync.onStatus('Sync problem (' + e.type + '). The board still works on this device.');
    });
    peer.on('disconnected', function () { try { peer.reconnect(); } catch (e) {} });
  };
  window.Sync = Sync;
})();
