let Demo = fabric.util.createClass(fabric.Group, {
  type: "demo",
  initialize: function () {
    this.grp = new fabric.Group([], {
      selectable: false,
      padding: 0,
    });

    this._objects.push(
      new fabric.Group([
        new fabric.Text("A", { top: 200, left: 200 }),
        new fabric.Text("B", { top: 200, left: 200 }),
      ])
    );
    this._objects.push(
      new fabric.Group([
        new fabric.Text("C", { top: 200, left: 200 }),
        new fabric.Text("D", { top: 200, left: 200 }),
      ])
    );
  },
});
