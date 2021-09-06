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

        addToList(img1);
        canvas.add(img1);
      });
    };
    fr.readAsDataURL(files[0]);
  }
};

document.getElementById("items").addEventListener("click", function (e) {
  var selected;

  if (e.target.tagName === "LI") {
    selected = document.querySelector("li.selected"); // 2a.
    if (selected) selected.className = ""; // "
    e.target.className = "selected"; // 2b.
  }
});

canvas.backgroundColor = "yellow";

fabric.Image.fromURL(
  "http://fabricjs.com/assets/pug_small.jpg",
  function (myImg) {
    var img1 = myImg.set({ left: 0, top: 0, width: 150, height: 150 });
    canvas.add(img1);
  }
);

function addToList(e) {
  var node = document.createElement("LI");
  var textnode = document.createTextNode(e.name);
  node.appendChild(textnode);
  document.getElementById("items").appendChild(node);
}
