import { KeyboardState, KeyboardDownFront } from './lib/keyboardState.js'
const keyboardState = KeyboardState('key')(window)
keyboardState.start()
const keyboardDownFront = KeyboardDownFront('key')(window)
keyboardDownFront.start()
import RBush from 'rbush';
import  * as PIXI from 'pixi.js'
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST

// const ticker = new Ticker();

// ticker.maxFPS = 60
// ticker.add(dt => {
//     // console.log(
//     //     'pluc',
//     //     // dt,
//     //     ticker.deltaTime,
//     //     ticker.FPS
//     // )
// })
// ticker.start();

const imageResolver = x => `assets/${x}`



async function go(){
    
    const app = new PIXI.Application({
        width: 160,
        height: 180,
        resolution: 4 * ( window.devicePixelRatio || 1 ),
        antialias:true
    });
    app.stop()
    app.ticker.add(delta => gameLoop(delta));
    document.body.appendChild(app.view);
    
    const terrain  = await loadTerrain( 'assets/map1.tmx' )
    app.stage.addChild(terrain.container);
    console.log('terrain',terrain)
    const animationModels = await loadAnimations( 'assets/animations.tmx' )
    console.log('animationModels',animationModels)

    const animation = AnimatedItem( animationModels )
    animation.container.position.x = terrain.extracted['level-entrance'].x
    animation.container.position.y = terrain.extracted['level-entrance'].y    

    const retribs = {
        'iddle-right' : {
            'left' : { go : 'turn-from-right' },
            'right' : { go : 'walk-right' },
            'up' : { go : 'climb-ladder' },
            'down' : { go : 'descend-ladder' },
            0 :  { go : 'iddle-right' }
        },
        'iddle-left' : {
            'left' : { go : 'walk-left' },
            'right' : { go : 'turn-from-left' },
            'up' : { go : 'climb-ladder' },
            'down' : { go : 'descend-ladder' },
            0 : { go : 'iddle-left' }
        },
        'climb-iddle' : {
            'left' : { go : 'turn-from-right' },
            'right' : { go : 'turn-from-left' },
            'up' : { go : 'climb-ladder' },
            'down' : { go : 'descend-ladder' },
            0 : { go : 'climb-iddle' },
        },
        'climb-ladder' : {
            'up' : { go : 'climb-ladder' },
            'down' : { go : 'descend-ladder' },
            0 : { go : 'climb-iddle' },
        },
        'descend-ladder' : {
            'up' : { go : 'climb-ladder' },
            'down' : { go : 'descend-ladder' },
            0 : { go : 'climb-iddle' },
        },
        'turn-from-right' : {
            0 : { go : 'iddle-left' },
            'left' : { go : 'walk-left' }
        },
        'turn-from-left' : {
            0 : { go :  'iddle-right' },
            'right' : { go : 'walk-right' }
        },
        'walk-left' : {
            'left' : { go : 'walk-left' },
            0 : { go :  'iddle-left' }
        },
        'walk-right' : {
            'right' : { go : 'walk-right' },
            0 :  { go :  'iddle-right' }
        },
    }
    
    animation.on.complete = function(...p){
        const [name,animatedSprite] = p,
              frame = animatedSprite.currentFrame

        const commands = {
            up : keyboardState.state.get('ArrowUp'),
            left : keyboardState.state.get('ArrowLeft'),
            down : keyboardState.state.get('ArrowDown'),
            right : keyboardState.state.get('ArrowRight')
        }
        /*
          if ( onLadder(animation.container.position ) ){
          console.log('onladder')
          }*/
        const retrib = retribs[ name ]
        //console.log('retrib',retrib)
        const matchedCommand = Object.keys( retrib ).find( k => commands[ k ] )
        //        console.log('matchedCommand',matchedCommand)
        const followedBy = retrib[ matchedCommand || 0 ]
        //      console.log('followedBy',followedBy)
        
        
        //const followedBy = retribs[ name ][ 0 ]
        animation.play( followedBy.go )
        //        console.log('// complete',{name,animatedSprite},frame)
    }
    animation.on.frameChange = function (...p) {
        const [name,animatedSprite] = p,
              frame = animatedSprite.currentFrame
        
        if ( name === 'walk-left' ){
            if ( !animation.leftMatter ){
                animation.container.position.x -= 1
            } else {
                animation.play( 'iddle-left' )
            }
        } else if  ( name === 'walk-right' ){
            if ( !animation.rightMatter ){
                animation.container.position.x += 1
            }
        } else if  ( name === 'climb-ladder' ){
            if ( animation.onLadder ){
                animation.container.position.y -= 1
            }
        } else if  ( name === 'descend-ladder' ){
            if ( animation.aboveLadder ){
                animation.container.position.y += 1
            }
        }
        //console.log('// frame change',{name,animatedSprite},frame)
    };
    animation.on.loop = function (...p) {
        const [name,animatedSprite] = p,
              frame = animatedSprite.currentFrame
    };

    function getPlayerCollisionBoxes( pl ){
        const rightBox = {
            minX: pl.position.x + pl.width / 2 - 2,
            maxX: pl.position.x + pl.width / 2 - 1,
            minY: pl.position.y - pl.height / 2 ,
            maxY: pl.position.y + pl.height / 2 - 1,
        }
        const bottomBox = {
            minX: pl.position.x,// - pl.width / 2,
            maxX: pl.position.x,// + pl.width / 2,
            minY: pl.position.y + pl.height / 2 ,
            maxY: pl.position.y + pl.height / 2 ,
        }
        const leftBox = {
            minX: pl.position.x - pl.width / 2,
            maxX: pl.position.x - pl.width / 2 + 1,
            minY: pl.position.y - pl.height / 2 ,
            maxY: pl.position.y + pl.height / 2 - 1,
        }
        const aboveLadderBox = {
            minX: pl.position.x,// - pl.width / 2,
            maxX: pl.position.x,// + pl.width / 2,
            minY: pl.position.y + pl.height / 2, 
            maxY: pl.position.y + pl.height / 2 + 1
        }
        const onLadderBox = {
            minX: pl.position.x,// - pl.width / 2,
            maxX: pl.position.x,// + pl.width / 2,
            minY: pl.position.y,// - pl.height / 2, 
            maxY: pl.position.y + pl.height / 2 
        }
        return { rightBox, leftBox, bottomBox, aboveLadderBox, onLadderBox }
    }
    app.stage.addChild(animation.container);
    app.ticker.add(delta =>  {

        const rtree = terrain.extracted['tree']
        // rtree.all().map( finding => {
        //     const { tile } = finding,
        //           { container } = tile
        //     container.tint = 0x888888
        // })
        //
        // on ladder
        //
        const pl = animation.container
        const { rightBox, leftBox, bottomBox, aboveLadderBox, onLadderBox } = getPlayerCollisionBoxes( pl )
        
        
        {
            const found = rtree.search( leftBox )          
            const leftMatter = found.find( ({tile}) => tile.layer.name === 'matter' )
            animation.leftMatter = leftMatter
        }
        {
            const found = rtree.search( rightBox )
            const rightMatter = found.find( ({tile}) => tile.layer.name === 'matter' )
            animation.rightMatter = rightMatter
        }
        {
            const found = rtree.search( bottomBox )
            const underMatter = found.find( ({tile}) => tile.layer.name === 'matter' )
            animation.underMatter = underMatter
        }
        {
            const plbb = onLadderBox
            const found = rtree.search( plbb )
            const onLadder = found.find( ({tile}) => tile.layer.name === 'ladder' )
            animation.onLadder = onLadder
        } {
            const plbb = aboveLadderBox
            const found = rtree.search( plbb )
            // found.forEach( (finding,i) => {
            //     const { tile } = finding, { container } = tile         
            //     container.tint = 0xffffff
            // })
            const aboveLadder = found.find( ({tile}) => tile.layer.name === 'ladder' )
            animation.aboveLadder = aboveLadder
        }
        // console.log('onLadder',animation.onLadder)
        const { onLadder, underMatter } = animation
        
        if ( !onLadder &&  !underMatter ){
            animation.container.position.y += 1
        }
        
    })

    
    /*
      setTimeout( () => {
      animation.play('turn-from-left')
      },0)
      setTimeout( () => {
      animation.play('turn-from-right')
      },2000)
      setTimeout( () => {
      animation.play('walk-left')
      },4000)
      setTimeout( () => {
      animation.play('climb-ladder')
      },6000)
      setTimeout( () => {
      animation.play('turn-from-left')
      },8000)
    */
    
    app.start()
    animation.play('walk-left')
}
go()

