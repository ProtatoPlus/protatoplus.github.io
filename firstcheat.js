// ==UserScript==
// @name         Krunker.io Basic Cheats V1
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Modified open source cheat
// @author       Protato (Thank you NRG (Thank you Zertalious/Zert))
// @match        *://krunker.io/*
// @match        *://browserfps.com/*
// @exclude      *://krunker.io/social*
// @exclude      *://krunker.io/editor*
// @icon        https://media.discordapp.net/attachments/1006728202342895758/1101161664671404042/FqTAFqIWAAAz5z6.jpg?width=685&height=640
// @grant        none
// @run-at       document-start
// @require      https://unpkg.com/three@latest/build/three.min.js
// ==/UserScript==

let scene;
let playerList = [];
var keyList = {};

const x = {
    document: document,
    querySelector: document.querySelector,
    consoleLog: console.log,
    ReflectApply: Reflect.apply,
    ArrayPrototype: Array.prototype
};

let localplayer;

const proxied = new Proxy( Array.prototype.push, {
    apply( target, thisArgs, [ object ] ) {

        try {

            if ( typeof object === 'object' &&
                typeof object.parent === 'object' &&
                object.parent.type === 'Scene' &&
                object.parent.name === 'Main' ) {

                scene = object.parent;

            }

        } catch ( error ) {}

        return x.ReflectApply( ...arguments );

    }
} );

const interval = setInterval( function () {

    const el = x.querySelector.call( x.document, '#initLoader' );

    if ( el && el.style.display === 'none' ) {

        x.consoleLog( 'Injecting!' );

        x.ArrayPrototype.push = proxied;

        clearInterval( interval );

    }

}, 1 );

let espEnabled = true;
let aimbotEnabled = false;
let aimbotOnRightMouse = false;
let espLinesEnabled = true;

// Create a new vector for temporary use
const tempVector = new THREE.Vector3();

// Create a new object for temporary use and set the rotation order to 'YXZ'
const tempObject = new THREE.Object3D();
tempObject.rotation.order = 'YXZ';

// Create a new geometry for the box and translate it to center it around the y-axis
const geometry = new THREE.EdgesGeometry( new THREE.BoxGeometry( 5, 15, 5 ).translate( 0, 7.5, 0 ) );

const materialLine = new THREE.RawShaderMaterial( {
    vertexShader: `
	attribute vec3 position;
	uniform mat4 projectionMatrix;
	uniform mat4 modelViewMatrix;
	void main() {
		gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		gl_Position.z = 1.0;
	}
	`,
    fragmentShader: `
	void main() {
		gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0 );
	}
	`
} );

const materialBox = new THREE.RawShaderMaterial( {
    vertexShader: `
	attribute vec3 position;
	uniform mat4 projectionMatrix;
	uniform mat4 modelViewMatrix;
	void main() {
		gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		gl_Position.z = 1.0;
	}
	`,
    fragmentShader: `
	void main() {
		gl_FragColor = vec4( 0.0, 1.0, 1.0, 1.0);
	}
	`
} );

// Create a new line using the box geometry and material
const line = new THREE.LineSegments( new THREE.BufferGeometry(), materialLine );

// Set the line's frustumCulled property to false to improve performance
line.frustumCulled = false;

// Create a new buffer attribute to hold the line's positions
const linePositions = new THREE.BufferAttribute( new Float32Array( 100 * 2 * 3 ), 3 );

// Set the line's geometry to use the linePositions buffer attribute for the position attribute
line.geometry.setAttribute( 'position', linePositions );

function animate() {

    window.onkeyup = function(e) { keyList[e.keyCode] = false; }
    window.onkeydown = function(e) { keyList[e.keyCode] = true; }

    window.requestAnimationFrame( animate );

    if (scene === undefined ) {
        return;
    }

    const players = [];

    let myPlayer;

    for ( let i = 0; i < scene.children.length; i ++ ) {

        const child = scene.children[ i ];

        if ( child.type === 'Object3D' ) {

            try {

                if ( child.children[ 0 ].children[ 0 ].type === 'PerspectiveCamera' ) {

                    myPlayer = child;
                    localplayer = myPlayer;

                } else {

                    players.push( child );
                    playerList.push( child );
                }

            } catch ( err ) {}

        }

    }



    let counter = 0;

    let targetPlayer;
    let minDistance = Infinity;

    tempObject.matrix.copy( myPlayer.matrix ).invert()

    // Loop through all players in the players array
    for (let i = 0; i < players.length; i++) {

        // Get the current player
        const player = players[i];

        // If the player doesn't have a box yet, create one and add it to the player object
        if (!player.box) {
            const box = new THREE.LineSegments(geometry, materialBox);
            box.frustumCulled = true;
            player.add(box);
            player.box = box;
        }

        // If the player is in the same position as myPlayer, hide the box and continue to the next player
        if (player.position.x === myPlayer.position.x && player.position.z === myPlayer.position.z) {
            player.box.visible = false;

            if (line.parent !== player) {
                player.add(line);
            }

            continue;
        }

        // Set the line positions for the player's position and a point 10 units above them
        linePositions.setXYZ(counter++, 0, 10, -5);

        // Copy the player's position and add 9 units to the y value
        tempVector.copy(player.position);
        tempVector.y += 9;

        // Apply the matrix transform to the tempVector
        tempVector.applyMatrix4(tempObject.matrix);

        // Set the line position for the transformed tempVector
        linePositions.setXYZ(
            counter++,
            tempVector.x,
            tempVector.y,
            tempVector.z
        );

        // Set the player to be visible if espEnabled is true or if they were already visible
        player.visible = espEnabled || player.visible;

        // Show or hide the box depending on whether espEnabled is true
        player.box.visible = espEnabled;

        // Calculate the distance between the current player and myPlayer
        const distance = player.position.distanceTo(myPlayer.position);

        // If the distance is less than the current minimum distance, set the target player to the current player and update the minimum distance
        if (distance < minDistance) {
            targetPlayer = player;
            minDistance = distance;
        }
    }
    playerList = players;

    // Update the draw range of the line based on the number of line positions
    linePositions.needsUpdate = true;
    line.geometry.setDrawRange( 0, counter );

    // Set the visibility of the line based on the esp lines setting
    line.visible = espLinesEnabled;

    // Check if aimbot is enabled, if right mouse button is used, and if there is a target player
    if (aimbotOnRightMouse && rightMouseDown) {
        // Set the tempVector to 0
        tempVector.setScalar( 0 );

        // Get the position of the target player
        targetPlayer.children[ 0 ].children[ 0 ].localToWorld( tempVector );
        tempVector.y += targetPlayer.crouching ? -1.0 : 2.0; // aim lower if target is crouching //I HAVE NO IDEA WHAT THE ATTRIBUTE IS FOR CROUCHING BUT PLEASE FIX

        // Set the position of the tempObject to the player's position and make it look at the target player
        tempObject.position.copy( myPlayer.position );
        tempObject.lookAt( tempVector );

        // Rotate the player model to aim at the target player
        myPlayer.children[ 0 ].rotation.x = - tempObject.rotation.x;
        myPlayer.rotation.y = tempObject.rotation.y + Math.PI;
    }

}

