var colorPicker;
var colorTempSlider = document.getElementById('color-temperature-slider');
var rgbArray = [0, 0, 0]; // 初始化RGB陣列

const client = mqtt.connect('wss://public:public@public.cloud.shiftr.io', {
// const client = mqtt.connect('wss://broker.emqx.io:8084/mqtt', {
    clientId: 'javascript',
    keepalive: 60 // 以秒为单位的时间间隔
});
// const client = mqtt.connect('wss://test.mosquitto.org/:8080', {
//     clientId: 'javascript',
//     keepalive: 60 // 以秒为单位的时间间隔
// });

client.on('connect', function () {
    console.log('connected!');
    client.subscribe('hello');
    client.subscribe('color');
    client.subscribe('mode');
});

client.on('message', function (topic, message) {
    console.log(topic + ': ' + message.toString());
});


// 函數，將RGB數組轉換為顏色字符串
function rgbArrayToString(rgbArray) {
    return `rgb(${rgbArray[0]}, ${rgbArray[1]}, ${rgbArray[2]})`;
}

// 函數，發送顏色數值到MQTT主題
function sendColorToMQTT(rgbArray) {
    var colorString = rgbArrayToString(rgbArray);
    // client.publish('hello', colorString);
    client.publish('color', colorString);
}

// 更換顏色按鈕的事件處理器，當按下時發送顏色到MQTT
document.getElementById('color-send').addEventListener('click', function () {
    sendColorToMQTT(rgbArray);
});


document.addEventListener("DOMContentLoaded", function (event) {
    colorPicker = new iro.ColorPicker("#color-picker-container", {
        width: 290,
        color: localStorage.getItem('lastColor')
    });

    colorPicker.on(["color:init", "color:change"], function (color) {
        // 更新顏色輸入欄位為RGB格式
        document.getElementById('color-input').value = `rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`;
        localStorage.setItem('lastColor',`rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`);

        // 更新RGB陣列
        rgbArray = [color.rgb.r, color.rgb.g, color.rgb.b];
        client.publish("color", `0x${color.rgb.r.toString(16).padStart(2, '0')}${color.rgb.g.toString(16).padStart(2, '0')}${color.rgb.b.toString(16).padStart(2, '0')}`);
        // client.publish("hello", `rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`)
    });
});

function setColor(color) {
    if (Array.isArray(color)) {
        // 如果是RGB數組，則設置顏色
        colorPicker.color.rgb = { r: color[0], g: color[1], b: color[2] };
    } else {
        // 否則，解析RGB字符串並設置顏色
        var parsedColor = parseRgbString(color);
        colorPicker.color.rgb = { r: parsedColor[0], g: parsedColor[1], b: parsedColor[2] };
    }
    // 傳遞RGB數值
    rgbArray = [colorPicker.color.rgb.r, colorPicker.color.rgb.g, colorPicker.color.rgb.b];
}

function setColorFromInput() {
    var colorInput = document.getElementById('color-input').value;
    setColor(colorInput);
}

colorTempSlider.oninput = function () {
    var colorTemp = kelvinToRgb(this.value);
    console.log(colorTemp);
    console.log(colorTempSlider);
    setColor(colorTemp);
}

let i =0;
// 更換模式按鈕的事件處理器
document.getElementById('mode-button').addEventListener('click', function () {
    // 更換模式的邏輯
    i += 1;
    if(i>11){
        i=1;
    }
    console.log('更換模式');
    client.publish("mode", `${i}`);
});

let isLightOn = false;  // 初始狀態設定為關閉   
// 電燈開關按鈕的事件處理器
document.getElementById('light-switch').addEventListener('click', function () {
    isLightOn = !isLightOn;
    // 電燈開關的邏輯
    console.log('電燈開關');
    
    if(isLightOn){
        client.publish("color", `0x000000`);
    }else{
        client.publish("color", `0x${rgbArray[0].toString(16).padStart(2, '0')}${rgbArray[1].toString(16).padStart(2, '0')}${rgbArray[2].toString(16).padStart(2, '0')}`);
    }

});

function kelvinToRgb(kelvin) {
    var temp = kelvin / 100;
    var red, green, blue;

    if (temp <= 66) {
        red = 255;
        green = temp;
        green = 99.4708025861 * Math.log(green) - 161.1195681661;

        if (temp <= 19) {
            blue = 0;
        } else {
            blue = temp - 10;
            blue = 138.5177312231 * Math.log(blue) - 305.0447927307;
        }
    } else {
        red = temp - 60;
        red = 329.698727446 * Math.pow(red, -0.1332047592);
        green = temp - 60;
        green = 288.1221695283 * Math.pow(green, -0.0755148492);
        blue = 255;
    }

    // 修正顏色值的小數部分
    red = Math.round(red);
    green = Math.round(green);
    blue = Math.round(blue);

    return `rgb(${clamp(red, 0, 255)}, ${clamp(green, 0, 255)}, ${clamp(blue, 0, 255)})`;
}

function clamp(x, min, max) {
    if (x < min) { return min; }
    if (x > max) { return max; }
    return x;
}

function parseRgbString(rgbString) {
    var match = rgbString.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (match) {
        return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
    }
    return [0, 0, 0]; // 返回默認RGB值
}

