import { KeyboardState/*, KeyboardDownFront*/ } from './lib/keyboardState.js'
import { clamp } from './lib/utils.js'
import RBush from 'rbush';
import * as PIXI from 'pixi.js'
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST
import { OldFilmFilter } from '@pixi/filter-old-film'
import { RGBSplitFilter } from '@pixi/filter-rgb-split'
import { GlowFilter } from '@pixi/filter-glow';
var seedrandom = require('seedrandom');
import * as Stats from 'stats.js'
import { PageVisibility } from './lib/domVisibility.js'
import { LevelScoreVisibleCalculation } from './visibleCalculation.js'
import { Parabola } from './parabola.js'
import { zzfxCreateAndPlay, zzfxCreateBuffer } from './lib/zzfx.micro.js'
import { Sampler } from './lib/sampler.js'
import { loadSound } from './lib/loadsound.js'
import { Music, LiveMusicComposer } from './music.js'
import { getAudioContext } from './lib/audio.js'
import { SafeOutput } from './lib/safeoutput.js'
import { parseTMX, loadTerrainTileMap } from './lib/tmx-parser.js'
//import { Viewport } from 'pixi-viewport'

// resolver
const resolveResourceUrl = x => `assets/${x}`

var stats = new Stats();
stats.showPanel( 0 );
//document.body.appendChild( stats.dom );

const pageVisibility = PageVisibility()
pageVisibility.on.change.push( () => {
    console.log('visible?',pageVisibility.isVisible(),'at',new Date())
})



/*
  setInterval( () => {
  sndfx.countdownReached()
  },1000)
*/


const retribs = {
    'iddle-right' : {
        'left' : { go : 'turn-from-right' },
        'right' : { go : 'walk-right' },
        'up' : { go : 'climb-ladder' },
        'down' : { go : 'descend-ladder' },
        0 : { go : 'iddle-right' }
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
        0 : { go : 'iddle-right' },
        'right' : { go : 'walk-right' }
    },
    'walk-left' : {
        'left' : { go : 'walk-left' },
        0 : { go : 'iddle-left' }
    },
    'walk-right' : {
        'right' : { go : 'walk-right' },
        0 : { go : 'iddle-right' }
    },
}

function SetupRendererPage(){
    // setup renderer
    const renderer = new PIXI.Renderer({
        width: 160,
        height: 160,
        resolution: 4 * ( window.devicePixelRatio || 1 ),
        antialias:true
    })
    renderer.view.style = 'padding-left: 0;padding-right: 0;margin-left: auto;margin-right: auto; display: block;'
    console.log('BOBY',document.body)
    document.body.style = 'background-color: #1b1b1b;'

    window.pixirenderer = renderer
    document.body.appendChild(renderer.view)
    return renderer
}
function getCommands(keyboardState){
    const commands = {
        up : keyboardState.state.get('ArrowUp'),
        left : keyboardState.state.get('ArrowLeft'),
        down : keyboardState.state.get('ArrowDown'),
        right : keyboardState.state.get('ArrowRight')
    }
    return commands
}

function prepareSampler(loaderAc = new AudioContext()){
    const sampler = Sampler()
    const soundfiles = [
        ['swallow','assets/259640__stevious42__drinking-sip-swallow-gasp.wav'],
        ['shout','assets/218417__kokopetiyot__female-shout.wav'],
        ['ahhh','assets/264499__noah0189__crowd-ooohs-and-ahhhs-in-excitement.wav'],
        ['cheer','assets/511788__kinoton__crowd-cheering-yahoo.wav']
    ].forEach( ([name,url]) => {    
        loadSound(loaderAc,url, buffer => {
            if ( buffer )
                sampler.set( name, buffer )
        })
    })
    const zzfxData = [
        ['pickup', 'fx-1',[,,1178,,.04,.28,,.48,,,41,.1,,.1,,,,.93,.03,.19]],
        ['cleared', 'fx-1',[,,1178,,.04,.28,,.48,,,41,.1,,.1,,,,.93,.03,.19]],
        ['win', 'fx-1',[,,177,.48,.17,.56,1,.17,-0.7,,36,.03,.01,,,,,.58,.08]],
        ['countdownReached','fx-1',[2.5,,413,,,.15,,1.39,,-40,,,,.9,,.2,,.74,.04]],
        ['alldead','fx-1',[2.05,,413,,,.14,,1.39,,-2,,,,.3,,.2,,.74,.04]],
        
    ].forEach( ([name,seed,zzfxDefinition]) => {
        const rng = seedrandom( seed )
        const buffer = zzfxCreateBuffer( rng, ...zzfxDefinition )
        sampler.set( name, buffer )
    })
    return sampler
}