const el = document.createElement( 'div' );

el.innerHTML = `<style>
.dialog {
	position: absolute;
	left: 50%;
	top: 50%;
	padding: 20px;
	background: rgba(0, 0, 0, 0.8);
	border: 6px solid rgba(0, 0, 0, 0.2);
	color: #fff;
	transform: translate(-50%, -50%);
	text-align: center;
	z-index: 999999;
}
.dialog * {
	color: #fff;
}
.close {
	position: absolute;
	right: 5px;
	top: 5px;
	width: 20px;
	height: 20px;
	opacity: 0.5;
	cursor: pointer;
}
.close:before, .close:after {
	content: ' ';
	position: absolute;
	left: 50%;
	top: 50%;
	width: 100%;
	height: 20%;
	transform: translate(-50%, -50%) rotate(-45deg);
	background: #fff;
}
.close:after {
	transform: translate(-50%, -50%) rotate(45deg);
}
.close:hover {
	opacity: 1;
}
.btn {
	cursor: pointer;
	padding: 0.5em;
	background: red;
	border: 3px solid rgba(0, 0, 0, 0.2);
}
.btn:active {
	transform: scale(0.8);
}
.msg {
	position: absolute;
	left: 10px;
	bottom: 10px;
	color: #fff;
	background: rgba(0, 0, 0, 0.6);
	font-weight: bolder;
	padding: 15px;
	animation: msg 0.5s forwards, msg 0.5s reverse forwards 3s;
	z-index: 999999;
	pointer-events: none;
}
@keyframes msg {
	from {
		transform: translate(-120%, 0);
	}
	to {
		transform: none;
	}
}
</style>
<div class="msg" style="display: none;"></div>
<div class="dialog">${`<div class="close" onclick="this.parentNode.style.display='none';"></div>
	<big>== Krunker Menu ==</big>
	<br>
	<br>
	[B] to toggle aimbot
	<br>
	[V] to toggle ESP
	<br>
	[N] to toggle ESP Lines
	<br>
	[L] to toggle aimbot on <br>right mouse hold
	<br>
	[H] to show/hide help
	<br>
	<br>
	By Protato
	<br>
	<br>
	` }
</div>`;

const msgEl = el.querySelector( '.msg' );
const dialogEl = el.querySelector( '.dialog' );

window.addEventListener( 'DOMContentLoaded', function () {

    while ( el.children.length > 0 ) {

        document.body.appendChild( el.children[ 0 ] );

    }

} );

let rightMouseDown = false;

function handleMouse( event ) {

    if ( event.button === 2 ) {

        rightMouseDown = event.type === 'pointerdown' ? true : false;

    }

}

window.addEventListener( 'pointerdown', handleMouse );
window.addEventListener( 'pointerup', handleMouse );

window.addEventListener( 'keyup', function ( event ) {

    switch ( event.code ) {

        case 'KeyV' :

            espEnabled = ! espEnabled;

            showMsg( 'ESP', espEnabled );

            break;

        case 'KeyB' :
            aimbotOnRightMouse = !aimbotOnRightMouse;

            showMsg( 'Aimbot', aimbotOnRightMouse)
            break;

        case 'KeyH' :

            dialogEl.style.display = dialogEl.style.display === '' ? 'none' : '';

            break;

        case 'KeyL' :
            x.consoleLog(keyList);
            break;

        case 'KeyN' :

            espLinesEnabled = ! espLinesEnabled;

            showMsg( 'ESP Lines', espLinesEnabled );

            break;

    }

} );

function showMsg( name, bool ) {

    msgEl.innerText = name + ': ' + ( bool ? 'ON' : 'OFF' );

    msgEl.style.display = 'none';

    void msgEl.offsetWidth;

    msgEl.style.display = '';

}

animate();