import { KeyboardState/*, KeyboardDownFront*/ } from './lib/keyboardState.js'
import RBush from 'rbush';
import  * as PIXI from 'pixi.js'
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST
//import { Viewport } from 'pixi-viewport'

import { OldFilmFilter } from '@pixi/filter-old-film'
import { RGBSplitFilter } from '@pixi/filter-rgb-split'
import { GlowFilter } from '@pixi/filter-glow';
import { zzfxCreateAndPlay } from './lib/zzfx.micro.js'

var seedrandom = require('seedrandom');

import * as Stats from 'stats.js'
var stats = new Stats();
stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
//document.body.appendChild( stats.dom );

import { PageVisibility } from './lib/domVisibility.js'
const pageVisibility = PageVisibility()
pageVisibility.on.change.push( () => {
    
    console.log('visible?',pageVisibility.isVisible(),'at',new Date())
})

var rng = seedrandom('fx-1');

const sndfx = {
    pickup : () => zzfxCreateAndPlay(...[rng,,,1178,,.04,.28,,.48,,,41,.1,,.1,,,,.93,.03,.19]),
    cleared : () => zzfxCreateAndPlay(...[rng,,,1178,,.04,.28,,.48,,,41,.1,,.1,,,,.93,.03,.19]),
    win : () => zzfxCreateAndPlay(...[rng,,,177,.48,.17,.56,1,.17,-0.7,,36,.03,.01,,,,,.58,.08]),    
}
import { Music, LiveMusicComposer } from './music.js'

const composer = LiveMusicComposer()
window.composer = composer

setTimeout( async () => {
    const music = Music( composer )
    const { ac, synth } = await music.start()
    console.log('Music',ac,synth,composer)
    
},2000)

var aStar = require('a-star');
var path = aStar({
    start : 'S',
    isEnd : n => ( n === 'E' ),
    neighbor : n => (['S','E']),
    distance : (a,b) => 1,
    heuristic : (a,b) => 1,
    hash : n => n
})
console.log(path);

function HiScores(){
    function load(){
        const ls = localStorage.getItem( 'hiscores' )
        if ( ls ){
            return JSON.parse( ls )
        } else {
            return {
                list : [
                    { name : 'Lionel J.', score : 666 },
                    { name : 'Chriac J.', score : 676 },
                ]
            }
        }
    }
    function save( hiscores ){
        localStorage.setItem( 'hiscores', JSON.stringify( hiscores ) )
    }
    function setScore( name, score ){
        const hiscores = load()
        hiscores.list = [
            ...hiscores.list,
            {name,score}
        ].sort( (a,b) => b.score - a.score )
        return hiscores
    }
    function purge(){
        localStorage.removeItem( 'hiscores' )
    }
    return { load, save, setScore, purge }
}
const hiScores = HiScores()
window.hiScores = hiScores



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




const imageResolver = x => `assets/${x}`

// setup renderer and ticker
const renderer = new PIXI.Renderer({
    width: 160,
    height: 160,
    resolution: 4 * ( window.devicePixelRatio || 1 ),
    antialias:true
})
document.body.appendChild(renderer.view)

