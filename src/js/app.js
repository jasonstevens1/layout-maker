var fabric = require("fabric").fabric;
require("!style-loader!css-loader!../css/canvas.css");
require("./jscolor.js");

var canvasFullW = 1200;
var canvasFullH = 1800;
var canvasStartW = 300;
var canvasStartH = 450;

var zoomSteps = 4;
var zoomCount = 4;

var a = canvasStartW;
var e = canvasFullW;
var c = (a + e) / 2;
var b = (a + c) / 2;
var d = (c + e) / 2;

var zoomInStepArr = [b / a, c / b, d / c, e / d];
var zoomOutStepArr = [a / b, b / c, c / d, d / e];

var bg_src = "grid.png";
var overlayImg = "none";
var overlayImgPath = "assets/shapes/" + overlayImg + "_overlay.png";
var overlayMaskPath = "assets/shapes/" + overlayImg + "_mask.png";

var saved_json_str = "";

window.onload = function() {
  var canvas = new fabric.Canvas("imageCanvas", {
    preserveObjectStacking: true
  });

  fabric.Object.NUM_FRACTION_DIGITS = 17;

  if (saved_json_str.length > 0) loadJSONFromString(saved_json_str);
  else {
    setZoom();
    if (overlayImg != "none") {
      setOverlay(overlayImgPath);
    }
  }
  f = fabric.Image.filters;
  document.getElementById("imageCanvas").fabric = canvas;

  function addChangeHandler(id, fn, eventName) {
    document.getElementById(id)[eventName || "onchange"] = function() {
      var el = this;
      if ((obj = canvas.getActiveObject())) {
        fn.call(el, obj);
        canvas.renderAll();
      }
    };
  }

  function addClickHandler(id, fn, eventName) {
    document.getElementById(id)[eventName || "onclick"] = function() {
      var el = this;
      if ((obj = canvas.getActiveObject())) {
        fn.call(el, obj);
        canvas.renderAll();
      }
    };
  }

  var textInserter = document.getElementById("textInserter");
  textInserter.addEventListener("click", addTextArea, false);

  function addTextArea(e) {
    canvas.add(
      new fabric.IText("Click to type", {
        fontFamily: "arial",
        left: 10,
        top: 10,
        originX: "left",
        originY: "top",
        opacity: 1
      })
    );
    canvas.renderAll();
  }

  var deleteSelected = document.getElementById("deleteSelected");
  deleteSelected.addEventListener("click", clearSelected, false);

  function clearSelected() {
    if (canvas.getActiveObjects()) {
      canvas.getActiveObjects().map(o => {
        canvas.remove(o);
      });
      canvas.discardActiveObject().renderAll();
    } else {
      canvas.remove(canvas.getActiveObject());
    }
  }

  var deleteAll = document.getElementById("deleteAll");
  deleteAll.addEventListener("click", clearCanvas, false);

  function clearCanvas() {
    canvas.clear();
  }

  var zoom_in = document.getElementById("zoom_in");
  zoom_in.addEventListener("click", zoomIn, false);

  function zoomIn() {
    if (zoomCount < zoomSteps) {
      canvas.discardActiveObject();
      var zoomFactor = zoomInStepArr[zoomCount];
      zoomCount += 1;
      canvas.setHeight(canvas.getHeight() * zoomFactor);
      canvas.setWidth(canvas.getWidth() * zoomFactor);

      if (canvas.overlayImage) {
        canvas.overlayImage.width = canvas.getWidth();
        canvas.overlayImage.height = canvas.getHeight();
      }

      var objects = canvas.getObjects();
      for (var i in objects) {
        var scaleX = objects[i].scaleX;
        var scaleY = objects[i].scaleY;
        var left = objects[i].left;
        var top = objects[i].top;

        var tempScaleX = scaleX * zoomFactor;
        var tempScaleY = scaleY * zoomFactor;
        var tempLeft = left * zoomFactor;
        var tempTop = top * zoomFactor;

        objects[i].scaleX = tempScaleX;
        objects[i].scaleY = tempScaleY;
        objects[i].left = tempLeft;
        objects[i].top = tempTop;

        objects[i].setCoords();
      }
      updateImageInfo(zoomFactor);
      canvas.renderAll();
    }
  }

  var zoom_out = document.getElementById("zoom_out");
  zoom_out.addEventListener("click", zoomOut, false);

  function zoomOut() {
    if (zoomCount > 0) {
      canvas.discardActiveObject();
      zoomCount -= 1;
      var zoomFactor = zoomOutStepArr[zoomCount];
      canvas.setHeight(canvas.getHeight() * zoomFactor);
      canvas.setWidth(canvas.getWidth() * zoomFactor);

      if (canvas.overlayImage) {
        canvas.overlayImage.width = canvas.getWidth();
        canvas.overlayImage.height = canvas.getHeight();
      }

      var objects = canvas.getObjects();
      for (var i in objects) {
        var scaleX = objects[i].scaleX;
        var scaleY = objects[i].scaleY;
        var left = objects[i].left;
        var top = objects[i].top;

        var tempScaleX = scaleX * zoomFactor;
        var tempScaleY = scaleY * zoomFactor;
        var tempLeft = left * zoomFactor;
        var tempTop = top * zoomFactor;

        objects[i].scaleX = tempScaleX;
        objects[i].scaleY = tempScaleY;
        objects[i].left = tempLeft;
        objects[i].top = tempTop;

        objects[i].setCoords();
      }
      updateImageInfo(zoomFactor);
      canvas.renderAll();
    }
  }

  function drawSVGFromString(str) {
    fabric.loadSVGFromString(str, function(objects, options) {
      var obj = fabric.util.groupSVGElements(objects, options);
      canvas.add(obj).renderAll();
    });
  }

  function loadJSONFromString(str) {
    canvas.loadFromJSON(str, function() {
      canvas.renderAll.bind(canvas);
      setZoom();

      if (overlayImg != "none") {
        setOverlay(overlayImgPath);
      }
    });
  }

  function setZoom() {
    if (canvas.getWidth() > 800) {
      for (i = zoomSteps; i >= 0; i--) zoomOut();
    }
  }

  function hasExtension(file, exts) {
    var fileName = file.name;
    return new RegExp("(" + exts.join("|").replace(/\./g, "\\.") + ")$").test(
      fileName
    );
  }

  function hasExtensionControl(inputID, exts) {
    var fileName = inputID.value;
    return new RegExp("(" + exts.join("|").replace(/\./g, "\\.") + ")$").test(
      fileName
    );
  }

  function hasExtensionName(name, exts) {
    var fileName = name;
    return new RegExp("(" + exts.join("|").replace(/\./g, "\\.") + ")$").test(
      fileName
    );
  }

  function setStyle(object, styleName, value) {
    if (object.setSelectionStyles && object.isEditing) {
      var style = {};
      style[styleName] = value;
      object.setSelectionStyles(style);
    } else {
      object[styleName] = value;
    }
  }

  function getStyle(object, styleName) {
    return object.getSelectionStyles && object.isEditing
      ? object.getSelectionStyles()[styleName]
      : object[styleName];
  }

  var opacitySlider = document.getElementById("opacityChanger");
  opacitySlider.addEventListener("change", changeOpacity, false);

  function changeOpacity() {
    obj = canvas.getActiveObject();
    var newOpacity = document.getElementById("opacityChanger").value / 100;
    obj.set({ opacity: newOpacity });
    canvas.renderAll();
  }

  var pngExport = document.getElementById("pngExport");
  pngExport.addEventListener("click", savePNG, false);

  function dataURLtoBlob(dataurl) {
    var arr = dataurl.split(","),
      mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]),
      n = bstr.length,
      u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  function savePNG() {
    setZoom();
    var link = document.createElement("a");
    var imgData = canvas.toDataURL({ format: "png", multiplier: 4 });
    var strDataURI = imgData.substr(22, imgData.length);
    var blob = dataURLtoBlob(imgData);
    var objurl = URL.createObjectURL(blob);

    link.download = "layout-maker.png";

    link.href = objurl;

    link.click();
  }

  function setOverlay(path) {
    var imgOverlay = fabric.Image.fromURL(path, function(img) {
      img.set({
        width: canvas.width,
        height: canvas.height,
        originX: "left",
        originY: "top"
      });
      canvas.setOverlayImage(img, canvas.renderAll.bind(canvas));
    });
  }

  function setOverlayMask(path) {
    var imgOverlay = fabric.Image.fromURL(path, function(img) {
      img.set({
        width: canvas.width,
        height: canvas.height,
        originX: "left",
        originY: "top"
      });
      canvas.setOverlayImage(img, savePNG);
    });
  }

  function resetOverlayImg(path, fileName) {
    var imgOverlay = fabric.Image.fromURL(path, function(img) {
      img.set({
        width: canvas.width,
        height: canvas.height,
        originX: "left",
        originY: "top"
      });
      canvas.setOverlayImage(img, saveJSON(fileName));
    });
  }

  var processKeys = function(evt) {
    evt = evt || window.event;

    var movementDelta = 2;

    var activeObject = canvas.getActiveObject();
    var activeGroup = canvas.getActiveObjects();

    if (evt.keyCode === 37) {
      evt.preventDefault();
      if (activeObject) {
        var a = activeObject.get("left") - movementDelta;
        activeObject.set("left", a);
      } else if (activeGroup) {
        var a = activeGroup.get("left") - movementDelta;
        activeGroup.set("left", a);
      }
    } else if (evt.keyCode === 39) {
      evt.preventDefault();
      if (activeObject) {
        var a = activeObject.get("left") + movementDelta;
        activeObject.set("left", a);
      } else if (activeGroup) {
        var a = activeGroup.get("left") + movementDelta;
        activeGroup.set("left", a);
      }
    } else if (evt.keyCode === 38) {
      evt.preventDefault();
      if (activeObject) {
        var a = activeObject.get("top") - movementDelta;
        activeObject.set("top", a);
      } else if (activeGroup) {
        var a = activeGroup.get("top") - movementDelta;
        activeGroup.set("top", a);
      }
    } else if (evt.keyCode === 40) {
      evt.preventDefault();
      if (activeObject) {
        var a = activeObject.get("top") + movementDelta;
        activeObject.set("top", a);
      } else if (activeGroup) {
        var a = activeGroup.get("top") + movementDelta;
        activeGroup.set("top", a);
      }
    } else if (evt.keyCode === 46) {
      evt.preventDefault();
      if (canvas.getActiveObjects()) {
        canvas.getActiveObjects().map(o => {
          canvas.remove(o);
        });
        canvas.discardActiveObject().renderAll();
      } else {
        curr_obj = canvas.getActiveObject();
        if (!curr_obj.isEditing) {
          canvas.remove(curr_obj);
        }
      }
    }

    if (activeObject) {
      activeObject.setCoords();
      canvas.renderAll();
    } else if (activeGroup) {
      activeGroup.setCoords();
      canvas.renderAll();
    }
  };

  var canvasWrapper = document.body; //getElementById('canvas_scroll_box');
  canvasWrapper.tabIndex = 1000;
  canvasWrapper.addEventListener("keydown", processKeys, true);
  canvasWrapper.style.outline = "none"; // remove the blue halo around canvas

  addClickHandler("text_left", function(obj) {
    var isLeft = (getStyle(obj, "textAlign") || "").indexOf("left") > -1;
    setStyle(obj, "textAlign", isLeft ? "left" : "left");
  });

  addClickHandler("text_center", function(obj) {
    var iscenter = (getStyle(obj, "textAlign") || "").indexOf("center") > -1;
    setStyle(obj, "textAlign", iscenter ? "center" : "center");
  });

  addClickHandler("text_right", function(obj) {
    var isright = (getStyle(obj, "textAlign") || "").indexOf("right") > -1;
    setStyle(obj, "textAlign", isright ? "right" : "right");
  });

  addClickHandler("text_justify", function(obj) {
    var isjustify = (getStyle(obj, "textAlign") || "").indexOf("justify") > -1;
    setStyle(obj, "textAlign", isjustify ? "justify" : "justify");
  });

  addClickHandler("underline", function(obj) {
    var isUnderline =
      (getStyle(obj, "textDecoration") || "").indexOf("underline") > -1;
    setStyle(obj, "textDecoration", isUnderline ? "" : "underline");
  });

  addClickHandler("bold", function(obj) {
    var isBold = (getStyle(obj, "fontWeight") || "").indexOf("bold") > -1;
    setStyle(obj, "fontWeight", isBold ? "" : "bold");
  });

  addClickHandler("italic", function(obj) {
    var isItalic = (getStyle(obj, "fontStyle") || "").indexOf("italic") > -1;
    setStyle(obj, "fontStyle", isItalic ? "" : "italic");
  });

  addClickHandler("shadow", function(obj) {
    if (!obj.getShadow()) {
      obj.setShadow({
        color: "#999999",
        blur: 2,
        offsetX: 3,
        offsetY: 3
      });
    } else {
      obj.setShadow(null);
    }
  });

  addClickHandler("straighten", function(obj) {
    canvas.fxStraightenObject(obj);
  });

  addClickHandler("removeFill", function(obj) {
    obj.set({ fill: "transparent" });
  });

  addClickHandler("removeStroke", function(obj) {
    obj.set({ stroke: "transparent" });
  });

  addChangeHandler("colorChanger", function(obj) {
    var newColor = "#" + document.getElementById("colorChanger").value;
    obj.set({ fill: newColor });
  });

  addChangeHandler("strokeColorChanger", function(obj) {
    var newColor = "#" + document.getElementById("strokeColorChanger").value;
    obj.set({ stroke: newColor });
  });

  addChangeHandler("fillColorChanger", function(obj) {
    var newColor = "#" + document.getElementById("fillColorChanger").value;
    obj.set({ fill: newColor });
  });

  var bgChanger = document.getElementById("backgroundChanger");
  bgChanger.addEventListener("change", changeBackgroundColor, false);

  function changeBackgroundColor() {
    var newColor = "#" + document.getElementById("backgroundChanger").value;
    canvas.setBackgroundColor(newColor, canvas.renderAll.bind(canvas));
  }

  addChangeHandler("fontChanger", function(obj) {
    var select_control = document.getElementById("fontChanger");
    var new_font = select_control.options[select_control.selectedIndex].value;

    if (new_font != "none") {
      obj.set({ fontFamily: new_font });
      obj.setCoords();
    }
  });

  addClickHandler("bringForward", function(obj) {
    canvas.bringForward(obj);
  });

  addClickHandler("sendBackwards", function(obj) {
    canvas.sendBackwards(obj);
  });

  addClickHandler("bringToFront", function(obj) {
    canvas.bringToFront(obj);
  });

  addClickHandler("sendToBack", function(obj) {
    canvas.sendToBack(obj);
  });

  addClickHandler("centerH", function(obj) {
    canvas.centerObject(obj);
    obj.setCoords();
  });

  var imageLoader = document.getElementById("imageLoader");
  imageLoader.addEventListener("change", handleImage, false);

  function handleImage(e) {
    if (
      !hasExtensionControl(imageLoader, [
        ".jpg",
        ".jpeg",
        ".bmp",
        ".gif",
        ".png",
        ".svg"
      ])
    ) {
      alert(
        "INVALID FILE TYPE\n\nFile must be in PNG, JPG, BMP, GIF or SVG format."
      );
    } else if (hasExtensionControl(imageLoader, [".svg"])) {
      var reader = new FileReader();
      reader.onload = function(e) {
        var SVGStr = reader.result;
        drawSVGFromString(SVGStr);
      };
      reader.readAsText(e.target.files[0]);
      hideAllControls();
    } else {
      var reader = new FileReader();
      reader.onload = function(event) {
        var img = new Image();
        img.onload = function() {
          var imgInstance = new fabric.Image(img, {
            scaleX: 1,
            scaleY: 1,
            left: 100,
            top: 100,
            originX: "center",
            originY: "center"
          });
          canvas.add(imgInstance);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(e.target.files[0]);
      hideAllControls();
    }
  }

  function handleDroppedImage(file) {
    console.log(file["name"]);

    if (
      !hasExtension(file, [".jpg", ".jpeg", ".bmp", ".gif", ".png", ".svg"])
    ) {
      alert(
        "INVALID FILE TYPE\n\nFile must be in PNG, JPG, BMP, GIF or SVG format."
      );
    }

    if (hasExtension(file, [".svg"])) {
      var reader = new FileReader();
      reader.onload = function(e) {
        var SVGStr = reader.result;
        drawSVGFromString(SVGStr);
      };
      reader.readAsText(file);
      hideAllControls();
    } else {
      var reader = new FileReader();
      reader.onload = function(event) {
        var img = new Image();
        img.onload = function() {
          var imgInstance = new fabric.Image(img, {});
          canvas.add(imgInstance).renderAll();
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
      hideAllControls();
    }
  }

  var holder = document.getElementById("canvas_editor_table");
  holder.ondragover = function() {
    this.className += " dropzone_hover";
    return false;
  };
  holder.ondrop = function(e) {
    e.preventDefault();

    var file = e.dataTransfer.files[0];
    handleDroppedImage(file);

    this.className = null;

    return false;
  };

  function toggleShapeTools() {
    hideAllControls();
    showControls("shape_tools");
  }

  canvas.on({
    "object:selected": selectedObject
  });

  function selectedObject(e) {
    var id = canvas.getObjects().indexOf(e.target);
    var obj_type = e.target.get("type");
    console.log(obj_type + " selected");

    var objOpacity = 1; //e.target.getOpacity();
    document.getElementById("opacityChanger").value = objOpacity * 100;

    var objStroke = 1; //e.target.getStrokeWidth();
    var newStroke = objStroke >= 0 ? objStroke : 1;
    document.getElementById("strokeChanger").value = newStroke;
  }

  canvas.on({
    "object:added": addedObject
  });

  function addedObject(e) {
    var added = canvas.setActiveObject(e.target);
    var obj_type = e.target.get("type");
    console.log(obj_type + " added");
    e.target._origStrokeWidth = e.target.strokeWidth;
    hideAllControls();
  }

  canvas.on("object:scaling", function(e) {
    e.target.resizeToScale();
  });

  fabric.Object.prototype.resizeToScale = function() {
    if (this.type !== "group") {
      this.strokeWidth =
        this._origStrokeWidth / Math.max(this.scaleX, this.scaleY);
    } else {
      this._objects.forEach(function(obj) {
        console.log(obj);
        obj.strokeWidth =
          obj._origStrokeWidth / Math.max(obj.group.scaleX, obj.group.scaleY);
      });
    }
  };

  canvas.on("before:selection:cleared", function() {
    document.getElementById("strokeChanger").value = 1;
    hideAllControls();
  });

  function hideAllControls() {
    document.getElementById("text_tools").style.display = "none";
    document.getElementById("image_tools").style.display = "none";
    document.getElementById("shape_tools").style.display = "none";
    document.getElementById("sort_tools").style.display = "none";
  }

  function showControls(div_id) {
    hideAllControls();
    document.getElementById(div_id).style.display = "block";
  }

  var textTools = document.getElementById("text");
  textTools.addEventListener("click", toggleTextTools, false);

  function toggleTextTools() {
    hideAllControls();
    showControls("text_tools");
  }

  var imageTools = document.getElementById("images");
  imageTools.addEventListener("click", toggleImageTools, false);

  function toggleImageTools() {
    hideAllControls();
    showControls("image_tools");
  }

  var shapeTools = document.getElementById("shapes");
  shapeTools.addEventListener("click", toggleShapeTools, false);

  function toggleShapeTools() {
    hideAllControls();
    showControls("shape_tools");
  }

  var sortTools = document.getElementById("sort");
  sortTools.addEventListener("click", toggleSortTools, false);

  function toggleSortTools() {
    hideAllControls();
    showControls("sort_tools");
  }

  addChangeHandler("strokeChanger", function(obj) {
    var slider = document.getElementById("strokeChanger");
    var newStroke = parseInt(slider.value);
    console.log(newStroke);
    obj.strokeWidth = newStroke;
    obj._origStrokeWidth = obj.strokeWidth;
    obj.setCoords();
  });

  var lineInserter = document.getElementById("line");
  lineInserter.addEventListener("click", insertLine, false);

  function insertLine() {
    canvas.add(
      new fabric.Line([100, 100, 0, 0], {
        stroke: "#000000",
        strokeWidth: 1
      })
    );
  }

  var circleInserter = document.getElementById("circle");
  circleInserter.addEventListener("click", insertCircle, false);

  function insertCircle() {
    canvas.add(
      new fabric.Circle({
        radius: 100,
        fill: "#CCCCCC",
        stroke: "#000000",
        strokeWidth: 1
      })
    );
  }

  var rectangleInserter = document.getElementById("rectangle");
  rectangleInserter.addEventListener("click", insertRectangle, false);

  function insertRectangle() {
    canvas.add(
      new fabric.Rect({
        left: 75,
        top: 25,
        fill: "#CCCCCC",
        stroke: "#000000",
        strokeWidth: 1,
        width: 200,
        height: 100
      })
    );
  }

  var polygonInserter = document.getElementById("polygon");
  polygonInserter.addEventListener("click", insertPolygon, false);

  function insertPolygon() {
    var points = regularPolygonPoints(6, 30);

    var myPoly = new fabric.Polygon(
      points,
      {
        fill: "#CCCCCC",
        stroke: "#000000",
        left: 75,
        top: 25,
        strokeWidth: 1,
        strokeLineJoin: "bevil"
      },
      false
    );
    canvas.add(myPoly);
  }

  var starInserter = document.getElementById("star");
  starInserter.addEventListener("click", insertStar, false);

  function insertStar() {
    var points = starPolygonPoints(5, 50, 25);

    var myStar = new fabric.Polygon(
      points,
      {
        fill: "#CCCCCC",
        stroke: "#000000",
        left: 75,
        top: 25,
        strokeWidth: 1,
        strokeLineJoin: "bevil"
      },
      false
    );
    canvas.add(myStar);
  }

  function regularPolygonPoints(sideCount, radius) {
    var sweep = (Math.PI * 2) / sideCount;
    var cx = radius;
    var cy = radius;
    var points = [];
    for (var i = 0; i < sideCount; i++) {
      var x = cx + radius * Math.cos(i * sweep);
      var y = cy + radius * Math.sin(i * sweep);
      points.push({ x: x, y: y });
    }
    return points;
  }

  function starPolygonPoints(spikeCount, outerRadius, innerRadius) {
    var rot = (Math.PI / 2) * 3;
    var cx = outerRadius;
    var cy = outerRadius;
    var sweep = Math.PI / spikeCount;
    var points = [];
    var angle = 0;

    for (var i = 0; i < spikeCount; i++) {
      var x = cx + Math.cos(angle) * outerRadius;
      var y = cy + Math.sin(angle) * outerRadius;
      points.push({ x: x, y: y });
      angle += sweep;

      x = cx + Math.cos(angle) * innerRadius;
      y = cy + Math.sin(angle) * innerRadius;
      points.push({ x: x, y: y });
      angle += sweep;
    }
    return points;
  }

  function updateImageInfo(zoomFactor) {
    var width_in_mm = Math.round((canvasFullW * 25.4) / 300);
    var height_in_mm = Math.round((canvasFullH * 25.4) / 300);
    var width_in_inches = (width_in_mm / 25.4).toPrecision(3);
    var height_in_inches = (height_in_mm / 25.4).toPrecision(3);

    document.getElementById("millimetres").innerHTML =
      width_in_mm + "mm x " + height_in_mm + "mm";

    document.getElementById("inches").innerHTML =
      "(" + width_in_inches + "&#34; x " + height_in_inches + "&#34;)";

    document.getElementById("pixels").innerHTML =
      canvasFullW + " x " + canvasFullH + " px";

    return;
  }

  /* GROUPS ARE BROKEN IN FABRIC.JS AS OF FEB 2016 - CANNOT SCALE A GROUP
var group_selected = document.getElementById('groupSelected');
group_selected.addEventListener('click', groupSelected, false);

function groupSelected() {

    var activegroup = canvas.getActiveObjects();
    var objectsInGroup = activegroup.getObjects();

    activegroup.clone(function(newgroup) {
        canvas.discardActiveGroup();
        objectsInGroup.forEach(function(object) {
            canvas.remove(object);  
        });
        canvas.add(newgroup);
         });
}

var ungroup_selected = document.getElementById('unGroupSelected');
ungroup_selected.addEventListener('click', unGroupSelected, false);

function unGroupSelected() {
	
	var activeObject = canvas.getActiveObject();
	if(activeObject.type=="group")
	{
		var items = activeObject._objects;
		activeObject._restoreObjectsState();
		canvas.remove(activeObject);
		for(var i = 0; i < items.length; i++) 
		{
			canvas.add(items[i]);
			canvas.item(canvas.size()-1).hasControls = true;
		}
		canvas.getCoords().renderAll();
	}
}
*/

  /// end of onload function
};