const renderer = SetupRendererPage()
const keyboardState = KeyboardState('key')(window)
keyboardState.start()
//const keyboardDownFront = KeyboardDownFront('key')(window)
//keyboardDownFront.start()


/*
window.composer = composer
*/

async function startSound(){

    const sampler = prepareSampler( )
    const sndfx = sampler.functions

    const composer = LiveMusicComposer()
    const music = Music( composer )

    const ac = await getAudioContext()
    const safeOutput = SafeOutput(ac)
    safeOutput.output.gain.value = 1
    safeOutput.output.connect( ac.destination )
    setGlobalVolume( 1 )
    
    const musicSynth = music.start( ac )
    musicSynth.output.connect( safeOutput.input )
    setMusicVolume( 0.25 )

    const samplerSynth = sampler.start( ac )
    samplerSynth.output.connect( safeOutput.input )
    setSndFxVolume( 1 )

    function setMusicVolume( g ){
        musicSynth.output.gain.value = g
    }
    function setSndFxVolume( g ){
        samplerSynth.output.gain.value = g
    }
    function setGlobalVolume( g ){
        safeOutput.output.gain.value = g
    }
    return { sndfx, composer }
}


var rng = seedrandom('fx-1');

async function go(){
    
    const mapName = 'map3'
    const mapFilename = `${ mapName }.tmx`
    const mapUrl = resolveResourceUrl( mapFilename  )
    const { sndfx, composer } = await startSound()
    const [
        animationModels,
        terrain
    ] = await Promise.all([
        loadAnimations( 'assets/animations.tmx' ),
        loadTerrain( mapUrl )
    ])

    
    const hiScores = HiScores( mapName )
    window.hiScores = hiScores

    /*
     * viewport
     */
    const viewport = new PIXI.Container({ })

    /*
     * filters
     */
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
            return ( Math.sin(p + Date.now() * f ) + 1 ) / 2
        }
        function cost01( f, p = 0 ){
            return ( Math.cos(p + Date.now() * f ) + 1 ) / 2
        }
        function setLevel( _level ){
            level = _level
        }
        function update(){
            rgbSplitFilter.red.x = level * sint01(1/100)
            rgbSplitFilter.red.y = level * cost01(1/100)
            rgbSplitFilter.blue.x = level * sint01(1/101)
            rgbSplitFilter.blue.y = level * cost01(1/101)
            rgbSplitFilter.green.x = level * sint01(1/102)
            rgbSplitFilter.green.y = level * cost01(1/102)
        }
        return {
            update,
            setLevel
        }
    }
    const unsobber = Unsobber()
    unsobber.setLevel(0)

    /*
     * terrain
     */
    // const mapFilename = `${ mapName }.tmx`
    // const mapUrl = resolveResourceUrl( mapFilename  )
    // const terrain = await loadTerrain( mapUrl )
    
    renderer.resize( terrain.extracted.bounds.maxX + 1,
                     terrain.extracted.bounds.maxY + 1 )

    /*
     * stage
     */
    function createStage( width, height) {
        const stage = new PIXI.Container()//{width,height})
        stage.position.x = 0//8*4
        stage.position.y = 0//8
        stage.height = height
        stage.anchor = 0.5
        stage.pivot.x = stage.width / 2
        stage.pivot.y = stage.height /2
        stage.scale.x = 1
        return stage
    }

    const stage = createStage()
    console.log('stage',stage)
    viewport.addChild( stage )   
    stage.filters = [
        filmFilter,
        rgbSplitFilter,
    ];
    stage.addChild(terrain.container);
    console.log('terrain',terrain)
    
    /*
     * Animations
     */