const keyboardState = KeyboardState('key')(window)
keyboardState.start()
//const keyboardDownFront = KeyboardDownFront('key')(window)
//keyboardDownFront.start()
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
    
    // create viewport
    const viewport = new PIXI.Container({
        //interaction: app.renderer.plugins.interaction // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
        //rotation : Math.PI / 8
    })
    //viewport.fitWidth()
    // add the viewport to the stage
    //app.stage.addChild(viewport)
    
    const stage = new PIXI.Container({width:160,height:180});
    stage.position.x = 30
    stage.width = 160
    stage.height = 180
    stage.anchor = 0.5
    //    console.log(stage.width,stage.height)
    stage.pivot.x = stage.width / 2 
    stage.pivot.y = stage.height /2 
    // setInterval( () => {
    
    //  stage.rotation += Math.PI / 30
    //stage.scale.x = 0.5 + 1 * ( Math.cos( Date.now() / 1000 ) + 1 ) / 2
    //stage.scale.y = 0.5 + 1 * ( Math.cos( Date.now() / 1000 ) + 1 ) / 2
    //stage.scale = 5
    //},16)
    viewport.addChild( stage )
    
    /*stage.pivot.set(0.5,0.5)
      stage.scale.x = 1
      stage.scale.y = 2*/
    const glowFilter = new GlowFilter()

    setInterval( () => {
        const s01 = ( 1 + Math.sin( Date.now() / 500 ) ) / 2
        glowFilter.outerStrength = 1 + s01 * 1
    },100 )
    
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
    function Unsobber(){
        let level = 10
        function sint01( f , p = 0 ){
            return ( Math.sin(p + Date.now() * f ) + 1  ) / 2
        }
        function cost01( f, p = 0 ){
            return ( Math.cos(p + Date.now() * f ) + 1  ) / 2
        }
        function setLevel( _level ){
            level = _level
        }
        function update(){
            rgbSplitFilter.red.x = level * sint01(1/100)
            rgbSplitFilter.red.y =  level * cost01(1/100)
            rgbSplitFilter.blue.x = level * sint01(1/101)
            rgbSplitFilter.blue.y =  level * cost01(1/101)
            rgbSplitFilter.green.x = level * sint01(1/102)
            rgbSplitFilter.green.y =  level * cost01(1/102)
        }
        return {
            update,
            setLevel
        }
    }
    const unsobber = Unsobber()
    unsobber.setLevel(0)   
    stage.filters = [
        filmFilter,
        rgbSplitFilter,
    ];

    /*
     * Scoreboard
     */
    const fontName = await loadBitmapFont( 'assets/fonts/bitmapFonts/nokia16.xml' )    
    const { scoreboardZones, scoreboardContainer } = ScoreBoard( fontName )
    viewport.addChild( scoreboardContainer )


    /*
     * terrain
     */ 
    const terrain  = await loadTerrain( 'assets/map1.tmx' )
    stage.addChild(terrain.container);

    console.log('terrain',terrain)

    /*
     * Animations
     */
    
    const animationModels = await loadAnimations( 'assets/animations.tmx' )
    console.log('animationModels',animationModels)

    const entrances = terrain.extracted['level-entrance']
    const exits = terrain.extracted['level-exit']
    

    const items = []

    exits.forEach( exit => {
        exit.container.filters = [ glowFilter ]
    })
    entrances.forEach( entrance => {
        const entrancePosition = entrance.inLayer.position
        
        //for ( let i = 0 ; i < 4 ; i ++ ){
        
        const animation = new AnimatedItem( animationModels )
        animation.container.position.x = entrancePosition.x
        animation.container.position.y = entrancePosition.y
        //animation.play('iddle-left')
        animation.play('walk-left')
        stage.addChild(animation.container);

        
        animation.on.complete = function(...p){
            //            console.log('complete')
            const [name,animatedSprite] = p,
                  frame = animatedSprite.currentFrame
            //            console.log('complete',name,frame)
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
            //            console.log('@',Date.now(),followedBy)
            animation.play( followedBy.go )
        }
        /*
          animation.on.frameChange = function (...p) {
          }
          
          animation.on.loop = function (...p) {
          //const [name,animatedSprite] = p,
          //frame = animatedSprite.currentFrame
          }
          ;
        */
        //}
        items.push(animation)
        
    })


    
    //items.length = 1
    /*
     * World
     */
    const fixedTimeStep = 1/48
    const world = {
        time : 0,
        step : 0,
        commands : {},
        over : false,
        alcoolLevel : 0,
        nTreasureFound : 0,
        nTreasure : terrain.extracted['treasure'].length,
        initialCountdown : 48 * 60,
    }
    world.countdown = world.initialCountdown
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
    function openExitDoor(){
        world.canExit = true
    }
    function allTreasureFound(){
        console.log('BEEP','allTreasureFound') 
        sndfx.cleared()
        openExitDoor()
    }
    function reachTreasure(animation, onTreasure){
        console.log('BEEP','treasure')
        sndfx.pickup()
        onTreasure.tile.container.visible = false
        const rtree = terrain.extracted['tree']
        rtree.remove( onTreasure )
        world.alcoolLevel += 200
        world.nTreasureFound += 1

        composer.transpose( 3 )

        if ( world.nTreasureFound === world.nTreasure ){
            allTreasureFound()
        } 

        console.log(world)
    }
    function computeScore(){
        const score = world.countdown * world.nTreasureFound
        world.score = score        

        const name = 'you'
        const hs = hiScores.setScore( name, score )
        hiScores.save( hs )
        const rank = hs.list.findIndex( r => {
            return ( r.name === name ) && ( r.score === score )
        })
        world.rank = rank
        //console.log('you rank',rank)
        //console.log( hiScores.load() )
    }
    function exited(animation){
        console.log('BEEP','exited')

        world.over = world.time
        computeScore()
        
        console.log('over at',world.over)
        
        sndfx.win()
    }
    function reachExit(animation, onExit){
        console.log('BEEP','reach exit')
        
        if ( world.canExit ){
            exited(animation)
            const rtree = terrain.extracted['tree']
            rtree.remove( onExit )
        }
    }
    function worldFixedStep( ){
        world.countdown = Math.max(0, world.countdown - 1 )
        world.alcoolLevel = Math.max(0, world.alcoolLevel - 1 )
        items
            .forEach( item => {
                const animation = item
                
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
                    //return
                }
                
                if ( !onLadder && !underMatter ){
                    animation.container.position.y += 1
                } else {
                    const commands = world.commands
                    if ( commands.left ){
                        if ( !surroundings.leftMatter ){
                            animation.container.position.x -= 1
                        } else {
                            //animation.play( 'iddle-left' )
                        }
                    } else if ( commands.right ){
                        if ( !surroundings.rightMatter ){
                            animation.container.position.x += 1
                        } else {
                            //                    animation.play( 'iddle-right' )
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
            })
    }
    
    function worldStep( deltaTime ){
        const floatTime  = world.time + deltaTime
        const floatStep = floatTime / fixedTimeStep
        const intStep = Math.floor( floatStep )
        const intElapsed = intStep - world.step
        if ( intElapsed > 2 ){
            console.log('must do',intElapsed)
        }
        
        for ( let i = 0 ; i < intElapsed ; i++ ){
            worldFixedStep()
        }
        world.time = floatTime
        world.step = intStep
        
    }
    
    let oldTime = Date.now();
    function animate() {

        stats.begin();
        //console.log('1/60')
        // get time
        const newTime = Date.now();
        let deltaTime = newTime - oldTime;
        oldTime = newTime;	
        if (deltaTime < 0) deltaTime = 0;
        if (deltaTime > 1000) deltaTime = 1000;

        // grab commands
        const commands = getCommands()
        //        keyboardDownFront.reset()
        world.commands = commands
        
        // step world
        if ( ! world.over ){
            const d1 = Date.now()
            worldStep( deltaTime / 1000 )
            const d2 = Date.now()
        }
        //        console.log('steps took',d2 - d1 )
        
        world.alcoolLevel = Math.max(0,Math.min(world.alcoolLevel,500)) 
        if (world.over ) {
            filmFilter.sepia = 1
            unsobber.setLevel(0)
            filmFilter.vignetting = 0.1
        }  else {
            
            // camera
            //stage.position.x = -animation.container.position.x
            //stage.position.y = -animation.container.position.y
            //stage.position.y = 2
            //unsobber.setLevel(0)//world.alcoolLevel/1000)
            const stoneness = 5 * world.alcoolLevel / 500
            const readyness = Math.min(world.alcoolLevel,200) / 200
            
            filmFilter.vignetting =  0.125 - readyness / 8
            unsobber.setLevel(stoneness)
        }
        unsobber.update()
        if ( scoreboardZones ){
            let remain =  world.countdown
            scoreboardZones.updateCountdown( remain )
            scoreboardZones.updateTreasuresFound( world.nTreasureFound )

            if ( world.over ){
                scoreboardZones.updateLevelScore( `place : #${ world.rank + 1 } \n${ remain } * ${ world.nTreasureFound } = ${ world.score }` )
            } else {
                scoreboardZones.updateLevelScore('')
            }

            
            //            scoreboardZones.countdown.update( ''+remain.toString(10).padStart(4,' ') )
        }
        renderer.render( viewport );
        //        console.log('1/60/end')
        // recurse
	stats.end();
        if ( ! world.over ){
            requestAnimationFrame(animate);
        }
        //_omposer.setFreq( 440 * ( 1+ world.nTreasureFound ) )
        if ( world.over ){
            composer.conclusion(true)
            //composer.setTempo( 40 )
            composer.setUrgency( world.initialCountdown, world.initialCountdown )
            
        } else {
            //composer.setTempo( 60 +  world.nTreasureFound * 40 )
            composer.setUrgency( world.countdown, world.initialCountdown )
            
        }
        
        //stage.position.x += 1
    }
    requestAnimationFrame(animate);
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
        const anim = new PIXI.AnimatedSprite( steps.map( step => ({
            texture : PIXI.Texture.from( step.imageBitmap ),
            time : step.time
        })))
        anim.anchor.set(0.5);
        anim.scale.set(1);
        anim.animationSpeed =  speed 
        animationContainer.addChild(anim);
        // todo
        anim.loop = false//loop
        
        anim.onComplete = (...p) => {
            //console.log('oncomplete',name,model)
            if ( on.complete ){
                setTimeout(() => {
                    on.complete( name, anim, ...p )
                },1)
            }
        }
        // anim.onFrameChange = (...p) => on.frameChange( name, anim, ...p )
        // anim.onLoop = on.loop
        anim.visible = false
        animations[ name ] = anim
    })
    let _previousAnimation = undefined
    function play( name ){
        //console.log('play anim',name)
        if ( _previousAnimation !== undefined ){
            const anim =  animations[ _previousAnimation  ]
            anim.stop()
            anim.visible = false
        }
        const anim = animations[ name ]
        anim.visible = true
        anim.stop()
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
                imageBitmap : tile.imageBitmap,
                texture : PIXI.Texture.from( tile.imageBitmap ),
                time : 50
            })),
            loop : layer.properties['animation-loop'],
            speed :layer.properties['animation-speed']
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
    extracted.treasure = []
    extracted['level-entrance'] = []
    extracted['level-exit'] = []
    extracted.tree = new RBush();

    //
    // special tiles
    //
    terrain.layers.forEach( ( layer, layerIdx ) => {
        layer.tiles.forEach( tile => {
            if ( tile.properties['level-entrance'] ){
                extracted['level-entrance'].push( tile )
            }
            if ( tile.properties['level-exit'] ){
                extracted['level-exit'].push( tile )
            }
            if ( layer.name === 'ladder' ){
                extracted['ladders'].push( tile.inLayer.position )
            }
            if ( layer.name === 'matter' ){
                extracted['matter'].push( tile.inLayer.position )
            }
            if ( layer.name === 'treasure' ){
                extracted['treasure'].push( tile.inLayer.position )
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
function loadBitmapFont( url ){
    return new Promise( (resolve,reject) => {
        const loader = new PIXI.Loader()
        loader.add( url ).load( l  => {
            const fontName = l.resources[ url ].bitmapFont.font
            resolve(fontName)
        })
    })
}

function ScoreBoard( fontName ){
    const scoreboardContainer = new PIXI.Container()
    function scoreBoardText( x,y, options ){
        let text,
            container = new PIXI.Container()
        function clear(){
            if ( container ){
                container.removeChildren()
            }
            text = undefined
        }
        function set( _text ){
            if ( _text ){
                const pixiText = createText( _text  )
                container.addChild( pixiText )
                text = _text
            }
        }
        function update( _text ){
            if ( _text !== text ){
                clear()
                set( _text )
            }
        }
        function createText( text,  options ) {
            const textContainer = new PIXI.BitmapText(text, {
                font: `8px ${ fontName }`,
                fill : '0xffffff',
                ...options,
            })
            textContainer.position.x = x
            textContainer.position.y = y
            return textContainer;
        }
        return { update, clear, container }
    }
    const scoreboardZones = {
        countdown : scoreBoardText( 4,0, {
            align : 'center',
            width : '200px',
        }),
        treasures : scoreBoardText( 140,0 ),
        levelScore : scoreBoardText( 54,60 )
    }

    

    scoreboardContainer.addChild( scoreboardZones.countdown.container )
    scoreboardContainer.addChild( scoreboardZones.treasures.container )
    scoreboardContainer.addChild( scoreboardZones.levelScore.container )
    
    
    scoreboardZones.updateCountdown =  function(d) {
        scoreboardZones.countdown.update( ''+d.toString(10).padStart(4,' ') )
    }
    scoreboardZones.updateTreasuresFound =  function(d) {
        scoreboardZones.treasures.update( ''+d.toString(10).padStart(4,' ') )
    }
    scoreboardZones.updateLevelScore =  function(d) {
        scoreboardZones.levelScore.update( ''+d.toString(10).padStart(4,' ') )
    }
    return { scoreboardZones, scoreboardContainer }
}
