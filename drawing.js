window.onload = function() {
    const svg = document.getElementById('drawingSvg');
    const svgContainer = document.querySelector('.svg-container');
    const colorPicker = document.getElementById('colorPicker');
    const startFillColorPicker = document.getElementById('startFillColorPicker');
    const endFillColorPicker = document.getElementById('endFillColorPicker');
    const brushSize = document.getElementById('brushSize');
    const lineWidthSlider = document.getElementById('lineWidthSlider');
    const sizeIncrease = document.getElementById('sizeIncrease');
    const opacitySlider = document.getElementById('opacitySlider');
    const backgroundColorPicker = document.getElementById('backgroundColorPicker');
    const clearCanvasButton = document.getElementById('clearCanvas');
    const shapeSelector = document.getElementById('shapeSelector');
    const eraseMode = document.getElementById('eraseMode');
    const saveDrawingButton = document.getElementById('saveDrawing');

    const lineWidthValue = document.getElementById('lineWidthValue');
    const sizeIncreaseValue = document.getElementById('sizeIncreaseValue');
    const opacityValue = document.getElementById('opacityValue');

    const controls = document.querySelector('.controls');
    const toggleButton = document.querySelector('.toggle-button');
    const hideButton = document.querySelector('.hide-button');

    let drawing = false;
    let currentSize;
    let shapes = [];

    svg.addEventListener('mousedown', startDrawing);
    svg.addEventListener('mouseup', stopDrawing);
    svg.addEventListener('mousemove', draw);
    clearCanvasButton.addEventListener('click', clearCanvas);
    svg.addEventListener('click', handleSvgClick);
    saveDrawingButton.addEventListener('click', saveDrawing);
    backgroundColorPicker.addEventListener('input', changeBackgroundColor);

    lineWidthSlider.addEventListener('input', () => {
        lineWidthValue.textContent = lineWidthSlider.value;
        saveSettings();
    });

    sizeIncrease.addEventListener('input', () => {
        sizeIncreaseValue.textContent = sizeIncrease.value;
        saveSettings();
    });

    opacitySlider.addEventListener('input', () => {
        opacityValue.textContent = opacitySlider.value;
        saveSettings();
    });

    colorPicker.addEventListener('input', saveSettings);
    startFillColorPicker.addEventListener('input', saveSettings);
    endFillColorPicker.addEventListener('input', saveSettings);
    brushSize.addEventListener('input', saveSettings);
    backgroundColorPicker.addEventListener('input', saveSettings);
    shapeSelector.addEventListener('change', saveSettings);
    eraseMode.addEventListener('change', saveSettings);

    toggleButton.addEventListener('click', () => {
        controls.classList.toggle('hidden');
    });

    hideButton.addEventListener('click', () => {
        controls.classList.add('hidden');
    });

    loadSettings();

    function startDrawing(e) {
        if (eraseMode.checked) return;
        drawing = true;
        currentSize = parseFloat(brushSize.value); // Устанавливаем начальный размер фигуры
        shapes = []; // Сбрасываем массив фигур для новой серии
        draw(e);
    }

    function stopDrawing() {
        drawing = false;
        applyGradientFill(); // Применяем градиент заливки после завершения рисования
    }

    function draw(e) {
        if (!drawing || eraseMode.checked) return;

        currentSize += parseFloat(sizeIncrease.value);

        const { x, y } = getMousePosition(e);

        let shape;
        switch (shapeSelector.value) {
            case 'line':
                shape = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
                shape.setAttribute('stroke', colorPicker.value);
                shape.setAttribute('stroke-width', lineWidthSlider.value);
                shape.setAttribute('fill', 'none');
                shape.setAttribute('points', `${x},${y} ${x + 1},${y + 1}`);
                break;
            case 'circle':
                shape = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                shape.setAttribute('stroke', colorPicker.value);
                shape.setAttribute('stroke-width', lineWidthSlider.value);
                shape.setAttribute('fill', startFillColorPicker.value);
                shape.setAttribute('cx', x);
                shape.setAttribute('cy', y);
                shape.setAttribute('r', currentSize);
                break;
            case 'rectangle':
                shape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                shape.setAttribute('stroke', colorPicker.value);
                shape.setAttribute('stroke-width', lineWidthSlider.value);
                shape.setAttribute('fill', startFillColorPicker.value);
                shape.setAttribute('x', x - currentSize / 2);
                shape.setAttribute('y', y - currentSize / 2);
                shape.setAttribute('width', currentSize);
                shape.setAttribute('height', currentSize);
                break;
            case 'ellipse':
                shape = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
                shape.setAttribute('stroke', colorPicker.value);
                shape.setAttribute('stroke-width', lineWidthSlider.value);
                shape.setAttribute('fill', startFillColorPicker.value);
                shape.setAttribute('cx', x);
                shape.setAttribute('cy', y);
                shape.setAttribute('rx', currentSize);
                shape.setAttribute('ry', currentSize / 2);
                break;
            case 'heart':
                shape = createHeart(x, y, currentSize);
                break;
            case 'smiley':
                shape = createSmiley(x, y, currentSize);
                break;
        }

        if (shape) {
            shape.classList.add('drawable-shape');
            shape.setAttribute('fill-opacity', opacitySlider.value); // Устанавливаем прозрачность
            svg.appendChild(shape);
            shapes.push(shape); // Добавляем фигуру в массив
        }
    }

    function clearCanvas() {
        while (svg.firstChild) {
            svg.removeChild(svg.firstChild);
        }
        changeBackgroundColor(); // Применяем цвет фона после очистки
    }

    function handleSvgClick(e) {
        if (eraseMode.checked && e.target.classList.contains('drawable-shape')) {
            svg.removeChild(e.target);
        }
    }

    function saveDrawing() {
        const serializer = new XMLSerializer();
        const source = serializer.serializeToString(svg);

        const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = 'drawing.svg';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    }

    function applyGradientFill() {
        if (shapes.length < 2) return;

        const startColor = hexToRgb(startFillColorPicker.value);
        const endColor = hexToRgb(endFillColorPicker.value);

        shapes.forEach((shape, index) => {
            const ratio = index / (shapes.length - 1);
            const fillColor = interpolateColor(startColor, endColor, ratio);
            shape.setAttribute('fill', rgbToHex(fillColor));
            shape.setAttribute('fill-opacity', opacitySlider.value); // Применяем прозрачность
        });
    }

    function changeBackgroundColor() {
        svg.style.backgroundColor = backgroundColorPicker.value;
    }

    function hexToRgb(hex) {
        const bigint = parseInt(hex.slice(1), 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return [r, g, b];
    }

    function rgbToHex(rgb) {
        const [r, g, b] = rgb;
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }

    function interpolateColor(startColor, endColor, ratio) {
        const r = Math.round(startColor[0] + ratio * (endColor[0] - startColor[0]));
        const g = Math.round(startColor[1] + ratio * (endColor[1] - startColor[1]));
        const b = Math.round(startColor[2] + ratio * (endColor[2] - startColor[2]));
        return [r, g, b];
    }

    function createHeart(cx, cy, size) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const d = `
            M ${cx},${cy}
            m -${size / 2},0
            a ${size / 4},${size / 4} 0 1,1 ${size / 2},0
            a ${size / 4},${size / 4} 0 1,1 ${size / 2},0
            l -${size / 2},${size / 2}
            z
        `;
        path.setAttribute('d', d);
        path.setAttribute('stroke', colorPicker.value);
        path.setAttribute('stroke-width', lineWidthSlider.value);
        path.setAttribute('fill', startFillColorPicker.value);
        return path;
    }

    function createSmiley(cx, cy, size) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');

        const face = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        face.setAttribute('cx', cx);
        face.setAttribute('cy', cy);
        face.setAttribute('r', size);
        face.setAttribute('stroke', colorPicker.value);
        face.setAttribute('stroke-width', lineWidthSlider.value);
        face.setAttribute('fill', startFillColorPicker.value);

        const eyeOffsetX = size / 3;
        const eyeOffsetY = size / 3;
        const eyeSize = size / 10;

        const leftEye = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        leftEye.setAttribute('cx', cx - eyeOffsetX);
        leftEye.setAttribute('cy', cy - eyeOffsetY);
        leftEye.setAttribute('r', eyeSize);
        leftEye.setAttribute('fill', colorPicker.value);

        const rightEye = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        rightEye.setAttribute('cx', cx + eyeOffsetX);
        rightEye.setAttribute('cy', cy - eyeOffsetY);
        rightEye.setAttribute('r', eyeSize);
        rightEye.setAttribute('fill', colorPicker.value);

        const mouth = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const mouthD = `
            M ${cx - eyeOffsetX},${cy + eyeOffsetY / 2}
            Q ${cx},${cy + eyeOffsetY} ${cx + eyeOffsetX},${cy + eyeOffsetY / 2}
        `;
        mouth.setAttribute('d', mouthD);
        mouth.setAttribute('stroke', colorPicker.value);
        mouth.setAttribute('stroke-width', lineWidthSlider.value);
        mouth.setAttribute('fill', 'none');

        group.appendChild(face);
        group.appendChild(leftEye);
        group.appendChild(rightEye);
        group.appendChild(mouth);

        return group;
    }

    function getMousePosition(e) {
        const CTM = svg.getScreenCTM();
        return {
            x: (e.clientX - CTM.e) / CTM.a,
            y: (e.clientY - CTM.f) / CTM.d
        };
    }

    function saveSettings() {
        const settings = {
            color: colorPicker.value,
            startFillColor: startFillColorPicker.value,
            endFillColor: endFillColorPicker.value,
            brushSize: brushSize.value,
            lineWidth: lineWidthSlider.value,
            sizeIncrease: sizeIncrease.value,
            opacity: opacitySlider.value,
            backgroundColor: backgroundColorPicker.value,
            shape: shapeSelector.value,
            eraseMode: eraseMode.checked
        };
        localStorage.setItem('drawingSettings', JSON.stringify(settings));
    }

    function loadSettings() {
        const settings = JSON.parse(localStorage.getItem('drawingSettings'));
        if (settings) {
            colorPicker.value = settings.color;
            startFillColorPicker.value = settings.startFillColor;
            endFillColorPicker.value = settings.endFillColor;
            brushSize.value = settings.brushSize;
            lineWidthSlider.value = settings.lineWidth;
            sizeIncrease.value = settings.sizeIncrease;
            opacitySlider.value = settings.opacity;
            backgroundColorPicker.value = settings.backgroundColor;
            shapeSelector.value = settings.shape;
            eraseMode.checked = settings.eraseMode;

            lineWidthValue.textContent = settings.lineWidth;
            sizeIncreaseValue.textContent = settings.sizeIncrease;
            opacityValue.textContent = settings.opacity;

            changeBackgroundColor();
        }
    }
}