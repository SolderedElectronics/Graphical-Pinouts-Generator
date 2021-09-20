let canvas = new fabric.Canvas("c", {
  preserveObjectStacking: true,
});

function canvasResize() {
  // canvas.width = window.innerWidth * 0.75;
  // canvas.height = window.innerHeight;
}

function measureText(pText, pFontSize, pStyle) {
  var lDiv = document.createElement("div");

  document.body.appendChild(lDiv);

  if (pStyle != null) {
    lDiv.style = pStyle;
  }

  lDiv.style.fontFamily = "GT-Pressura";
  lDiv.style.fontSize = "" + pFontSize + "px";
  lDiv.style.position = "absolute";
  lDiv.style.left = -1000;
  lDiv.style.top = -1000;

  lDiv.innerHTML = pText;

  var lResult = {
    width: lDiv.clientWidth,
    height: lDiv.clientHeight,
  };

  document.body.removeChild(lDiv);
  lDiv = null;

  return lResult;
}

const defaultJson = [
  ["D4", "", "", "", "", "", "", "", "", "", "", ""],
  ["D4", "", "", "", "", "", "", "", "", "", "", ""],
  ["D4", "", "", "", "", "", "", "", "", "", "", ""],
  [
    "D4",
    "3V3",
    "GND",
    "RST",
    "GPIO8",
    "A2",
    "DAC1",
    "SCK",
    "TXD",
    "SDA",
    "PWM",
    "AREF",
  ],
];

document.getElementById("pins").value = JSON.stringify(defaultJson, null, 2);

let wa = 0;

canvas.backgroundColor = "#f1f0f0";

canvas.on("before:selection:cleared", function (e) {
  if (!wa && !e.target.ignore) document.getElementById("pins").value = "";
});

canvas.on("text:editing:exited", function (e) {
  // refresh(e.target.group);
  // if (o.type == "group") refresh(o);

  if (!e.target.idx) return;

  const [i, j] = e.target.idx.split(",").map((e) => parseInt(e));

  try {
    let a = JSON.parse(e.target.group.input);
    a[i][j] = e.target.text;
    e.target.group.input = JSON.stringify(a);
  } catch (e) {
    console.log(e);
  }

  canvas.setActiveObject(e.target.group);
  refresh(e.target.group);
});

function lockImage(obj) {
  if (!obj) {
    obj = canvas.getActiveObject();
  }

  if (!obj) return;
  // if (!obj || obj.type != "image") return;

  if (obj.type == "textbox" && obj.bg) return;

  let btn = document.createElement("button");
  btn.innerHTML = obj.name || obj.type;
  btn.canvasElement = obj;

  btn.style.flex = "1";
  btn.style.marginRight = "10px";

  btn.onclick = (e) => {
    console.log("ckicker");
    e.target.canvasElement.selectable = true;
    e.target.canvasElement.evented = true;
    canvas.setActiveObject(obj);

    e.target.remove();
  };

  document.getElementById("lockedImages").appendChild(btn);

  obj.selectable = false;
  obj.evented = false;
  // canvas.sendToBack(obj);
  // obj.sendToBack();

  canvas.discardActiveObject().renderAll();

  return btn;
}

canvas.on("mouse:down", function (options) {
  let groupItems, inp, l, t, r;
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
              pause_saving = true;
              groupItems = group._objects;
              group._restoreObjectsState();

              inp = group.input;
              lr = group.leftRight;
              l = group.left;
              t = group.top;
              r = group.angle;

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

                if (document.getElementById("pins").value)
                  grp.input = document.getElementById("pins").value;

                grp.leftRight = lr;

                grp.left = l;
                grp.top = t;
                grp.angle = r;

                canvas.add(grp);
                exitEditing = false;

                pause_saving = false;
              }
            });
          }
        }
      });
    }
  }
});

canvas.on("selection:created", function (e) {
  if (e.target != template) {
    e.target.bringToFront();
    canvas.bringToFront(e.target);
  } else {
    e.target.sendToBack();
    canvas.sendToBack(e.target);
  }

  if (e.target.ignore) return;

  if (e.target.type == "group") {
    document.getElementById("pins").value = e.target.input;

    if (e.target.leftRight) document.getElementById("right").checked = true;
    else document.getElementById("left").checked = true;
  } else document.getElementById("pins").value = "";
});
canvas.on("selection:updated", function (e) {
  if (e.target != template) {
    e.target.bringToFront();
    canvas.bringToFront(e.target);
  } else {
    e.target.sendToBack();
    canvas.sendToBack(e.target);
  }

  if (e.target.ignore) return;

  if (e.target.type == "group") {
    document.getElementById("pins").value = e.target.input;

    if (e.target.leftRight) document.getElementById("right").checked = true;
    else document.getElementById("left").checked = true;
  } else document.getElementById("pins").value = "";
});