//    const animationModels = await loadAnimations( 'assets/animations.tmx' )
    console.log('animationModels',animationModels)

    // substitute animation
    terrain.extracted['substitute-animation'].forEach( tile => {
        const position = tile.inLayer.position
        const animation = new AnimatedItem( animationModels )
        animation.container.position.x = position.x
        animation.container.position.y = position.y
        console.log('substriute',tile,tile.properties['substitute-animation'] )
        animation.play( tile.properties['substitute-animation'] )
        stage.addChild(animation.container);
    })
    
    const entrances = terrain.extracted['level-entrance']
    const exits = terrain.extracted['level-exit']
    const items = []
    exits.forEach( exit => {
        exit.container.filters = [ glowFilter ]
    })
    entrances.forEach( entrance => {
        //
        // create a player animation on each entrance
        //
        const entrancePosition = entrance.inLayer.position
        const animation = new AnimatedItem( animationModels )
        animation.container.position.x = entrancePosition.x
        animation.container.position.y = entrancePosition.y
        animation.play('walk-left')
        stage.addChild(animation.container);
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
        items.push(animation)
    })
    
    /*
     * Scoreboard
     */
    const fontName = await loadBitmapFont( 'assets/fonts/bitmapFonts/nokia16.xml' )
    const { scoreboardZones, scoreboardContainer } = ScoreBoard( fontName, renderer.screen)
    viewport.addChild( scoreboardContainer )

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
        initialNPlayers : terrain.extracted['level-entrance'].length,
        initialCountdown : terrain.extracted['initial-countdown'],
    }
    world.countdown = world.initialCountdown
    world.nPlayers = world.initialNPlayers

    const levelScoreVisibleCalulation =  LevelScoreVisibleCalculation( world )

    
    function getSurroundings(x,y,width,height){
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
        function treeCellIsMatter( { tile } ){
            return tile && tile.layer.name === 'matter'
        }
        function treeCellIsLadder( { tile } ){
            return tile && tile.layer.name === 'ladder'
        }
        function treeCellIsTreasure( { tile } ){
            return tile && tile.layer.name === 'treasure' 
        }
        function treeCellIsExitDoor( { tile } ){
            return  tile && ( tile.layer.name === 'doors' ) && ( tile.properties['level-exit'] )
        }
        function treeCellIsMine( { tile } ){
            return  tile && ( tile.layer.name === 'mine' ) || ( tile.properties['mine'] )
        }
        const boxes = getPlayerCollisionBoxes( x,y,width,height ),
              f1 = rtree.search( boxes.leftBox ),
              f2 = rtree.search( boxes.rightBox ),
              f3 = rtree.search( boxes.bottomBox ),
              f4 = rtree.search( boxes.onLadderBox ),
              f5 = rtree.search( boxes.aboveLadderBox ),
              f6 = rtree.search( boxes.middleBox )
        
        return {
            leftMatter : f1.find( treeCellIsMatter ),
            rightMatter : f2.find( treeCellIsMatter ),
            underMatter : f3.find( treeCellIsMatter ),
            onLadder : f4.find( treeCellIsLadder ),
            aboveLadder : f5.find( treeCellIsLadder ),
            onTreasure : f6.find( treeCellIsTreasure ),
            onExit : f6.find( treeCellIsExitDoor ),
            onMine : f6.find( treeCellIsMine )
        }
        // if ( false ){
        //     // show selected
        //     rtree.all().map( finding => {
        //         const { tile } = finding,
        //               { container } = tile
        //         container.tint = 0x888888
        //     })
        //     f6.forEach( (finding,i) => {
        //         const { tile } = finding, { container } = tile
        //         if ( onExit ){
        //             container.tint = 0xffffff
        //         }
        //     })
        // }
        // const surroundings = {
        //     leftMatter,
        //     rightMatter,
        //     underMatter,
        //     onLadder,
        //     aboveLadder,
        //     onTreasure,
        //     onExit
        // }
        // return surroundings
    }
    function openExitDoor(){
        world.canExit = true
    }
    function allTreasureFound(){
        console.log('BEEP','allTreasureFound')
        sndfx.cleared()
        sndfx.ahhh()
        openExitDoor()
    }
    function reachTreasure(animation, onTreasure){
        console.log('BEEP','treasure')
        sndfx.pickup()
        sndfx.swallow()
        onTreasure.tile.container.visible = false
        const rtree = terrain.extracted['tree']
        rtree.remove( onTreasure )
        world.alcoolLevel += 100
        world.nTreasureFound += 1
        composer.transpose( 3 )
        if ( world.nTreasureFound === world.nTreasure ){
            allTreasureFound()
        }
        console.log(world)
    }
    function computeScore(){
        // TODO
        const score = world.countdown * ( world.nTreasureFound *  2 * world.nPlayers )
        world.score = score
        const name = 'you'
        const hs = hiScores.setScore( name, score )
        const rank = hs.list.findIndex( r => {
            return ( r.name === name ) && ( r.score === score )
        })
        world.rank = rank
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
            sndfx.cheer()
            exited(animation)
            const rtree = terrain.extracted['tree']
            rtree.remove( onExit )
        }
    }
    function allPlayerKilled( ){
        console.log('BEEP','all players killed')

        world.over = world.time
        computeScore()
        sndfx.alldead()
    }
    function killPlayer( animation ){
        animation.dead = true
        sndfx.shout()

        const km_h = v => v/3600*1000
        const position = animation.container.position
        const side = (rng() > 0.5)?1:-1
        const parabola = Parabola( position.x, position.y,
                                   side*km_h(3),km_h(-15),
                                   30 )
        animation.parabola = parabola
        world.nPlayers--
        console.log('BEEP','player killed',world.nPlayers)
        if ( world.nPlayers < 1 ){
            allPlayerKilled()
        }        
    }
    function countdownReached( ){
        world.over = world.time
        // TODO
        sndfx.countdownReached()
        computeScore()
    }
    function worldFixedStep( ){
        world.countdown = Math.max(0, world.countdown - 1 )
        if ( world.countdown === 0 ){
            countdownReached()
        }
        world.alcoolLevel = Math.max(0, world.alcoolLevel - 1 )
        items.forEach( item => {           
            const animation = item
            if ( animation.dead ) {
                const parabola = animation.parabola,
                      position = animation.container.position
                parabola.step( fixedTimeStep )
                position.x = parabola.position.x
                position.y = parabola.position.y
                return
            }
            // if ( world.over ) return
            const pl = animation.container,
                  {x,y} = pl.position,
                  {width,height} = pl
            const surroundings = getSurroundings( x, y, width, height )
            if ( surroundings.onMine ){
                console.log(surroundings.onMine)
                killPlayer( animation )
            }
            const { onLadder, underMatter } = surroundings
            if ( surroundings.onTreasure ){
                reachTreasure( animation, surroundings.onTreasure )
            }
            if ( surroundings.onExit ){
                reachExit( animation, surroundings.onExit )
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
                        // animation.play( 'iddle-right' )
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
        // do multiple world fixed step (todo : interpolation ?)
        const floatTime = world.time + deltaTime
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

    /*
     * animate
     */ 
    let oldTime = Date.now();
    pageVisibility.on.change.push( () => {
        // time is not counted when page is not visible and RAF not called
        oldTime = Date.now();
    })
    window.world = world
    let preWait = 2,
        started = false
    function animate() {
        stats.begin();
        //console.log('1/60')
        // get time
        const newTime = Date.now();
        let deltaTime = newTime - oldTime;
        oldTime = newTime;	
        if (deltaTime < 0) deltaTime = 0;
        if (deltaTime > 1000) deltaTime = 1000;
        preWait -= deltaTime/1000
        
        // grab commands
        const commands = getCommands(keyboardState)
        // keyboardDownFront.reset()
        world.commands = commands

        // pre-start 
        if ( preWait < 0 ){
            if ( ! started && ( commands.up || commands.left || commands.down || commands.right ) ){
                sndfx.swallow()
                started = true
            }
            if ( started ) {
                scoreboardZones.updateReady( "" )
            } else {
                scoreboardZones.updateReady( [
                    terrain.extracted['display-name'],
                    "press any key\nwhen ready"
                ].join("\n\n"))
            }
        } else {
            scoreboardZones.updateReady( terrain.extracted['display-name'] )
        }

        // step world
        if ( started && ( ! world.over )){
            worldStep( deltaTime / 1000 )
        }
        
        // setup rendering fx and sounds
        const maxAlcool = 200
        world.alcoolLevel = Math.max(0,Math.min(world.alcoolLevel,maxAlcool))
        if (world.over ) {
            filmFilter.sepia = 1
            unsobber.setLevel(0)
            filmFilter.vignetting = 0.1
        } else {
            const stoneness = 3 * world.alcoolLevel / maxAlcool
            const readyness = Math.min(world.alcoolLevel,200) / 200
            filmFilter.vignetting = 0.125 - readyness / 8
            unsobber.setLevel(stoneness)
        }
        unsobber.update()
        if ( scoreboardZones ){
            // todo : ?
            if ( world.over ){
                let remain = world.countdown
                //if ( !world.over ){
                //const remain = world.countdown
                scoreboardZones.updateCountdown( remain )
                scoreboardZones.updateTreasuresFound( world.nTreasureFound )
            } else {
                let remain = world.countdown
                //if ( !world.over ){
                //const remain = world.countdown
                scoreboardZones.updateCountdown( remain )
                scoreboardZones.updateTreasuresFound( world.nTreasureFound )
            }
            //}
            if ( world.over ){
                //
                // visible score computation 
                //
                let txt = ''
                if ( world.overtime === undefined ){
                    world.overtime = Date.now()
                } else {
                    const sinceover = ( Date.now() - world.overtime ) / 1000
                    const duration = 1.3
                    const a = sinceover / duration
                    const car = clamp( sinceover, 0, duration ) / duration
                    const txt = levelScoreVisibleCalulation.at( car ) 
                    if ( a <= 1 ){
                        scoreboardZones.updateLevelScore( 
                            txt
                        )
                    } else {
                        scoreboardZones.updateLevelScore( [
                            txt,
                            '\nrank',  '#'+world.rank + 1,
                            //'score', ''+world.score,
                        ].join("\n"))
                    }
                }
            } else {
                scoreboardZones.updateLevelScore('')
            }
        }
        renderer.render( viewport );
	stats.end();
        //if ( ! world.over ){
        //}
        //_omposer.setFreq( 440 * ( 1+ world.nTreasureFound ) )
        if ( world.over ){
            composer.conclusion(true)
            //composer.setTempo( 40 )
            composer.setUrgency( world.initialCountdown, world.initialCountdown )
        } else {
            //composer.setTempo( 60 + world.nTreasureFound * 40 )
            composer.setUrgency( world.countdown, world.initialCountdown )
        }
        
        // recurse
        requestAnimationFrame(animate);
    }
    //   onInteraction( () => {
    //        startSound()
    requestAnimationFrame(animate)
    // })
    //requestAnimationFrame(animate);
}
function onInteraction( f ){
    function once(e){
        console.log('OK?',e)
        window.removeEventListener( 'keydown', once )
        window.removeEventListener( 'click', once )
        f()
    }
    window.addEventListener( 'keydown', once )
    window.addEventListener( 'click', once )
}
go()
//onInteraction( go )
//go()
// //import 'p2/build/p2.min.js'
// import p2 from 'p2'
// import * as PIXI from 'pixi.js'
// // import * as Audio from './lib/audio.js'
// // Audio.getAudioContext().then( ac => {
// // console.log('running!',ac)
// // })
// //console.log('PIXI',PIXI)
// /*var container, graphics, zoom,
// world, boxShape, boxBody, planeBody, planeShape;*/
// /*
// import { BlurFilter } from '@pixi/filter-blur';
// import { Container } from '@pixi/display';
// import { Graphics } from '@pixi/graphics';
// import { Sprite } from '@pixi/sprite';
// */
// import { GlowFilter } from '@pixi/filter-glow';
// import { AsciiFilter } from '@pixi/filter-ascii';
// import { CRTFilter } from '@pixi/filter-crt'
// import { DotFilter } from '@pixi/filter-dot'
// init();
// //animate();
// import PixiFps from "pixi-fps";
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
        anim.animationSpeed = speed
        animationContainer.addChild(anim);
        // todo
        anim.loop = loop
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
            const anim = animations[ _previousAnimation ]
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
    const terrain = await loadTerrainTileMap(url ,resolveResourceUrl)
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
    const terrain = await loadTerrainTileMap(url ,resolveResourceUrl)
    const extracted = {
    }
    extracted.ladders = []
    extracted.matter = []
    extracted.treasure = []
    extracted['level-entrance'] = []
    extracted['level-exit'] = []
    extracted['substitute-animation'] = []
    extracted['display-name'] = terrain.properties['display-name'] || 'unnamed map'
    extracted['initial-countdown'] = 48 * ( terrain.properties['initial-countdown'] || 60 )
    extracted.tree = new RBush();
    extracted.bounds = {
        minX : Number.POSITIVE_INFINITY,
        maxX : Number.NEGATIVE_INFINITY,
        minY : Number.POSITIVE_INFINITY,
        maxY : Number.NEGATIVE_INFINITY
    }
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
            if ( tile.properties['substitute-animation'] ){
                extracted['substitute-animation'].push( tile )
            }
            const item = {
                minX: tile.inLayer.position.x - tile.tileset.tilewidth / 2,
                maxX: tile.inLayer.position.x + tile.tileset.tilewidth / 2 - 1,
                minY: tile.inLayer.position.y - tile.tileset.tileheight / 2,
                maxY: tile.inLayer.position.y + tile.tileset.tileheight / 2 - 1,
                tile
            };
            const { bounds } = extracted
            bounds.minX = Math.min( bounds.minX, item.minX )
            bounds.maxX = Math.max( bounds.maxX, item.maxX )
            bounds.minY = Math.min( bounds.minY, item.minY )
            bounds.maxY = Math.max( bounds.maxY, item.maxY )
            
            extracted['tree'].insert(item);
        })
    })
    //
    // visual tiles, build graphics
    //
    const container = new PIXI.Container();
    terrain.layers.forEach( ( layer, layerIdx ) => {
        layer.tiles.forEach( tile => {
            if ( tile.properties['substitute-animation'] )
                return
            const position = tile.inLayer.position,
                  imageBitmap = tile.imageBitmap
            // const collisionMaskNames = tile.properties['collision-mask']
            const sprite = PIXI.Sprite.from( imageBitmap )
            sprite.anchor.set(0.5)
            sprite.position.x = position.x
            sprite.position.y = position.y
            container.addChild( sprite )
            //
            tile.container = sprite
        })
    })
    return { extracted, container, tilemap : terrain }
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
        loader.add( url ).load( l => {
            const fontName = l.resources[ url ].bitmapFont.font
            resolve(fontName)
        })
    })
}
function ScoreBoard( fontName, rectangle ){
    const scoreboardContainer = new PIXI.Container()
    function scoreBoardText( x,y, anchorx,anchory, options ){
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
                const pixiText = createText( _text )
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
        function createText( text ) {
            const textContainer = new PIXI.BitmapText(text, {
                font: `8px ${ fontName }`,
                fill : '0xffffff',
                ...options,
            })
            textContainer.position.x = x
            textContainer.position.y = y
            textContainer.anchor.set(anchorx,anchory)
            return textContainer;
        }
        return { update, clear, container }
    }

    const scoreboardZones = {
        countdown : scoreBoardText( 1, 0, 0,0 ),
        treasures : scoreBoardText( rectangle.width, 0, 1,0, {align : 'right'} ),
        levelScore : scoreBoardText( rectangle.width/2, rectangle.height/2 , 0.5,0.5,{ width : 60, align : 'center' }),
        ready : scoreBoardText( rectangle.width/2, rectangle.height/2 , 0.5,0.5,{ width : 60, align : 'center' })
    }

    scoreboardContainer.addChild( scoreboardZones.countdown.container )
    scoreboardContainer.addChild( scoreboardZones.treasures.container )
    scoreboardContainer.addChild( scoreboardZones.levelScore.container )
    scoreboardContainer.addChild( scoreboardZones.ready.container )
    
    scoreboardZones.updateCountdown = function(d) {
        scoreboardZones.countdown.update( d.toString(10).padStart(4,'0') )
    }
    scoreboardZones.updateTreasuresFound = function(d) {
        scoreboardZones.treasures.update( d.toString(10).padStart(3,'0') )
    }
    scoreboardZones.updateLevelScore = function(d) {
        scoreboardZones.levelScore.update( d )
    }
    scoreboardZones.updateReady = function( d ) {
        scoreboardZones.ready.update( d )
    }
    
    return { scoreboardZones, scoreboardContainer }
}

