import { RoundedBoxGeometry } from '../mods/RoundedBoxGeometry.js'

export default class Dice extends THREE.Mesh {
    constructor(scene, x, y, z, edgeLength, key, materialsArray) {
        const cubeGeometry = new RoundedBoxGeometry(edgeLength, edgeLength, edgeLength, 3, 5);
        cubeGeometry.smooth = true;

        //Генерация случайного индекса для текстуры каждой грани
        const randomFaceIndices = []
        while (randomFaceIndices.length < materialsArray.length) {
            const randomIndex = Math.floor(Math.random() * materialsArray.length)
            if (!randomFaceIndices.includes(randomIndex)) {
                randomFaceIndices.push(randomIndex)
            }
        }

        const randomMaterialsArray = []
        for (let i = 0; i < materialsArray.length; i++) {
            randomMaterialsArray.push(materialsArray[randomFaceIndices[i]])
        }

        super(cubeGeometry, randomMaterialsArray)

        this.key = key
        this.faceValue = randomFaceIndices[4] + 1
        this.removed = false
        this.position.set(x, y, z)

        scene.add(this)

        //console.log(this.key, ', лицевое значение - ', this.faceValue, randomFaceIndices)
    }
}