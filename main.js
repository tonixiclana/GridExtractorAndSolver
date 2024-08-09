// ==UserScript==
// @name         Captura y Comparación de Canvas con Etiquetado
// @namespace    http://tampermonkey.net/
// @version      1.6
// @description  Captura casillas del canvas, las compara con imágenes de referencia y etiqueta cada casilla con el nombre de la imagen más coincidente
// @author       Tu Nombre
// @match        https://gosupermodel.com/games/wardrobegame.jsp
// @grant        none
// @require      https://cdn.jsdelivr.net/npm/resemblejs@4.1.0/resemble.min.js
// ==/UserScript==

(function() {
    'use strict';

    // URLs de las imágenes de referencia en GitHub
    const referenceImages = {
        "imagen1": "https://raw.githubusercontent.com/jildertvenema/grid-solver/main/img/schoen.png",
        "imagen2": "https://raw.githubusercontent.com/jildertvenema/grid-solver/main/img/shirt.png",
        "imagen3": "https://raw.githubusercontent.com/jildertvenema/grid-solver/main/img/tas.png",
        "imagen4": "https://raw.githubusercontent.com/jildertvenema/grid-solver/main/img/broek.png"
    };

    // Esperar a que la página cargue completamente
    window.onload = function() {
        var canvas = document.querySelector('canvas');

        if (!canvas) {
            console.log('No se encontró el elemento canvas');
            return;
        }

        var x = 355;  // Coordenada X de inicio
        var y = 20;   // Coordenada Y de inicio
        var totalWidth = 375;  // Ancho total de la zona a capturar
        var totalHeight = 410; // Alto total de la zona a capturar

        var columns = 11;
        var rows = 12;

        var cellWidth = totalWidth / columns;
        var cellHeight = totalHeight / rows;

        var canvasContainer = document.querySelector('#loading_panel');
        if (!canvasContainer) {
            console.log('No se encontró el div con id "loading_panel"');
            return;
        }

        canvasContainer.innerHTML = ''; // Limpiar el contenido anterior

        for (var row = 0; row < rows; row++) {
            for (var col = 0; col < columns; col++) {
                var cellX = x + col * cellWidth;
                var cellY = y + row * cellHeight;

                var captureCanvas = document.createElement('canvas');
                var ctx = captureCanvas.getContext('2d');
                captureCanvas.width = cellWidth;
                captureCanvas.height = cellHeight;
                ctx.drawImage(canvas, cellX, cellY, cellWidth, cellHeight, 0, 0, cellWidth, cellHeight);

                var cellDataURL = captureCanvas.toDataURL('image/png');
                var img = new Image();
                img.src = cellDataURL;

                var label = document.createElement('div')
                label.id = `cell_${row}_${col}`
                label.style.textAlign = 'center';
                label.style.fontSize = '12px';
                label.style.color = '#000';

                // Comparar la imagen capturada con las imágenes de referencia
                compareWithReferences(cellDataURL, referenceImages, `cell_${row}_${col}`, function(name, cell_name) {

                    var label_div = document.getElementById(cell_name)
                    label_div.textContent = name;

                });

                    // Crear un contenedor para la imagen y el nombre
                    var wrapper = document.createElement('div');
                    wrapper.style.marginBottom = '10px';
                    wrapper.appendChild(img);
                    wrapper.appendChild(label);

                    canvasContainer.appendChild(wrapper);
            }
        }
    };

    function compareWithReferences(cellDataURL, references, cell_name, callback) {
        console.log('Comparando imagen capturada...');
        var comparisons = Object.keys(references).map(name => {
            return new Promise((resolve, reject) => {
                resemble(cellDataURL).compareTo(references[name]).onComplete(function(data) {
                    console.log(`Comparación de cellDataURL ${cellDataURL} con ${name}: ${data.misMatchPercentage}%`);
                    resolve({ name, misMatchPercentage: data.misMatchPercentage });
                });
            });
        });

        Promise.all(comparisons).then(results => {
            results.sort((a, b) => a.misMatchPercentage - b.misMatchPercentage);
            var bestMatch = results[0];
            if (bestMatch.misMatchPercentage < 5) { // Ajusta la tolerancia según sea necesario
                console.log(`Mejor coincidencia: ${bestMatch.name}`);
                callback(bestMatch.name, cell_name);
            } else {
                console.log('No se encontró una buena coincidencia');
                callback('No coincide', cell_name);
            }
        }).catch(error => {
            console.error('Error en la comparación de imágenes:', error);
            callback('Error', cell_name);
        });
    }
})();