/*
 * persistence ( hiscores )
 */

// function JSONStorageItem( key, defaultValue ){
//     const si = StorageItem( key, defaultValue ),
//           get = () => JSON.parse( si.get() ),
//           set = v => si.set( JSON.stringify( v ) )   
//     function edit( f ){
//         set( f( get() ) )
//     }
//     return { edit }
// }
function StorageItem( name, defaultValue ){
    return {
        get : () => localStorage.getItem( name ) || defaultValue ,
        set : v =>  localStorage.setItem( name, v ),
        remove : () => localStorage.removeItem( name )
    }
}
function HiScores( level ){
    const defaultValue = {
        list : [
            { name : 'Lionel J.', score : 666 },
            { name : 'Chriac J.', score : 676 },
        ]
    }
    const { get, set, remove } = StorageItem( level )
    function load(){
        const ls = get()
        if ( ls ){
            return JSON.parse( ls )
        } else {
            return defaultValue
        }
    }
    function setScore( name, score ){
        const hiscores = load()
        hiscores.list.push( { name, score } )
        hiscores.list.sort( (a,b) => b.score - a.score )
        set( JSON.stringify( hiscores ) )
        return hiscores
    }
    return { load, setScore, remove }
}

// var aStar = require('a-star');
// var path = aStar({
//     start : 'S',
//     isEnd : n => ( n === 'E' ),
//     neighbor : n => (['S','E']),
//     distance : (a,b) => 1,
//     heuristic : (a,b) => 1,
//     hash : n => n
// })
// console.log(path);

//
// todo? : use map name for hiscores ?
// todo : continue playing after timeout
// todo : map time in tilemap
//