function getControls(){
    const commands = {
        up : keyboardState.state.get('ArrowUp'),
        left : keyboardState.state.get('ArrowLeft'),
        down : keyboardState.state.get('ArrowDown'),
        right : keyboardState.state.get('ArrowRight')
    }
    return commands
}

const state = playing

function gameLoop(delta){
    //Update the current game state:
    state(delta);
}



function playing(dt){
    //console.log('dt',dt)

    keyboardDownFront.reset()
    
    //    console.log(commands)
}

/*
  app.loader
  .add('spritesheet', 'examples/assets/spritesheet/0123456789.json')
  .load(onAssetsLoaded);
*/




// //import 'p2/build/p2.min.js'
// import p2 from 'p2'
// import * as PIXI from 'pixi.js'
// // import * as Audio from './lib/audio.js'
// // Audio.getAudioContext().then( ac => {
// //     console.log('running!',ac)
// // })


// //console.log('PIXI',PIXI)
// /*var container, graphics, zoom,
//   world, boxShape, boxBody, planeBody, planeShape;*/
// /*
//   import { BlurFilter } from '@pixi/filter-blur';
//   import { Container } from '@pixi/display';
//   import { Graphics } from '@pixi/graphics';
//   import { Sprite } from '@pixi/sprite';
// */

