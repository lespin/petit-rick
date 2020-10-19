import { KeyboardState, KeyboardDownFront } from './lib/keyboardState.js'
import RBush from 'rbush';
import  * as PIXI from 'pixi.js'
import { OldFilmFilter } from '@pixi/filter-old-film'
import { RGBSplitFilter } from '@pixi/filter-rgb-split'

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
    /*stage.pivot.set(0.5,0.5)
    stage.scale.x = 1
    stage.scale.y = 2*/
    const filmFilter = new OldFilmFilter({
        noise : 0.02,
        /*noiseSize : 0.9,*/
        scratch : 0,        
        vignetting : 0.1,
        /*scratchDensity : 0.5,*/
        sepia : 0
    })
    // ZoomBlurFilter 
    const rgbSplitFilter = new RGBSplitFilter()
    function sobber(){
        rgbSplitFilter.red.x = 0
        rgbSplitFilter.red.y = 0
        rgbSplitFilter.blue.x = 0
        rgbSplitFilter.blue.y = 0
        rgbSplitFilter.green.x = 0
        rgbSplitFilter.green.y = 0
    }
    function unsobber(){
        function sint01( f , p = 0 ){
            return ( Math.sin(p + Date.now() * f ) + 1  ) / 2
        }
        function cost01( f, p = 0 ){
            return ( Math.cos(p + Date.now() * f ) + 1  ) / 2
        }
        function movePixels(){
            rgbSplitFilter.red.x = sint01(1/100)
            rgbSplitFilter.red.y =  cost01(1/100)
            rgbSplitFilter.blue.x = sint01(1/101)
            rgbSplitFilter.blue.y =  cost01(1/101)
            rgbSplitFilter.green.x = sint01(1/102)
            rgbSplitFilter.green.y =  cost01(1/102)
        }
        movePixels()
    }
    let itv = setInterval( unsobber, 10 )
    setTimeout( () => {
        clearInterval( itv )
        sobber()
    },2000)
    //green: new PIXI.Point(0,0),
    //blues : new PIXI.Point(0,0),
    
    stage.filters = [filmFilter,rgbSplitFilter];
    

    const terrain  = await loadTerrain( 'assets/map1.tmx' )
    stage.addChild(terrain.container);
    console.log('terrain',terrain)

    /*
     * Animations
     */
    
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
        // take from world ?
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
        //const [name,animatedSprite] = p,
        //frame = animatedSprite.currentFrame
    };
    /*
     * World
     */
    const fixedTimeStep = 1/48
    const world = {
        time : 0,
        step : 0,
        commands : {},
        over : false
    }
    
    function updateSurroundings(x,y,width,height){
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
                },
                middleBox : {
                    minX: x - 1,
                    maxX: x + 1,
                    minY: y - 1,
                    maxY: y + 1
                }
            }
        }
        const rtree = terrain.extracted['tree']
        
        const { rightBox, leftBox, bottomBox,
                aboveLadderBox, onLadderBox,
                middleBox } = getPlayerCollisionBoxes( x,y,width,height )

        
        const f1 = rtree.search( leftBox )          
        const leftMatter = f1.find( ({tile}) => tile.layer.name === 'matter' )
        const f2 = rtree.search( rightBox )
        const rightMatter = f2.find( ({tile}) => tile.layer.name === 'matter' )
        const f3 = rtree.search( bottomBox )
        const underMatter = f3.find( ({tile}) => tile.layer.name === 'matter' )
        const f4 = rtree.search( onLadderBox )
        const onLadder = f4.find( ({tile}) => tile.layer.name === 'ladder' )
        const f5 = rtree.search( aboveLadderBox )
        const aboveLadder = f5.find( ({tile}) => tile.layer.name === 'ladder' )
        const f6 = rtree.search( middleBox )
        const onTreasure = f6.find( ({tile}) => tile.layer.name === 'treasure' )
        const onExit = f6.find( ({tile}) => ( tile.layer.name === 'doors'  ) && ( tile.properties['level-exit'] ) )

        if ( false ){
            // show selected
            rtree.all().map( finding => {
                const { tile } = finding,
                      { container } = tile
                container.tint = 0x888888
            })
            f6.forEach( (finding,i) => {
                const { tile } = finding, { container } = tile
                if ( onExit ){
                    container.tint = 0xffffff
                }
            })
        }
        const surroundings = {
            leftMatter,
            rightMatter,
            underMatter,
            onLadder,
            aboveLadder,
            onTreasure,
            onExit
        }
        return surroundings
    }
    
    function reachTreasure(animation, onTreasure){
        console.log('BEEP','treasure')
        onTreasure.tile.container.visible = false
        const rtree = terrain.extracted['tree']
        rtree.remove( onTreasure )
    }
    function reachExit(animation, onExit){
        console.log('BEEP','reach exit')
        console.log( animation, onExit )
        //onExit.tile.container.visible = false
        const rtree = terrain.extracted['tree']
        rtree.remove( onExit )
        world.over = true
    }
    function worldFixedStep( ){
        const pl = animation.container,
              {x,y} = pl.position,
              {width,height} = pl

        
        const surroundings = updateSurroundings( x, y, width, height )
        const { onLadder, underMatter } = surroundings

        //if ( world.over ) return
        if ( surroundings.onTreasure ){
            reachTreasure( animation, surroundings.onTreasure )
        }
        if ( surroundings.onExit ){
            reachExit( animation, surroundings.onExit )
            return
        }
        
        if ( !onLadder && !underMatter ){
            animation.container.position.y += 1
        } else {
            const commands = world.commands
            if ( commands.left ){
                if ( !surroundings.leftMatter ){
                    animation.container.position.x -= 1
                } else {
                    animation.play( 'iddle-left' )
                }
            } else if ( commands.right ){
                if ( !surroundings.rightMatter ){
                    animation.container.position.x += 1
                } else {
                    animation.play( 'iddle-right' )
                }
            } else if ( commands.up ){
                if ( surroundings.onLadder ){
                    animation.container.position.y -= 1
                }   
            } else if ( commands.down ){
                if ( surroundings.aboveLadder ){
                    animation.container.position.y += 1
                }
            }
        }
    }
    
    function worldStep( deltaTime ){
        const floatTime  = world.time + deltaTime
        const floatStep = floatTime / fixedTimeStep
        const intStep = Math.floor( floatStep )
        const intElapsed = intStep - world.step
        for ( let i = 0 ; i < intElapsed ; i++ ){
            worldFixedStep()
        }
        world.time = floatTime
        world.step = intStep
        
    }
    // setup RAF
    var oldTime = Date.now();
    
    function animate() {

        // get time
        var newTime = Date.now();
        var deltaTime = newTime - oldTime;
        oldTime = newTime;	
        if (deltaTime < 0) deltaTime = 0;
        if (deltaTime > 1000) deltaTime = 1000;

        // grab commands
        const commands = getCommands()
        keyboardDownFront.reset()
        world.commands = commands

        // step world
        worldStep( deltaTime / 1000 )
        if (world.over ) {
            filmFilter.sepia = 1
        }

        // camera
        //stage.position.x = -animation.container.position.x
        //stage.position.y = -animation.container.position.y
        //stage.position.y = 2

        // render
        renderer.render(stage);

        // recurse
        requestAnimationFrame(animate);
        //stage.position.x += 1
    }
    requestAnimationFrame(animate);
    animation.play('iddle-left')
}
go()




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
    //
    // load tilemap
    //
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
