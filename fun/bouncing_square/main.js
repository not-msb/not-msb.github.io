const canvas = document.getElementById("app");
const ctx = canvas.getContext("2d");

var exports;
var buffer;
var width;
var height;

var x = 50;
var y = 0;
var w = 100;
var h = 100;
var vx = 5;
var vy = 5;

function getU32(array) {
    var num = 0;
    for (let i = 0; i<4; i++)
        num += array[i] * Math.pow(256, i);
    return num;
}

WebAssembly.instantiateStreaming(fetch("main.wasm"), { env: {} }).then(w => {
    exports = w.instance.exports;
    buffer = new Uint8ClampedArray(exports.memory.buffer);
    width = getU32(buffer.slice(exports.width));
    height = getU32(buffer.slice(exports.height));

    canvas.width = width;
    canvas.height = height;

    exports.init();

    window.requestAnimationFrame(draw);
});

function draw() {
    exports.setColor(200, 200, 200, 255);
    exports.fill();
    exports.setColor(255, 0, 0, 255);
    exports.square(x, y, w, h);

    const image = buffer.slice(exports.image, exports.image + 4*width*height);
    const imageData = new ImageData(image, width, height);
    ctx.putImageData(imageData, 0, 0);

    if (x   <= 0      && Math.sign(vx) == -1) vx *= -1;
    if (x+w >= width  && Math.sign(vx) ==  1) vx *= -1;
    if (y   <= 0      && Math.sign(vy) == -1) vy *= -1;
    if (y+h >= height && Math.sign(vy) ==  1) vy *= -1;

    x += vx;
    y += vy;

    window.requestAnimationFrame(draw);
}
