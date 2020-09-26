window.onload = pageLoad

let player = {x: 1, y: 1}
const Bombs = new Set()
let isDelay = false

function pageLoad() {
  // Create a field and arrange objects.
  createOrUpdateField()

  // Handling keystrokes.
  document.addEventListener('keydown', keyPressHandler)
}

function keyPressHandler({keyCode}) {
  /**
   * I use return here instead of event.preventDefault() 
   * because it's so convenient to receive arguments
   */
  if(isDelay) return;
  
  switch (keyCode) {
    // W
    case 87:
      movePlayer(0, -1)
      break;    

    // A
    case 65: 
      movePlayer(-1, 0)
      break;
    
    // S
    case 83: 
      movePlayer(0, 1)
      break;
    
    // D
    case 68:
      movePlayer(1, 0)
      break;

    // Space
    case 32: 
      addBomb(player)
      break;
    
    default:
      break;
  }
}

async function movePlayer(x = 0, y = 0) {
  player = {x: player.x + x, y: player.y + y}

  createOrUpdateField()
  artificialDelay()
}

/**
 * Just put a bomb in the vault 
 * and check it on every user's turn.
 * @param {number} x - player x
 * @param {number} y - player y
 */
async function addBomb({x, y}) {
  const bomb = {
    numberOfTurns: 0, 
    numberOfMovesAfterExplosion: 0,
    x, 
    y,
  };
  Bombs.add(bomb)

  createOrUpdateField()
  artificialDelay()

  console.log('bomb added')
}

// Creating an artificial delay
function artificialDelay() {
  isDelay = true
  const delay = setTimeout(() => {
    isDelay = false;
    clearTimeout(delay)
  }, 500);
}

/**
 * TODO: make constructor which 
 * build matrix with all texture (case = С, wall = █)
 * 
 * try to use class for creating bomb or wall or monster
 */
function createOrUpdateField() {
  let fieldTemplate = []

  // Height
  const n = 14

  // Width 
  const m = 35

  for(let y = 0; y < n; y++) {
    /**
     * If this is the top or bottom of the frame, add texture
     * and go to a new iteration
     */
    if(y === 0 || y === n-1) {
      fieldTemplate.push('█'.repeat(m*2))
      continue;
    }

    // Create a map layer
    let mapLayer = []
    for(let x = 0; x <= m; x++) {
      /**
       * If it's left or right of the frame add texture
       * and go to a new iteration
       */
      if(x === 0 || x === m) {
        mapLayer.push('█')
        continue;
      }

      const isPlayerMatch = isCoordinatesMatch(x, y, player)
      if(isPlayerMatch) {
        mapLayer.push('P ')
        continue;
      }


      /**
       * If bomb here, add bomb on the map and return bomb,
       * otherwise keep checking for others textures
       */
      const {texture, explosionCoordinates} = bombTexture;
      const isBombHere = IsBombHereAndItExplodes(x, y, mapLayer, {
        bombObjects: Array.from(Bombs.values()),
        texture,
        explosionCoordinates,
      })
      if(isBombHere) continue;

      const isWallMatch = isTextureMatchAndTryCreateTexture(x, y, mapLayer, walls)
      if(isWallMatch) continue;

      const isCaseMatch = isTextureMatchAndTryCreateTexture(x, y, mapLayer, cases)
      if(isCaseMatch) continue;

      mapLayer.push('  ')
    }

    fieldTemplate.push(mapLayer)
  }

  /**
   * If the texture fits, add it to the map layer.
   * @param {number} currentX - x at the moment of layer creation
   * @param {number} currentY - y at the moment of layer creation
   * @param {object} mapLayer - current map layer
   */
  function isTextureMatchAndTryCreateTexture(currentX, currentY, mapLayer, {coordinates, texture}) {
    return coordinates.some((coordinate) => {
      const isTextureMatch = isCoordinatesMatch(currentX, currentY, coordinate)
      if(isTextureMatch) {
        mapLayer.push(texture)
        return true
      }
      return false
    })
  }

  // Convert a matrix to a string
  let textField = fieldTemplate.reduce((template, currentLayer) => {
    let mapTextLayer = Array.isArray(currentLayer) ? 
      currentLayer.join('') : currentLayer
    
    return template += '\n'+mapTextLayer
  })

  document.getElementById('field').innerHTML = textField
}

/**
 * Add bomb coordinate to the Bombs 
 * On update field check: 
 *  1. Is bomb explodes <Done>
 *  2. Is bomb on the current cage <Done>
 * If bomb should explodes, rendering explodes 
 */
function IsBombHereAndItExplodes(currentX, currentY, mapLayer, {bombObjects, texture, explosionCoordinates}) {
  // If bombs have not been added yet
  if(bombObjects.length === 0) return false;

  const bomb = bombObjects.find(({numberOfTurns, numberOfMovesAfterExplosion, ...bombCoordinates}) => {
    // if the current coordinates and bomb coordinates do not match
    if(!isCoordinatesMatch(currentX, currentY, bombCoordinates)) return false;

    mapLayer.push(texture)
    return true
  })

  /**
   * I create a constant a to avoid confusion. If the current coordinate 
   * does not match the bomb coordinate, 
   * then the method find returns false, otherwise it returns the bomb object.
   */
  const isBombExist = !!bomb;
  if(!isBombExist) return false;

  if(bomb.numberOfTurns === 4) {
    console.log('current bomb coordinate:', currentX, currentY)
  }

  /**
   * 5 because rendering happens on the next turn, 
   * so it turns out after 6 player turns
   */
  if(bomb.numberOfTurns === 5) {
    Bombs.delete(bomb)
    console.log(explosionCoordinates)
    console.log('boom')
    return true
  }

  // Updating the value in the bomb object
  Bombs.delete(bomb)
  bomb.numberOfTurns+=1
  Bombs.add(bomb)

  return true
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

function createCoordinates() {
/** 
 * example (x: 17 y: 5)
 * On the top 
 * {x: 17, y: 4}
 * {x: 17, y: 3}
 * {x: 17, y: 2}
 * On the bottom 
 * {x: 17, y: 6}
 * {x: 17, y: 7}
 * {x: 17, y: 8}
 * On the left
 * {x: 16, y: 5}
 * {x: 15, y: 5}
 * {x: 14, y: 5}
 * On the right
 * {x: 18, y: 5}
 * {x: 19, y: 5}
 * {x: 20, y: 5}
 */
}