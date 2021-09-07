let canvas = new fabric.Canvas("c", {
  preserveObjectStacking: true,
});

document.getElementById("pins").value = JSON.stringify([
  ["D4", null, null, null, null, null],
  ["D5", null, null, null, null, null],
  ["D4", null, null, null, null, null],
  ["D4", null, null, null, null, null],
  ["D4", null, null, null, null, null],
  ["D4", null, null, null, null, null],
  ["D4", null, null, null, null, null],
  ["D4", null, null, null, null, null],
  ["D4", null, null, "D12", null, null],
  ["D4", null, null, null, null, null],
  ["D4", null, null, null, null, null],
  ["D4", "D8", "D4", "D4132312", "D8", "D4"],
]);

canvas.backgroundColor = "#fafafa";

canvas.on("mouse:down", function (options) {
  let groupItems, inp;
  if (options.target) {
    let thisTarget = options.target;
    let mousePos = canvas.getPointer(options.e);
    let editTextbox = false;
    let editObject;

    if (thisTarget.isType("group")) {
      let groupPos = {
        x: thisTarget.left,
        y: thisTarget.top,
      };

      thisTarget.forEachObject(function (object, i) {
        if (object.type == "textbox") {
          let matrix = thisTarget.calcTransformMatrix();
          let newPoint = fabric.util.transformPoint(
            { y: object.top, x: object.left },
            matrix
          );
          let objectPos = {
            xStart: newPoint.x - (object.width * object.scaleX) / 2, //When OriginX and OriginY are centered, otherwise xStart: newpoint.x - object.width * object.scaleX etc...
            xEnd: newPoint.x + (object.width * object.scaleX) / 2,
            yStart: newPoint.y - (object.height * object.scaleY) / 2,
            yEnd: newPoint.y + (object.height * object.scaleY) / 2,
          };

          if (
            mousePos.x >= objectPos.xStart &&
            mousePos.x <= objectPos.xEnd &&
            mousePos.y >= objectPos.yStart &&
            mousePos.y <= objectPos.yEnd
          ) {
            function ungroup(group) {
              groupItems = group._objects;
              group._restoreObjectsState();

              inp = group.input;
              canvas.remove(group);
              for (let i = 0; i < groupItems.length; i++) {
                if (groupItems[i] != "textbox") {
                  groupItems[i].selectable = false;
                }
                canvas.add(groupItems[i]);
              }
              canvas.renderAll();
            }

            ungroup(thisTarget);
            canvas.setActiveObject(object);

            object.enterEditing();
            object.selectAll();

            editObject = object;
            let exitEditing = true;

            editObject.on("editing:exited", function (options) {
              if (exitEditing) {
                let items = [];
                groupItems.forEach(function (obj) {
                  items.push(obj);
                  canvas.remove(obj);
                });

                let grp;
                grp = new fabric.Group(items, {});
                grp.input = inp;
                canvas.add(grp);
                exitEditing = false;
              }
            });
          }
        }
      });
    }
  }
});

canvas.on("selection:created", function (e) {
  e.target.bringToFront();
  canvas.bringToFront(e.target);

  if (e.target.type == "group") {
    document.getElementById("pins").value = e.target.input;

    if (e.target.leftRight) document.getElementById("right").checked = true;
    else document.getElementById("right").checked = false;
  } else document.getElementById("pins").value = "";
});
canvas.on("selection:updated", function (e) {
  e.target.bringToFront();
  canvas.bringToFront(e.target);

  if (e.target.type == "group") {
    document.getElementById("pins").value = e.target.input;

    if (e.target.leftRight) document.getElementById("right").checked = true;
    else document.getElementById("right").checked = false;
  } else document.getElementById("pins").value = "";
});

const wPerChar = 7;
const padding = 20;

class Selector {
  constructor(l, t, lr, sx, sy, r, inp) {
    this.g = new fabric.Group();
    this.g.snapAngle = 15;

    this.l = l;
    this.t = t;
    this.input = inp;

    if (sx) this.sx = sx;
    else this.sx = 1.0;

    if (sy) this.sy = sy;
    else this.sy = 1.0;

    if (r) this.r = r;
    else this.r = 0.0;

    canvas.add(this.g);

    this.leftRight = lr == null ? 0 : lr;
    this.g.leftRight = lr == null ? 0 : lr;
  }

