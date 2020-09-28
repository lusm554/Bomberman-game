window.onload = pageLoad

let player = {x: 1, y: 1}
const Bombs = new Map()
let lastTurnTime = Date.now()

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
  if(isDelay()) return;
  lastTurnTime = Date.now()
  
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

function movePlayer(x = 0, y = 0) {
  let currentCagePlayer = {x: player.x + x, y: player.y + y}

  const isPlayerOnTexture = textureIntersectionCheck([currentCagePlayer]).length < 1
  if(isPlayerOnTexture) {
    alert('don\'t touch field!1!!!1')
    return;
  }

  player = currentCagePlayer

  // Re-render the field to display the new position of the player
  createOrUpdateField()
}

/**
 * Just put a bomb in the vault 
 * and check it on every user's turn.
 * @param {number} x - player x
 * @param {number} y - player y
 */
function addBomb({x, y}) {
  createOrUpdateField()

  const bombCoordinate = {x, y}
  const bomb = {
    x, 
    y,
    numberOfTurns: 0, 
    numberOfMovesAfterExplosion: 0,
    coordinates: createCoordinatesExplosion(bombCoordinate),
  };
  Bombs.set(bombCoordinate, bomb)

  console.log('bomb added')
}

function createCoordinatesExplosion({x, y}) {
  const coordinates = []
  const id = {x, y}

  for(let i = 1; i < 4; i++) {
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
  return textureIntersectionCheck(coordinates, id, true)
}

function textureIntersectionCheck(coordinates, id=null, isBomb=false) {
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

    let isSomeCoordinatesIntersectCases = false

    if(isBomb) {
      /**
      * Add the bomb id so that after the explosion the 
      * boxes disappear along with the explosion textures
      */
      cases.coordinates = cases.coordinates.map((coordinate) => {
        let {x: Cx, y: Cy} = coordinate
        if(Cx === x && Cy === y) {
          coordinate.id = id
          isSomeCoordinatesIntersectCases = true
        }
        return coordinate
      })
    } else {
      isSomeCoordinatesIntersectCases = cases.coordinates.some(({x: Cx, y: Cy}) => {
        if(Cx === x && Cy === y) {
          return true
        }
        return false
      })
    }

    if(isSomeCoordinatesIntersectWalls || isSomeCoordinatesIntersectCases) {
      return false
    }

    return true
  })
}

// Check how much time has passed since the player's last move
function isDelay() {
  let time = Date.now() - lastTurnTime
  if(time < 500) {
    return true
  }
  return false
}

// Height
const n = 14

// Width 
const m = 35

function createOrUpdateField() {
  let fieldTemplate = []

  // Create a matrix n on m with all textures
  for(let y = 0; y < n; y++) {
    /**
     * If this is the top or bottom of the frame, add texture
     * and go to a new iteration
     */
    if(y === 0 || y === n-1) {
      fieldTemplate.push('█'.repeat(m*2))
      continue;
    }

    // Create a map layer by iterating over all texture coordinates
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
        
        moveMonsters()
        updateCountersAndAddTextures()
        continue;
      }
      
      const isBombTextureMatch = isTextureMatchAndTryCreateTexture(x, y, mapLayer, bombTexture)
      if(isBombTextureMatch) continue;

      const isWallMatch = isTextureMatchAndTryCreateTexture(x, y, mapLayer, walls)
      if(isWallMatch) continue;

      const isCaseMatch = isTextureMatchAndTryCreateTexture(x, y, mapLayer, cases)
      if(isCaseMatch) continue;

      const isMonsterMatch = isTextureMatchAndTryCreateTexture(x, y, mapLayer, monsters)
      if(isMonsterMatch) continue;

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

function moveMonsters() {
  monsters.coordinates = monsters.coordinates.map(({x, y}) => {
    return randomlyMoveMonster(x, y)
  })
}

// // Move monsters to random coordinates
function randomlyMoveMonster(x, y) {
  let newCoord = {x, y}
  let whichVer = Math.trunc(Math.random() * (4 - 1) + 1);

  switch (whichVer) {
    case 1:
      newCoord.y -= 1
      break;
    case 2: 
      newCoord.y += 1
      break;
    case 3: 
      newCoord.x -= 1
    case 4: 
      newCoord.x += 1
    default:
      break;
  }

  const isCoordinateValid = textureIntersectionCheck([newCoord]).length > 0

  // If the random coordinates do not fit, leave the same
  if(isCoordinateValid) {
    return newCoord
  } else {
    return {x, y}
  }
}

// Updating the bomb counters
function updateCountersAndAddTextures() {  
  const BombsEntries = Array.from(Bombs.entries())
  if(BombsEntries.length < 1) return;

  for(let [key, value] of BombsEntries) {
    if(value.numberOfMovesAfterExplosion > 3 && value.numberOfTurns >= 6) {
      Bombs.delete(key)
      continue;
    }
    value.numberOfTurns += 1
    Bombs.set(key, value)
    isNeedAddExplosionTexture(value)
  }
}

// Checking counters for adding coordinates
function isNeedAddExplosionTexture({numberOfTurns, coordinates, numberOfMovesAfterExplosion, ...id}) {
  if(numberOfTurns === 6) {
    bombTexture.coordinates.push(...coordinates)
  }

  if(numberOfTurns >= 6) {
    const isPlayerOnExplosionField = isPlayerAlive()
    if(isPlayerOnExplosionField) {
      alert('You lose')
      window.location.reload()
    }

    updateNumberOfMovesAfterExplosion()
  }

  if(numberOfMovesAfterExplosion >= 3 && numberOfTurns > 6) {
    removeExplosionTextures(id, coordinates)
  }
}

// Remove textures after explosion
function removeExplosionTextures(id, coordinates) {
  bombTexture.coordinates = coordinates.filter(({id: {x, y}}) => {
    return !isCoordinatesMatch(x, y, id)
  })

  cases.coordinates = cases.coordinates.filter(( {id: {x, y} }) => {
    return !isCoordinatesMatch(x, y, id)
  })
}

// Player explosion check
function isPlayerAlive() {
  return bombTexture.coordinates.some(({x, y}) => {
    return isCoordinatesMatch(x, y, player)
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