// import { GlowFilter } from '@pixi/filter-glow';
// import { AsciiFilter } from '@pixi/filter-ascii';
// import { CRTFilter } from '@pixi/filter-crt'
// import { DotFilter } from '@pixi/filter-dot'
// import { OldFilmFilter } from '@pixi/filter-old-film'


// init();
// //animate();

// import PixiFps from "pixi-fps";
import { parseTMX, loadTerrainTileMap } from './lib/tmx-parser.js'

function AnimatedItem( animationModels ){
    //
    // instanciate animation model (multiple animations in a container)
    //
    const animationContainer = new PIXI.Container();
    const on = {}
    const animations = {}
    Object.entries( animationModels ).forEach( ([name,model]) => {
        const { steps, loop, speed } = model
        const anim = new PIXI.AnimatedSprite(steps);
        anim.anchor.set(0.5);
        anim.scale.set(1);
        anim.animationSpeed = speed
        animationContainer.addChild(anim);
        anim.loop = false//loop
        anim.onComplete = (...p) => on.complete( name, anim, ...p )
        anim.onFrameChange = (...p) => on.frameChange( name, anim, ...p )
        anim.onLoop = on.loop
        anim.visible = false
        animations[ name ] = anim
    })
    let _previousAnimation = undefined
    function play( name ){
        if ( _previousAnimation !== undefined ){
            const anim =  animations[ _previousAnimation  ]
            anim.stop()
            anim.visible = false
        }
        const anim = animations[ name ]
        anim.visible = true
        anim.gotoAndPlay(0)
        _previousAnimation = name
    }
    return { container : animationContainer, on, play }
    
}
async function loadAnimations( url ){
    //
    // load animation model from special tilesheet
    //
    const terrain = await loadTerrainTileMap(url ,imageResolver)
    const animationModels = {}
    terrain.layers.forEach( ( layer, layerIdx ) => {
        animationModels[ layer.name ] = {
            steps : layer.tiles.map( tile => ({
                texture : PIXI.Texture.from( tile.imageBitmap ),
                time : 50
            })),
            loop : layer.properties['animation-loop'],
            speed : layer.properties['animation-speed']
        }
    })
    return animationModels    
}

async function loadTerrain( url ){

    const terrain = await loadTerrainTileMap(url ,imageResolver)

    const extracted = {}
    extracted.ladders = []    
    extracted.matter = []
    extracted.tree = new RBush();

    //
    // special tiles
    //
    terrain.layers.forEach( ( layer, layerIdx ) => {
        layer.tiles.forEach( tile => {
            if ( tile.properties['level-entrance'] ){
                extracted['level-entrance'] = tile.inLayer.position
            }
            if ( tile.properties['level-exit'] ){
                extracted['level-exit'] = tile.inLayer.position
            }
            if ( layer.name === 'ladder' ){
                extracted['ladders'].push( tile.inLayer.position )
            }
            if ( layer.name === 'matter' ){
                extracted['matter'].push( tile.inLayer.position )
                console.log(tile)
            }
            const item = {
                minX: tile.inLayer.position.x - tile.tileset.tilewidth / 2,
                maxX: tile.inLayer.position.x + tile.tileset.tilewidth / 2 - 1,
                minY: tile.inLayer.position.y - tile.tileset.tileheight / 2,
                maxY: tile.inLayer.position.y + tile.tileset.tileheight / 2 - 1,
                tile
            };
            extracted['tree'].insert(item);
        })
    })
    
    //
    // visual tiles, build graphics
    //
    const container = new PIXI.Container();
    terrain.layers.forEach( ( layer, layerIdx ) => {
        layer.tiles.forEach( tile => {
            const position = tile.inLayer.position,
                  imageBitmap = tile.imageBitmap
            const collisionMaskNames = tile.properties['collision-mask']
            const sprite = PIXI.Sprite.from( imageBitmap )
            sprite.anchor.set(0.5)
            sprite.position.x = position.x
            sprite.position.y = position.y
            container.addChild( sprite )
            //
            tile.container = sprite

        })
    })
    return { extracted, container }
}



/*

//import { Ticker } from '@pixi/ticker'


//import { TickerPlugin } from '@pixi/ticker';
//import { Application } from '@pixi/app';
//Application.registerPlugin(TickerPlugin);
//import { Container } from '@pixi/display';
//import { Sprite } from '@pixi/sprite';
*/
