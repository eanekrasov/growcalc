/*jslint browser: true, indent: 2, plusplus: true */

Raphael.fn.drawGrid = function (x, y, w, h, wv, hv, color) {
  "use strict";
  color = color || "#000";

  var i,
    path = ["M", Math.round(x) + 0.5, Math.round(y) + 0.5, "L", Math.round(x + w) + 0.5, Math.round(y) + 0.5, Math.round(x + w) + 0.5, Math.round(y + h) + 0.5, Math.round(x) + 0.5, Math.round(y + h) + 0.5, Math.round(x) + 0.5, Math.round(y) + 0.5],
    rowHeight = h / hv,
    columnWidth = w / wv;
  for (i = 1; i < hv; i++) {
    path = path.concat(["M", Math.round(x) + 0.5, Math.round(y + i * rowHeight) + 0.5, "H", Math.round(x + w) + 0.5]);
  }
  for (i = 1; i < wv; i++) {
    path = path.concat(["M", Math.round(x + i * columnWidth) + 0.5, Math.round(y) + 0.5, "V", Math.round(y + h) + 0.5]);
  }
  return this.path(path.join(",")).attr({stroke: color});
};

Raphael.fn.popup = function (x, y, width, text, size) {
  "use strict";
  size = size || 5;
  text = text || "";
  var res = this.set(),
    d = 3;
  res.push(this.path().attr({
    fill: "#333333",
    stroke: "#333333"
  }));
  res.push(this.text(x, y, text).attr({
    fill: "#fff",
    font: "12px Helvetica, Arial, sans-serif"
  }));
  res.update = function (dX, dY, WIDTH, TEXT) {
    dX = dX || x;
    dY = dY || y;
    this[1].attr({text: TEXT});
    var mmax = Math.max,
      mmin = Math.min,
      bb = this[1].getBBox(),
      w = bb.width / 2,
      h = bb.height / 2,
      dir = (dX - bb.width < 15) ? 3 : 1,
      X = (dir === 1) ? dX : dX + WIDTH,
      Y = dY,
      dx = [0, w + size * 2, 0, -w - size * 2],
      dy = [-h * 2 - size * 3, -h - size, 0, -h - size],
      p = ["M", X - dx[dir], Y - dy[dir], "l", -size, (dir === 2) * -size, -mmax(w - size, 0), 0, "a", size, size, 0, 0, 1, -size, -size, "l", 0, -mmax(h - size, 0), (dir === 3) * -size, -size, (dir === 3) * size, -size, 0, -mmax(h - size, 0), "a", size, size, 0, 0, 1, size, -size, "l", mmax(w - size, 0), 0, size, !dir * -size, size, !dir * size, mmax(w - size, 0), 0, "a", size, size, 0, 0, 1, size, size, "l", 0, mmax(h - size, 0), (dir === 1) * size, size, (dir === 1) * -size, size, 0, mmax(h - size, 0), "a", size, size, 0, 0, 1, -size, size, "l", -mmax(w - size, 0), 0, "z"].join(","),
      xy = [{
        x: X,
        y: Y + size * 2 + h
      }, {
        x: X - size * 2 - w,
        y: Y
      }, {
        x: X,
        y: Y - size * 2 - h
      }, {
        x: X + size * 2 + w,
        y: Y
      }][dir];
    xy.path = p;
    this.attr(xy);
    return this;
  };
  return res.update(x, y, width, text);
};

Raphael.fn.label = function (x, y, text, direction, border, size) {
  "use strict";
  size = size || 5;
  text = text || "";
  var res = this.set(),
    d = 3;
  this.rPath = (border)
    ?
    (this.path().attr({ fill: "#333333", stroke: "#333333" }))
    :
    false;
  this.rText = this.text(x, y, text).attr({
    fill: ((border) ? "#fff" : "#333"),
    font: "14px Helvetica, Arial, sans-serif"
  }),
  
  this.update = function (dX, dY, TEXT) {
    dX = dX || x;
    dY = dY || y;
    this.rText.attr({text: TEXT});
    var mmax = Math.max,
      mmin = Math.min,
      bb = this.rText.getBBox(),
      w = bb.width / 2,
      h = bb.height / 2,
      dir = direction, // || (dX - bb.width < 15) ? 3 : 1,
      X = (dir === 1) ? dX : dX, // + WIDTH,
      Y = (dir === 2) ? dY : dY, // + HEIGHT,
      dx = [0, w + size * 2, 0, -w - size * 2],
      dy = [-h * 2 - size * 3, -h - size, 0, -h - size],
      p,
      xy = [{
        x: X,
        y: Y + size * 2 + h
      }, {
        x: X - size * 2 - w,
        y: Y
      }, {
        x: X,
        y: Y - size * 2 - h
      }, {
        x: X + size * 2 + w,
        y: Y
      }][dir];
    if (border) {
      p = ["M", X - dx[dir], Y - dy[dir], "l", -size, (dir === 2) * -size, -mmax(w - size, 0), 0, "a", size, size, 0, 0, 1, -size, -size, "l", 0, -mmax(h - size, 0), (dir === 3) * -size, -size, (dir === 3) * size, -size, 0, -mmax(h - size, 0), "a", size, size, 0, 0, 1, size, -size, "l", mmax(w - size, 0), 0, size, !dir * -size, size, !dir * size, mmax(w - size, 0), 0, "a", size, size, 0, 0, 1, size, size, "l", 0, mmax(h - size, 0), (dir === 1) * size, size, (dir === 1) * -size, size, 0, mmax(h - size, 0), "a", size, size, 0, 0, 1, -size, size, "l", -mmax(w - size, 0), 0, "z"].join(",");
      this.rPath.attr({path: p});
      this.rPath.attr(xy);
    }
    this.rText.attr(xy);
    return this;
  };
  return this.update(x, y, text);
};