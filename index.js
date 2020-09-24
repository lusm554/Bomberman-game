window.onload = pageLoad

let player = {x: 1, y: 1}
let monsters = []
let walls = [
  {x: 6, y: 1},
  {x: 6, y: 2},
  {x: 6, y: 3},
  {x: 11, y: 3},
  {x: 12, y: 3},
  {x: 13, y: 3},
  {x: 14, y: 3},
  {x: 15, y: 3},
  {x: 11, y: 4},
  {x: 11, y: 5},
  {x: 11, y: 6},
  {x: 11, y: 7},
  {x: 30, y: 3},
  {x: 30, y: 4},
  {x: 30, y: 5},
  {x: 30, y: 6},
  {x: 30, y: 7},
  {x: 33, y: 3},
  {x: 34, y: 3},
  {x: 35, y: 3},
  {x: 36, y: 3},
  {x: 37, y: 3},
  {x: 38, y: 3},
  {x: 39, y: 3},
  {x: 40, y: 3},
  {x: 37, y: 2},
  {x: 37, y: 1},
]

function pageLoad() {
  // Create a field and arrange objects.
  createField()

  // Handling keystrokes.
  document.addEventListener('keydown', keyPressHandler)
}

function keyPressHandler({ key, code, keyCode }) {
  console.log(`key: ${key} code: ${code} ${keyCode}`)
}

/**
 * TODO: make constructor which 
 * build matrix with all texture (case = С, wall = █)
 * 
 * try to use class for creating bomb or wall or monster
 */
function createField() {
  let fieldTemplate = []

  // Height
  const n = 9

  // Width 
  const m = 50

  for(let y = 0; y < n; y++) {
    /**
     * If this is the top or bottom of the frame, add texture
     * and go to a new iteration
     */
    if(y === 0 || y === n-1) {
      fieldTemplate.push('█'.repeat(m))
      continue;
    }

    // Create a map layer
    let mapLayer = []
    for(let x = 0; x < m; x++) {
      /**
       * If it's left or right of the frame add texture
       * and go to a new iteration
       */
      if(x === 0 || x === m-1) {
        mapLayer.push('█')
        continue;
      }

      const isPlayerMatch = isCoordinatesMatch(x, y, player)
      if(isPlayerMatch) {
        mapLayer.push('P')
        continue;
      }

      const isWallMatch = isWallMatchAndTryCreateWall(x, y, mapLayer)
      if(isWallMatch) continue;

      mapLayer.push(' ')
    }

    fieldTemplate.push(mapLayer)
  }

  /**
   * If the wall fits, add it to the map layer.
   * @param {number} currentX - x at the moment of layer creation
   * @param {number} currentY - y at the moment of layer creation
   * @param {object} mapLayer - current map layer
   */
  function isWallMatchAndTryCreateWall(currentX, currentY, mapLayer) {
    return walls.some((wall) => {
      const isWallMatch = isCoordinatesMatch(currentX, currentY, wall)
      if(isWallMatch) {
        mapLayer.push('█')
        return true
      }
      return false
    })
  }

  /**
   * Match the layer coordinates to the checked texture.
   * @param {number} currentX - x at the moment of layer creation
   * @param {number} currentY - y at the moment of layer creation
   * @param {object} textureObject - texture object
   */
  function isCoordinatesMatch(currentX, currentY, {x: objectX, y: objectY}) {
    return (currentX === objectX) && (currentY === objectY)
  }

  // Convert a matrix to a string
  let textField = fieldTemplate.reduce((template, currentLayer) => {
    let mapTextLayer = Array.isArray(currentLayer) ? 
      currentLayer.join('') : currentLayer
    
    return template += '\n'+mapTextLayer
  })

  document.getElementById('field').innerHTML = textField
}
