import { KeyboardState, KeyboardDownFront } from './lib/keyboardState.js'
import RBush from 'rbush';
import  * as PIXI from 'pixi.js'
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST




const imageResolver = x => `assets/${x}`

// setup renderer and ticker
var renderer = new PIXI.Renderer({
    width: 160,
    height: 180,
    resolution: 4 * ( window.devicePixelRatio || 1 ),
    antialias:true
})
document.body.appendChild(renderer.view)

const keyboardState = KeyboardState('key')(window)
keyboardState.start()
const keyboardDownFront = KeyboardDownFront('key')(window)
keyboardDownFront.start()
function getCommands(){
    const commands = {
        up : keyboardState.state.get('ArrowUp'),
        left : keyboardState.state.get('ArrowLeft'),
        down : keyboardState.state.get('ArrowDown'),
        right : keyboardState.state.get('ArrowRight')
    }
    return commands
}

async function go(){
   
    var stage = new PIXI.Container();
    var ticker = new PIXI.Ticker();
  
    
    //    app.stop()
    //app.ticker.add(delta => gameLoop(delta));
    //document.body.appendChild(app.view);
    
    const terrain  = await loadTerrain( 'assets/map1.tmx' )
    stage.addChild(terrain.container);
    console.log('terrain',terrain)
    const animationModels = await loadAnimations( 'assets/animations.tmx' )
    console.log('animationModels',animationModels)

    const animation = AnimatedItem( animationModels )
    animation.container.position.x = terrain.extracted['level-entrance'].x
    animation.container.position.y = terrain.extracted['level-entrance'].y    
    stage.addChild(animation.container);

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
        const retrib = retribs[ name ]
        const matchedCommand = Object.keys( retrib ).find( k => commands[ k ] )
        const followedBy = retrib[ matchedCommand || 0 ]
        animation.play( followedBy.go )
    }
    animation.on.frameChange = function (...p) {
    }
   
    animation.on.loop = function (...p) {
        const [name,animatedSprite] = p,
              frame = animatedSprite.currentFrame
    };

    function getPlayerCollisionBoxes( x, y, width, height ){
        return {
            rightBox : {
                minX: x + width / 2 - 2,
                maxX: x + width / 2 - 1,
                minY: y - height / 2 ,
                maxY: y + height / 2 - 1,
            },
            bottomBox : {
                minX: x,
                maxX: x,
                minY: y + height / 2 ,
                maxY: y + height / 2 ,
            },
            leftBox : {
                minX: x - width / 2,
                maxX: x - width / 2 + 1,
                minY: y - height / 2 ,
                maxY: y + height / 2 - 1,
            },
            aboveLadderBox : {
                minX: x,
                maxX: x,
                minY: y + height / 2, 
                maxY: y + height / 2 + 1
            },
            onLadderBox : {
                minX: x,
                maxX: x,
                minY: y,
                maxY: y + height / 2 
            }
        }
    }
    function updateSurroundings(){
        const pl = animation.container,
              {x,y} = pl.position,
              {width,height} = pl,
              rtree = terrain.extracted['tree']
        
        const { rightBox, leftBox, bottomBox,
                aboveLadderBox, onLadderBox } = getPlayerCollisionBoxes( x,y,width,height )

        // rtree.all().map( finding => {
        //     const { tile } = finding,
        //           { container } = tile
        //     container.tint = 0x888888
        // })
       
        const f1 = rtree.search( leftBox )          
        const leftMatter = f1.find( ({tile}) => tile.layer.name === 'matter' )
        const f2 = rtree.search( rightBox )
        const rightMatter = f2.find( ({tile}) => tile.layer.name === 'matter' )
        const f3 = rtree.search( bottomBox )
        const underMatter = f3.find( ({tile}) => tile.layer.name === 'matter' )
        const f4 = rtree.search( onLadderBox )
        const onLadder = f4.find( ({tile}) => tile.layer.name === 'ladder' )
        const f5 = rtree.search( aboveLadderBox )
        // f5.forEach( (finding,i) => {
        //     const { tile } = finding, { container } = tile         
        //     container.tint = 0xffffff
        // })
        const aboveLadder = f5.find( ({tile}) => tile.layer.name === 'ladder' )
        const surroundings = {
            leftMatter,
            rightMatter,
            underMatter,
            onLadder,
            aboveLadder
        }
        Object.assign( animation, surroundings )
        return surroundings
    }
 
    const fixedTimeStep = 1/24
    const world = {
        time : 0,
        step : 0
    }
    function worldFixedStep( ){
        //console.log('do change',i,world.step,intStep,world.time)
        const surroundings = updateSurroundings( animation.container )        
        const { onLadder, underMatter } = animation        
        if ( !onLadder && !underMatter ){
            animation.container.position.y += 1
        } else {
            const commands = animation.commands
            /*
              const [name,animatedSprite] = p,
              frame = animatedSprite.currentFrame
            */
            if ( commands.left ){
                if ( !animation.leftMatter ){
                    animation.container.position.x -= 1
                } else {
                    animation.play( 'iddle-left' )
                }
            } else if ( commands.right ){
                if ( !animation.rightMatter ){
                    animation.container.position.x += 1
                } else {
                    animation.play( 'iddle-right' )
                }
                
            } else if ( commands.up ){
                if ( animation.onLadder ){
                    animation.container.position.y -= 1
                }   
            } else if ( commands.down ){
                if ( animation.aboveLadder ){
                    animation.container.position.y += 1
                }
            }
            /*
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
            }*/
        }
    }
    
    function worldStep( deltaTime ){
        const floatTime  = world.time + deltaTime
        const floatStep = floatTime / fixedTimeStep
        const intStep = Math.floor( floatStep )
        const intElapsed = intStep - world.step
        for ( let i = 0 ; i < intElapsed ; i++ ){
            //console.log('do change i',i,worldStep,intStep)
            worldFixedStep()
        }
        world.time = floatTime
        world.step = intStep
        
    }
      // setup RAF
    var oldTime = Date.now();
    
    requestAnimationFrame(animate);


        
    function animate() {
        var newTime = Date.now();
        var deltaTime = newTime - oldTime;
        oldTime = newTime;	
        if (deltaTime < 0) deltaTime = 0;
        if (deltaTime > 1000) deltaTime = 1000;

        const commands = getCommands()

        animation.commands = commands
        
        //        console.log(commands)
        
        worldStep( deltaTime / 1000 )
        var deltaFrame = deltaTime * 60 / 1000; //1.0 is for single frame
	//console.log(deltaFrame)
        // update your game there
        //sprite.rotation += 0.1 * deltaFrame;
	gameLoop(deltaFrame)
        renderer.render(stage);
        
        requestAnimationFrame(animate);
    }
    ticker.start()
    //app.start()
    animation.play('walk-left')
}
go()


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