  render(data) {
    let widths = new Array(data[0].length).fill(0);
    for (let i = 0; i < data.length; ++i) {
      for (let j = 0; j < data[i].length; ++j) {
        if (!data[i][j]) continue;
        widths[j] = Math.max(widths[j], data[i][j].length * wPerChar);
      }
    }

    let preWidths = [...widths];

    for (let i = 0; i < widths.length; ++i) widths[i] += padding;
    for (let i = 1; i < widths.length; ++i) widths[i] += widths[i - 1];

    widths = [0, ...widths];

    for (let i = 0; i < data.length; ++i) {
      let k = 0;
      for (let j = 0; j < data[i].length; ++j) if (data[i][j] != null) k = j;

      let line = new fabric.Line(
        [
          7,
          10 + i * 20 + 6.7,
          7 + -(this.leftRight * 2 - 1) * widths[k + 1],
          10 + i * 20 + 6.7,
        ],
        {
          fill: "black",
          stroke: "black",
          strokeWidth: 1,
          selectable: false,
          evented: false,
        }
      );
      this.g.addWithUpdate(line);
      line.moveTo(-2);

      let c = new fabric.Circle({
        left: 5,
        top: 10 + i * 20 + 4,
        fill: "purple",
        stroke: "purple",
        radius: 3,
      });
      this.g.addWithUpdate(c);

      const getContrastYIQ = (hexcolor) => {
        hexcolor = hexcolor.replace("#", "");
        var r = parseInt(hexcolor.substr(0, 2), 16);
        var g = parseInt(hexcolor.substr(2, 2), 16);
        var b = parseInt(hexcolor.substr(4, 2), 16);
        var yiq = (r * 299 + g * 587 + b * 114) / 1000;
        return yiq >= 128 ? "black" : "white";
      };

      for (let j = 0; j < data[i].length; ++j) {
        if (data[i][j]) {
          let w = preWidths[j] + 7;
          let ph = new fabric.Path(
            `M 0 0 L 7 7 L ${w} 7 L ${w + 7} 0 L ${w} -7 L 7 -7  z`,
            {
              stroke: "black",
              strokeWidth: 1,
              fill: document.getElementById("color" + j).value,
              left:
                (this.leftRight ? -w : 0) +
                (this.leftRight ? -30 : 15) +
                -(this.leftRight * 2 - 1) * widths[j],
              top: 10 + i * 20 + 6.5 - 7,
            }
          );
          this.g.addWithUpdate(ph);
          ph.moveTo(-1);

          let txt = new fabric.Textbox(data[i][j], {
            left:
              (this.leftRight ? -w : 0) +
              (this.leftRight ? -22 : 22) +
              -(this.leftRight * 2 - 1) * widths[j],
            top: 10 + i * 20,
            fill: getContrastYIQ(document.getElementById("color" + j).value),
            width: 20,
            fontSize: 12,
            fontcolor: getContrastYIQ(
              document.getElementById("color" + j).value
            ),
            fontFamily: "GT-Pressura",
          });
          txt.idx = i + ", " + j;

          this.g.input = document.getElementById("pins").value;
          this.g.addWithUpdate(txt);
        }
      }
    }

    for (let x of this.g.getObjects()) x.dirty = true;

    this.g.left = this.l;
    this.g.top = this.t;
    this.g.scaleX = this.sx;
    this.g.scaleY = this.sy;
    this.g.angle = this.r;
    if (this.input) this.g.input = this.input;

    canvas.setActiveObject(this.g);
    canvas.renderAll();
  }
}

function updateColors() {
  canvas.getObjects().map((o) => {
    if (o.type == "group") refresh(o);
  });
}

function renderOne(l, t, lr, sx, sy, r, inp) {
  let s = new Selector(l, t, lr, sx, sy, r, inp);

  try {
    let t = document.getElementById("pins").value;

    let v = JSON.parse(t);
    s.render(v);
  } catch (e) {
    console.log(e);
  }
}

function refresh(obj) {
  if (!obj) obj = canvas.getActiveObject();

  if (!obj) return;

  let l = obj.left,
    t = obj.top,
    sx = obj.scaleX,
    sy = obj.scaleY,
    r = obj.angle,
    inp = obj.input;

  canvas.remove(obj);

  renderOne(l, t, document.getElementById("right").checked, sx, sy, r, inp);
}

function makeNew() {
  renderOne(0, 0, document.getElementById("right").checked);
}

function deleteObj() {
  var object = canvas.getActiveObject();
  if (!object) {
    alert("Please select the element to remove");
    return "";
  }
  canvas.remove(object);
}

window.onload = () => {
  document.getElementById("right").checked = "true";
  renderOne(0, 0, document.getElementById("right").checked);
};

function downloadURI(uri, name) {
  var link = document.createElement("a");
  link.download = name;
  link.href = uri;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function downloadCanvas() {
  downloadURI(
    canvas.toDataURL({ multiplier: 4 }),
    `outputPinout${new Date().toJSON().slice(0, 10).replace(/-/g, "-")}.jpg`
  );
}

/// =================================================================

let imgCounter = 0;

const imgFileHandler = (e) => {
  var tgt = e.target,
    files = tgt.files;

  if (FileReader && files && files.length) {
    var fr = new FileReader();
    fr.onload = function () {
      fabric.Image.fromURL(fr.result, function (myImg) {
        var img1 = myImg;
        img1.name =
          "img" + imgCounter++ + "_" + files[0].name.replace(" ", "_");

        canvas.moveTo(img1, -4);
        img1.moveTo(-4);

        // addToList(img1);
        canvas.add(img1);
      });
    };
    fr.readAsDataURL(files[0]);
  }
};