const wPerChar = 7;
const padding = 20;

const alignTo = true;

class Selector {
  constructor(l, t, lr, sx, sy, r, inp, id) {
    this.g = new fabric.Group();
    this.g.snapAngle = 15;

    this.l = l;
    this.t = t;
    this.input = inp;
    this.id = id;

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
  // delete dodat
  render(data) {
    let widths = new Array(data[0].length).fill(0);
    let pwm = new Array(data[0].length).fill(0);
    for (let i = 0; i < data.length; ++i) {
      for (let j = 0; j < data[i].length; ++j) {
        if (!data[i][j] && !document.getElementById("align").checked) continue;

        if (data[i][j].toUpperCase() === "PWM") {
          pwm[i] = 1;
        }

        widths[j] = Math.max(widths[j], measureText(data[i][j], 12).width + 2);
        // widths[j] = Math.max(widths[j], data[i][j].length * wPerChar);
      }
    }

    let preWidths = [...widths];

    for (let i = 0; i < widths.length; ++i) widths[i] += padding;
    for (let i = 1; i < widths.length; ++i) widths[i] += widths[i - 1];

    widths = [0, ...widths];

    for (let i = 0; i < data.length; ++i) {
      let k = 0;
      for (let j = 0; j < data[i].length; ++j) if (data[i][j]) k = j;

      if (pwm[i]) {
        let pwmP = new fabric.Path(
          `M 0 0 L -6 0 L 2 0 Q 3.5 -9 5 0 T 8 0 T 11 0 L 20 0`,
          {
            stroke: "black",
            strokeWidth: 1,
            left: this.leftRight ? -18 : 8,
            top: 10 + i * 20,
            fill: "",
          }
        );
        this.g.addWithUpdate(pwmP);
      }

      let line = new fabric.Line(
        [
          10 + -(this.leftRight * 2 - 1) * (pwm[i] ? 20 : 0),
          10 + i * 20 + 6.7,
          7 +
            -(this.leftRight * 2 - 1) *
              (!document.getElementById("align").checked ? widths[k + 1] : 25),
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
        top: 9 + i * 20 + 4,
        fill: "white",
        stroke: "#FFD700",
        radius: 3,
        strokeWidth: 3,
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

      let wt = 0;
      for (let j = 0; j < data[i].length; ++j) {
        if (data[i][j]) {
          let w = preWidths[j] + 7;
          let ph = new fabric.Path(
            this.leftRight
              ? `M 0 0 L 7 7 L ${w} 7 L ${w + 7} 0 L ${w} -7 L 7 -7 L 0 0 M ${
                  w + 7
                } 0 L ${w + 14} 0 z`
              : `M 0 0 L -7 0 M 0 0 L 7 7 L ${w} 7 L ${
                  w + 7
                } 0 L ${w} -7 L 7 -7  z`,
            {
              stroke: "black",
              strokeWidth: 1,
              fill: document.getElementById("color" + j).value,
              left:
                (this.leftRight ? -w : 0) +
                (this.leftRight ? -25 : 30) +
                (document.getElementById("align").checked
                  ? -(this.leftRight * 2 - 1) * wt
                  : -(this.leftRight * 2 - 1) * widths[j]),
              top: 10 + i * 20 + 6.5 - 7,
            }
          );

          this.g.addWithUpdate(ph);
          ph.moveTo(-1);

          let txt = new fabric.Textbox(data[i][j], {
            left:
              (this.leftRight ? -w : 0) +
              (this.leftRight ? -17 : 44) +
              (document.getElementById("align").checked
                ? -(this.leftRight * 2 - 1) * wt
                : -(this.leftRight * 2 - 1) * widths[j]),
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
          txt.bg = ph;

          this.g.input = document.getElementById("pins").value;
          this.g.addWithUpdate(txt);

          wt += w + 13;
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
    if (this.id) this.g.id = this.id;

    canvas.setActiveObject(this.g);
    canvas.renderAll();
  }
}

function updateColors() {
  canvas.getObjects().map((o) => {
    if (o.type == "group") {
      o.getObjects().forEach((o2) => {
        if (o2.idx) {
          const [i, j] = o2.idx.split(",").map((e) => parseInt(e));
          o2.bg.fill = document.getElementById("color" + j).value;
          o2.bg.set("dirty", true);
        }
      });
    }
  });
  canvas.renderAll();
}

function renderOne(l, t, lr, sx, sy, r, inp, fallback) {
  let s = new Selector(l, t, lr, sx, sy, r, inp);

  try {
    let t = document.getElementById("pins").value;

    let v = JSON.parse(t);

    let mx = 0;
    v.forEach((r) => {
      mx = Math.max(mx, r.length);
    });

    for (let i = 0; i < v.length; ++i) {
      v[i].push(...new Array(mx - v[i].length).fill(""));
    }

    if (v.every((item) => item.length == v[0].length)) {
      s.render(v);
    } else {
      if (confirm("Not all row lengths are same, render default pinout?")) {
        s.render(defaultJson);
        document.getElementById("pins").value = JSON.stringify(defaultJson);
      } else if (fallback) {
        s.render(JSON.parse(fallback.input));
      }
    }
  } catch (e) {
    if (confirm("JSON data is faulty, render default pinout?")) {
      s.render(defaultJson);
      document.getElementById("pins").value = JSON.stringify(defaultJson);
    } else if (fallback) {
      s.render(JSON.parse(fallback.input));
    }
  }
}

function refresh(obj) {
  if (!obj) obj = canvas.getActiveObject();

  if (!obj || obj.type != "group") return;

  let l = obj.left,
    t = obj.top,
    sx = obj.scaleX,
    sy = obj.scaleY,
    r = obj.angle,
    inp = obj.input;

  if (document.getElementById("pins").value)
    inp = document.getElementById("pins").value;

  wa = 1;
  canvas.remove(obj);
  wa = 0;

  renderOne(
    l,
    t,
    document.getElementById("right").checked,
    sx,
    sy,
    r,
    inp,
    obj
  );
}

function makeNew(i) {
  const defaults = [
    [
      ["", "", "GND"],
      ["", "VCC"],
      ["", "", "", "", "", "", "", "", "", "SDA"],
      ["", "", "", "", "", "", "", "", "", "SCL"],
    ],
    [],
    defaultJson,
  ];
  if (i == 0) document.getElementById("align").checked = true;

  document.getElementById("pins").value = JSON.stringify(defaults[i]);
  document.getElementById("right").checked = "true";
  renderOne(250, 250, document.getElementById("right").checked);
}

function deleteObj() {
  canvas.getActiveObjects().forEach((obj) => {
    if (obj == template) {
      canvas.remove(obj);
      template = null;
      template_button = null;
    }

    if (obj.type == "image") obj.visible = false;
    // https://github.com/fabricjs/fabric.js/issues/7359
    else canvas.remove(obj);
  });
  canvas.discardActiveObject().renderAll();
}

window.onload = () => {
  // canvasResize();

  document.getElementById("right").checked = "false";
  document.getElementById("left").checked = "true";

  renderOne(200, 250, true);
  renderOne(200, 350, false);

  // undo_stack.push(JSON.stringify(canvas));
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
  let options = {
    multiplier: 4,
    format: "png",
  };

  let z, xl, yl;

  if (template) {
    z = canvas.getZoom();
    canvas.setZoom(1.0);

    canvas.renderAll();

    xl = canvas.getVpCenter().x - canvas.width / 2;
    yl = canvas.getVpCenter().y - canvas.height / 2;

    canvas.renderAll();

    canvas.setZoom(1); // reset zoom so pan actions work as expected

    let x = template.left; // x is the location where the top left of the viewport should be
    let y = template.top; // y idem
    canvas.absolutePan({ x: x, y: y });

    canvas.renderAll();

    // alert();

    options = {
      multiplier: 4,
      format: "png",
      left: 0,
      top: 0,
      width: template.width * template.scaleX,
      height: template.height * template.scaleY,
    };
  }

  // lock texta

  downloadURI(
    canvas.toDataURL(options),
    `outputPinout${new Date().toJSON().slice(0, 10).replace(/-/g, "-")}.jpg`
  );

  if (template) {
    // console.log(xl, yl, z);
    canvas.absolutePan({ x: xl, y: yl });
    canvas.setZoom(z);

    canvas.renderAll();
  }
}

canvas.on("after:render", function () {
  canvas.calcOffset();
});

/// =================================================================

let template = null;
let template_button = null;

const loadTemplateHandler = (i) => {
  const urls = [
    "assets/Unbranded-template.png",
    "assets/Soldered-template.png",
    "assets/Soldered-Breakout-Template.png",
  ];

  if (template) {
    return;
  }

  fabric.Image.fromURL(urls[i], function (myImg) {
    //i create an extra var for to change some image properties
    var img1 = myImg;

    img1.ignore = true;

    img1.scaleToHeight(300);
    img1.scaleToWidth(300);

    template = img1;

    canvas.add(img1);

    img1.scaleToHeight(canvas.height * 0.9);
    img1.scaleToWidth(canvas.width * 0.9);
    img1.center();

    img1.sendToBack();
    canvas.sendToBack(img1);

    canvas.setActiveObject(img1);

    img1.name = "Template";
    template_button = lockImage(img1);

    canvas.calcOffset();
    canvas.renderAll();
  });
};

const loadIconHandler = (i) => {
  const urls = [
    "assets/information.svg",
    "assets/warning.svg",
    "assets/led.svg",
    "assets/select.svg",
    "assets/010-usb.png",
    "assets/043-low-battery.png",
    "assets/062-easyC-Front.png",
    "assets/button.svg",
    "assets/063-OSH.png",
    "assets/Legend-Soldered-pinouts.jpg",
  ];

  if (urls[i].endsWith(".svg")) {
    fabric.loadSVGFromURL(urls[i], function (objects, options) {
      var g = fabric.util.groupSVGElements(objects, options);
      canvas.add(g);
      g.set({ left: 100, top: 100 });

      g.scaleToHeight(50);
      g.scaleToWidth(50);

      g.ignore = true;
      canvas.calcOffset();
      canvas.renderAll();

      canvas.setActiveObject(g);
    });
  } else
    fabric.Image.fromURL(urls[i], function (myImg) {
      //i create an extra var for to change some image properties
      var img1 = myImg.set({ left: 100, top: 100 });

      img1.ignore = true;
      canvas.calcOffset();
      canvas.renderAll();

      img1.scaleToHeight(50);
      img1.scaleToWidth(50);

      canvas.add(img1);
      canvas.setActiveObject(img1);
    });
};

const loadTextHandler = (i) => {
  var t = new fabric.Textbox("Textbox", {
    top: 100,
    left: 100,
    fontSize: 96,
    textAlign: "center",
    fixedWidth: 150,
    fontFamily: "GT-Pressura",
    fill: ["black", "#7025BA", "#25BAA8", "#BCA876"][i],
  });

  canvas.add(t);
};

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

        img1.scaleToHeight(450);
        img1.scaleToWidth(450);

        canvas.moveTo(img1, -4);
        img1.moveTo(-4);

        // addToList(img1);
        canvas.add(img1);
      });
    };
    fr.readAsDataURL(files[0]);
  }
};

// (function () {
//   var doCheck = true;
//   var check = function () {
//     // canvasResize();
//   };
//   window.addEventListener("resize", function () {
//     if (doCheck) {
//       check();
//       doCheck = false;
//       setTimeout(function () {
//         doCheck = true;
//         check();
//       }, 500);
//     }
//   });
// })();

// //variables for undo/redo
// let pause_saving = false;
// let undo_stack = [];
// let redo_stack = [];

// canvas.on("object:added", function (event) {
//   if (!pause_saving) {
//     undo_stack.push(
//       JSON.stringify(
//         canvas.toObject(["id", "l", "r", "input", "t", "idx", "bg"])
//       )
//     );
//     redo_stack = [];
//     // console.log("Object added, state saved", undo_stack);
//   }
// });
// canvas.on("object:modified", function (event) {
//   if (!pause_saving) {
//     undo_stack.push(
//       JSON.stringify(
//         canvas.toObject(["id", "l", "r", "input", "t", "idx", "bg"])
//       )
//     );
//     redo_stack = [];
//     // console.log("Object modified, state saved", undo_stack);
//   }
// });
// canvas.on("object:removed", function (event) {
//   if (!pause_saving) {
//     undo_stack.push(
//       JSON.stringify(
//         canvas.toObject(["id", "l", "r", "input", "t", "idx", "bg"])
//       )
//     );
//     redo_stack = [];
//     // console.log("Object removed, state saved", undo_stack);
//   }
// });

// const undo = () => {
//   pause_saving = true;
//   redo_stack.push(undo_stack.pop());
//   let previous_state = undo_stack[undo_stack.length - 1];
//   if (previous_state == null) {
//     previous_state = "{}";
//   }
//   canvas.loadFromJSON(
//     previous_state,
//     function () {
//       canvas.getObjects().forEach((o) => {
//         if (o.id && lastPos[o.id]) {
//           console.log("aa");

//           o.left = lastPos[o.id].x;
//           o.top = lastPos[o.id].y;
//         }
//       });
//       canvas.renderAll();
//     },
//     function (jsonObject, fabricObject) {
//       // jsonObject is the object as represented in the canvasJson
//       // fabricObject is the object that fabric created from this jsonObject

//       // ["id", "l", "r", "input", "t", "idx"]

//       if (jsonObject.id) fabricObject.id = jsonObject.id;
//       if (jsonObject.l) fabricObject.l = jsonObject.l;
//       if (jsonObject.t) fabricObject.t = jsonObject.t;
//       if (jsonObject.r) fabricObject.r = jsonObject.r;
//       if (jsonObject.input) fabricObject.input = jsonObject.input;
//       if (jsonObject.idx) fabricObject.idx = jsonObject.idx;
//       if (jsonObject.bg) fabricObject.bg = jsonObject.bg;
//     }
//   );
//   pause_saving = false;
// };

// const redo = () => {
//   pause_saving = true;
//   state = redo_stack.pop();
//   if (state != null) {
//     undo_stack.push(state);
//     canvas.loadFromJSON(state, function () {
//       canvas.renderAll();
//     });
//     pause_saving = false;
//   }
// };

// //Listen for undo/redo
// window.addEventListener("keydown", function (e) {
//   let repeat = e.repeat,
//     metaKey = e.metaKey,
//     key = e.key,
//     shiftKey = e.shiftKey,
//     ctrlKey = e.ctrlKey;

//   //Undo - CTRL+Z
//   if (repeat) return;
//   if ((metaKey || ctrlKey) && !shiftKey && key === "z") {
//     undo();
//   } else if ((metaKey || ctrlKey) && shiftKey && key === "z") {
//     redo();
//   }
// });

// window.addEventListener(
//   "keydown",
//   function (e) {
//     if (e.key == "Backspace" || e.key == "Delete") deleteObj();
//   },
//   true
// );

canvas.on("mouse:down", function (opt) {
  var evt = opt.e;
  if (evt.altKey === true) {
    this.isDragging = true;
    this.selection = false;
    this.lastPosX = evt.clientX;
    this.lastPosY = evt.clientY;
  }
});
canvas.on("mouse:move", function (opt) {
  if (this.isDragging) {
    var e = opt.e;
    var vpt = this.viewportTransform;
    vpt[4] += e.clientX - this.lastPosX;
    vpt[5] += e.clientY - this.lastPosY;
    this.requestRenderAll();
    this.lastPosX = e.clientX;
    this.lastPosY = e.clientY;
  }
});
canvas.on("mouse:up", function (opt) {
  // on mouse up we want to recalculate new interaction
  // for all objects, so we call setViewportTransform
  this.setViewportTransform(this.viewportTransform);
  this.isDragging = false;
  this.selection = true;
});

canvas.on("mouse:wheel", function (opt) {
  var delta = opt.e.deltaY;
  var zoom = canvas.getZoom();
  zoom *= 0.999 ** delta;
  if (zoom > 20) zoom = 20;
  if (zoom < 0.01) zoom = 0.01;
  canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
  opt.e.preventDefault();
  opt.e.stopPropagation();
  var vpt = this.viewportTransform;
  if (zoom < 400 / 1000) {
    vpt[4] = 200 - (1000 * zoom) / 2;
    vpt[5] = 200 - (1000 * zoom) / 2;
  } else {
    if (vpt[4] >= 0) {
      vpt[4] = 0;
    } else if (vpt[4] < canvas.getWidth() - 1000 * zoom) {
      vpt[4] = canvas.getWidth() - 1000 * zoom;
    }
    if (vpt[5] >= 0) {
      vpt[5] = 0;
    } else if (vpt[5] < canvas.getHeight() - 1000 * zoom) {
      vpt[5] = canvas.getHeight() - 1000 * zoom;
    }
  }
});
