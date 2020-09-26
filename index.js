window.onload = pageLoad

let player = {x: 1, y: 1}
const Bombs = new Map()
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

  // Re-render the field to display the new position of the player
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
  createOrUpdateField()

  const bombCoordinate = {x, y}
  const bomb = {
    x, 
    y,
    numberOfTurns: 0, 
    numberOfMovesAfterExplosion: 0,
    coordinates: createCoordinates(bombCoordinate),
  };
  Bombs.set(bombCoordinate, bomb)

  artificialDelay()

  console.log('bomb added')
}

function createCoordinates({x, y}) {
  const coordinates = []

  for(let i = 1; i < 4; i++) {
    let id = {x, y}
    let top = {
      id, 
      x, 
      y: y-i,
    }
    let bottom = {
      id, 
      x, 
      y: y+i,
    }
    let left = {
      id, 
      y,
      x: x-i, 
    }
    let right = {
      id, 
      y,
      x: x+i,
    }

    coordinates.push(
      top,
      bottom,
      left,
      right,
    )
  }
  return coordinates.filter(({x, y}) => {
    // m - width n - height
    if(x <= 0 || x === m) {
      return false
    } else if (y <= 0 || y === n-1) {
      return false
    } 

    let isSomeCoordinatesIntersectWalls = walls.coordinates.some(({x: Wx, y: Wy}) => {
      if(Wx === x && Wy === y) {
        return true
      }
      return false
    })

    let isSomeCoordinatesIntersectCases = cases.coordinates.some(({x: Cx, y: Cy}) => {
      if(Cx === x && Cy === y) {
        return true
      }
      return false
    })

    if(isSomeCoordinatesIntersectWalls || isSomeCoordinatesIntersectCases) {
      return false
    }
 
    return true
  })
}

// Creating an artificial delay
function artificialDelay() {
  isDelay = true
  const delay = setTimeout(() => {
    isDelay = false;
    clearTimeout(delay)
  }, 500);
}

// Height
const n = 14

// Width 
const m = 35

function createOrUpdateField() {
  let fieldTemplate = []

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

      const isEx = isTextureMatchAndTryCreateTexture(x, y, mapLayer, bombTexture)
      if(isEx) continue;

      const isPlayerMatch = isCoordinatesMatch(x, y, player)
      if(isPlayerMatch) {
        mapLayer.push('P ')

        // Update counters
        updateCountersAndAddTextures()
        continue;
      }

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

function updateCountersAndAddTextures() {  
  const BombsEntries = Array.from(Bombs.entries())
  if(BombsEntries.length < 1) return;

  for(let [key, value] of BombsEntries) {
    value.numberOfTurns += 1
    Bombs.set(key, value)
    isNeedAddExplosionTexture(value)
  }
}

function isNeedAddExplosionTexture({numberOfTurns, coordinates, numberOfMovesAfterExplosion, ...id}) {
  if(numberOfTurns === 6) {
    bombTexture.coordinates.push(...coordinates)
  }

  if(numberOfTurns > 6) {
    updateNumberOfMovesAfterExplosion()
  }

  if(numberOfMovesAfterExplosion === 2) {
    removeExplosionTextures(id, coordinates)
  }
}

function removeExplosionTextures(id, coordinates) {
  bombTexture.coordinates = coordinates.filter(({coordinateID}) => {
    let a = JSON.stringify(coordinateID), b = JSON.stringify(id)
    return a === b
  })
}

function updateNumberOfMovesAfterExplosion() {
  const BombsEntries = Array.from(Bombs.entries())
  if(BombsEntries.length < 1) return;

  for(let [key, value] of BombsEntries) {
    value.numberOfMovesAfterExplosion += 1
    Bombs.set(key, value)
  }
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
