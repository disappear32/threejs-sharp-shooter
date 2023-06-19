//import * as THREE from 'three'
import Game from './Game.js'

const width = window.innerWidth
const height = window.innerHeight

const renderer = new THREE.WebGLRenderer({
	antialias: true,
	canvas: document.getElementById('app')
})
renderer.setSize(width, height)

const mainCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1500)
mainCamera.position.set(0, 150, 600)
//mainCamera.lookAt(0, 1000, 0)

//const mainCamera = new THREE.OrthographicCamera( width / - 2, width / 2, height / 2 + 100, height / - 2  + 100, -1000, 2000 )

const scene = new Game(mainCamera, renderer)
scene.initialize()

function tick()
{
	scene.update()
	renderer.render(scene, mainCamera)
	requestAnimationFrame(tick)
}

tick()