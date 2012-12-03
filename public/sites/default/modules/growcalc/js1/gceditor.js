/*jslint browser: true, indent: 2, plusplus: false */

(function (global) {
  "use strict";
  global.GCeditor = function (elementId, updateCallback) {
    this.id = elementId;
    this.series = {};

    var $ = global.jQuery,
      r = Raphael(elementId),
      W = $("#" + elementId).width(),
      H = $("#" + elementId).height(),
      editor = this,
      margins = {left: 50, top: 20, right: 50, bottom: 40 },
      log = function (msg) {
        $.jGrowl(msg, { life: 10000 });
      };
      
    this.translateX = function (x, width) {
      return margins.left + (W - margins.left - margins.right) / (width - 1) * x;
    };

    this.translateY = function (y, height) {
      return H - margins.bottom - (H - margins.top - margins.bottom) / height * y;
    };

    this.translate = function (x, y, count) {
      return [
        this.translateX(x, count),
        this.translateY(y, 300),
        ];
    }
    this.translateBackY = function (y, height) {
      return (1 - (y - margins.top) / (H - margins.top - margins.bottom)) * 300;
    };

    this.GCSeries = function (seriesId, values, seriesColor, hasSub) {
      this.id = seriesId;
      console.log(values); 
      console.log(seriesId);
      var p = [["M"].concat(editor.translate(0, values[0], values.length))],
        color = seriesColor || ("hsb(" + Math.floor(Math.random() * 360) + "°, 1, 1)"),
        X = [],
        Y = [],
        blankets = r.set(),
        w = (W - margins.left - margins.right) / (values.length - 1) / 2,
        start = null,
        sub = (hasSub) ? (r.path().attr({stroke: "none", fill: [90, color, color].join("-"), opacity: 0}).toBack()) : false,
        path = r.path().attr({stroke: color, "stroke-width": 2}).toBack(),
        unhighlight = function () {},
        i,
        xy,
        xy1,
        f,
        that = this;

      this.buttons = r.set();

      this.drawPath = function () {
        var pathToDraw = [],
          j = 0,
          subaddon = "";
        for (j = 1; j < X.length; j = j + 1) {
          pathToDraw.push(X[j], Y[j]);
        }
        pathToDraw = ["M", X[0], Y[0], "R"].concat(pathToDraw);
        path.attr({path: pathToDraw});
        if (hasSub) {
          subaddon = "L" + (W - margins.right) + "," + (H - margins.bottom) + "," + margins.left + "," + (H - margins.bottom) + "z";
          sub.attr({path: pathToDraw + subaddon});
        }
      };

      this.update = function (i, d) {
        if (d > H - margins.bottom) {
          d = H - margins.bottom;
        }
        if (d < margins.top) {
          d = margins.top;
        }
        Y[i] = d;
        this.drawPath();
        this.buttons.items[i].attr({cy: d});
        blankets.items[i].attr({cy: d});
        r.safari();
      };

      this.hide = function () {
        $(path.node).hide();
        if (hasSub) {
          $(sub.node).hide();
        }
        $(that.buttons.forEach(function (e) {
          $(e.node).hide();
        }));
        $(blankets.forEach(function (e) {
          $(e.node).hide();
        }));
      };

      this.show = function () {
        $(path.node).show();
        if (hasSub) {
          $(sub.node).show();
        }
        $(that.buttons.forEach(function (e) {
          $(e.node).show();
        }));
        $(blankets.forEach(function (e) {
          $(e.node).show();
        }));
      };


      for (i = 0; i < values.length - 1; i = i + 1) {
        xy = editor.translate(i, values[i], values.length);
        X[i] = xy[0];
        Y[i] = xy[1];

        (f = function (i, xy) {
          var isDrag = false,
            isHover = false,
            popup;
          that.buttons.push(r.circle(xy[0], xy[1], 5).attr({fill: color, stroke: "none"}).toFront());
          blankets.push(r.circle(xy[0], xy[1], ((w > 50) ? 50 : w) / 2).attr({stroke: "none", fill: "#fff", opacity: 0, 'z-index': 10}).toFront().mouseover(function () {
            isHover = true;
            that.buttons.items[i].animate({r: 10}, 200);
            popup = popup || (r.popup(X[i]- 10, Y[i], 20, seriesId + ": " + values[i]));
          }).mouseout(function () {
            isHover = false;
            if (!isDrag) {
              that.buttons.items[i].animate({r: 5}, 200);
              popup.remove();
              popup = false;
            }
          }).drag(function (dx, dy) {
            var start = this.start;
            if (isDrag) {
              that.update(start.i, start.p + dy);
              updateCallback(seriesId, start.i, editor.translateBackY(Y[i], 300));
              if (popup) {
                popup.update(X[i] - 10, Y[i], 20, seriesId + ": " + Math.round(editor.translateBackY(Y[i], 300)));
              }
            }
          }, function (x, y) {
            this.start = {i: i, m: y, p: Y[i]};
            isDrag = true;
            popup = popup || (r.popup(X[i]- 10, Y[i], 20, seriesId + ": " + values[i]));
          }, function () {
            this.start = false;
            isDrag = false;
            if (!isHover) {
              that.buttons.items[i].animate({r: 5}, 200);
              popup.remove();
              popup = false;
            }
          }));
          blankets.items[blankets.items.length - 1].node.style.cursor = "move";
          blankets.items[blankets.items.length - 1].node.style.zIndex = 100;
        })(i, xy);
        if (i === values.length - 2) {
          xy1 = editor.translate(i + 1, values[i + 1], values.length);
          f(i + 1, xy1);
        }
      }
      xy = editor.translate(values.length - 1, values[values.length - 1], values.length);
      X.push(xy[0]);
      Y.push(xy[1]);
      this.drawPath();
    };

    // initialization
    log("editor initialization...");

    this.addSeries = function (seriesId, values, color, sub) {
      if (typeof(this.series[seriesId])=='undefined' || this.series[seriesId]===null) {
        this.series[seriesId] = new this.GCSeries(seriesId, values, color, sub);
        return this.series[seriesId];
      } else {
        return false;
      }
    };

    this.ClearSeries = function () {
      var i;
      for (i in this.series) if (this.series.hasOwnProperty(i)) {
        delete this.series[i];
      }
    };

    this.labels = r.set();
    this.labelTitles = [];
    this.xyLabels = r.set();

    this.render = function () {
      var i,
        xy;

      this.xyLabels.clear();
      this.xyLabels.push(r.drawGrid(margins.left, margins.top, W - margins.left - margins.right, H - margins.top - margins.bottom, this.labelTitles.length - 1, 300 / 30, "#000").toBack());

      for (i = 0; i < H; i+=30) {
        xy = editor.translate(0, i, 2);
        this.xyLabels.push(r.label(xy[0], xy[1], i, 1, false));
        xy = editor.translate(1, i, 2);
        this.xyLabels.push(r.label(xy[0], xy[1], i, 3, false));
      }
    };

    this.setLabels = function (labels) {
      var i,
        xy;
      this.labelTitles = labels;
      this.labels.clear();
      for (i in this.labelTitles) if (this.labelTitles.hasOwnProperty(i)) {
        var xy = editor.translate(i, 0, this.labelTitles.length);
        this.labels.push(r.label(xy[0], xy[1], this.labelTitles[i], 0, false));
      }
    };
  };
}(window));
