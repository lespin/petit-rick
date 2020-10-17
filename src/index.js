
import { KeyboardState, KeyboardDownFront } from './lib/keyboardState.js'
const keyboardState = KeyboardState('key')(window)
keyboardState.start()
const keyboardDownFront = KeyboardDownFront('key')(window)
keyboardDownFront.start()

//import { Ticker } from '@pixi/ticker'


//import { TickerPlugin } from '@pixi/ticker';
//import { Application } from '@pixi/app';
//Application.registerPlugin(TickerPlugin);
//import { Container } from '@pixi/display';
//import { Sprite } from '@pixi/sprite';
import  * as PIXI from 'pixi.js'
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST

const app = new PIXI.Application({
    width: 160,
    height: 180,
    resolution: 4 * ( window.devicePixelRatio || 1 ),
    antialias:true
});
//app.stop()




// app.loader
//     .add('spritesheet', 'assets/hero-walk-anim.json')
//     .load(onAssetsLoaded);

// function onAssetsLoaded(loader, resources) {
//     const error = resources.spritesheet.error
//     if (error){
//         throw new Error(error)
//     }
//     console.log('LOADED','sptch',resources.spritesheet)
//     const animationTextures = resources.spritesheet.textures

//     const textures = []
//     textures.push({ texture : animationTextures['frame00'], time : 100 })
//     textures.push({ texture : animationTextures['frame01'], time : 100 })
//     const slow = new PIXI.AnimatedSprite(textures);
//     slow.anchor.set(0.5);
//     slow.scale.set(1);
//     slow.animationSpeed = 0.5;
//     slow.x = (app.screen.width - slow.width) / 2;
//     slow.y = app.screen.height / 2;
//     app.stage.addChild(slow);
//     slow.play()   
//     console.log('slow',slow)
//     app.start()
// }
document.body.appendChild(app.view);

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


const stage = app.stage
//console.log('stage',stage)





async function go(){
    
    const terrain  = await loadTerrain( 'assets/map1.tmx' )
    app.stage.addChild(terrain.container);
    console.log('terrain',terrain)


    const animationModels = await loadAnimations( 'assets/animations.tmx' )
    console.log('animmmm',animationModels)
    
    const { container : animationContainer, playAnimation } = AnimatedItem( animationModels )

    //const heroContainer = new PIXI.Container();
    //app.stage.addChild(heroContainer);

    animationContainer.position.x = terrain.extracted['level-entrance'].x
    animationContainer.position.y = terrain.extracted['level-entrance'].y

    //animationContainer.anchor.set(0.5)
    
    app.stage.addChild(animationContainer);
    

    setTimeout( () => {
        playAnimation('turn-from-left')
    },0)
    setTimeout( () => {
        playAnimation('turn-from-right')
    },2000)
    setTimeout( () => {
        playAnimation('walk-left')
    },4000)
    setTimeout( () => {
        playAnimation('climb-ladder')
    },6000)
    setTimeout( () => {
        playAnimation('turn-from-left')
    },8000)

    app.ticker.add(delta => gameLoop(delta));

}
go()


function updateKeyboard(){
    keyboardDownFront.reset()
}
function updateControls(){
    const commands = {
        up : keyboardState.state.get('ArrowUp'),
        left : keyboardState.state.get('ArrowLeft'),
        down : keyboardState.state.get('ArrowDown'),
        right : keyboardState.state.get('ArrowRight')
    }
    updateKeyboard()
    return commands
}
const state = playing

function gameLoop(delta){
    //Update the current game state:
    state(delta);
}

const Items = []


function playing(dt){
    //console.log('dt',dt)
    const commands = updateControls()
    
    
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
    const animationContainer = new PIXI.Container();

    
    const animations = {}
    Object.entries( animationModels ).forEach( ([name,model]) => {
        const { steps, loop, speed } = model
        
        const anim = new PIXI.AnimatedSprite(steps);
        anim.anchor.set(0.5);
        anim.scale.set(1);
        anim.animationSpeed = speed
        //anim.x = /*layerIdx * 8 +*/ 4
        //anim.y = 8 - 4
        animationContainer.addChild(anim);
        anim.loop = loop
        anim.onComplete = function () {
            //console.log('// complete',anim.currentFrame)
        }
        anim.onFrameChange = function () {
            //console.log('// update!',anim.currentFrame)
        };
        //console.log('anim',anim)
        anim.onLoop = function () {
            //console.log('// looped!',anim.currentFrame)
        };
        anim.visible = false
        animations[ name ] = anim
    })
    
    
    let _previousAnimation = undefined
    function playAnimation( name ){
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
    return { container : animationContainer, playAnimation }
    
}
async function loadAnimations( url ){//, container,  world, addGraphicBody){
    
    const terrain = await loadTerrainTileMap(url ,imageResolver)


    const animationModels = {}
    terrain.layers.forEach( ( layer, layerIdx ) => {
        animationModels[ layer.name ] = {
            steps : layer.tiles.map( tile => ({
                texture : PIXI.Texture.from( tile.imageBitmap ),
                time : 100
            })),
            loop : layer.properties['animation-loop'],
            speed : layer.properties['animation-speed']
        }
    })
    return animationModels
    
    //return animations
    //console.log('animations',animations)
}
async function loadTerrain( url ){
    

    const terrain = await loadTerrainTileMap(url ,imageResolver)

    const extracted = {}
    
    terrain.layers.forEach( ( layer, layerIdx ) => {
        layer.tiles.forEach( tile => {
            if ( tile.properties['level-entrance'] ){
                extracted['level-entrance'] = tile.inLayer.position
            }
            if ( tile.properties['level-exit'] ){
                extracted['level-exit'] = tile.inLayer.position
            }
        })
    })
    // console.log('terrain terrain',terrain)
    // const collisionGroupNames = []
    // terrain.layers.forEach( ( layer, layerIdx ) => {
    //     if ( layer.name === 'archi' ) {
    //         layer.tiles.forEach( tile => {
    //             const cgn = tile.properties['collision-group']
    //             if ( cgn ){
    //                 if (!collisionGroupNames.includes( cgn )){
    //                     collisionGroupNames.push( cgn )
    //                 }
    //             }
    //         })
    //     }
    // })
    // console.log('collisionGroupNames',collisionGroupNames)
    // function groupForGroupName( name ){
    //     const idx = collisionGroupNames.indexOf( name )
    //     return ( 1 << idx )        
    // }
    // function maskForGroupNames( names ){
    //     return names.map( groupForGroupName ).reduce( (r,x) => r + x, 0 )
    // }
    
    // let player = undefined,
    //     ennemies = []
    const container = new PIXI.Container();
    terrain.layers.forEach( ( layer, layerIdx ) => {
        //if ( layer.name === 'archi' ) {
        //        if ( layer.name !== 'modèle' ){
        layer.tiles.forEach( tile => {
            
            // const mass = tile.properties.mass || 0
            // const role = tile.properties.role
            // const collisionGroupName = tile.properties['collision-group'] || 0 
            // const collisionGroup = groupForGroupName( collisionGroupName )
            const position = tile.inLayer.position,
                  imageBitmap = tile.imageBitmap
            const collisionMaskNames = tile.properties['collision-mask']
            // let collisionMask = 0xffff
            // if ( collisionMaskNames ){
            //     collisionMask = maskForGroupNames( collisionMaskNames.split(',') )
            // }
            // const sensor = tile.properties['is-sensor']
            // groupForGroupName(  tile.properties['collision-group'] )
            // image
            const sprite = PIXI.Sprite.from( imageBitmap )
            sprite.anchor.set(0.5)
            sprite.position.x = position.x
            sprite.position.y = position.y
            container.addChild( sprite )
            //console.log('collisionGroup',collisionGroup,mass,role)
            // physics

            // const boxShape = new p2.Box({ width: 8/8, height: 8/8 });
            // boxShape.collisionGroup = collisionGroup
            // //boxShape.collisionMask = 1 | 2 | 4
            // //boxShape.collisionMask = 0
            // boxShape.collisionMask = collisionMask
            
            // const boxBody = new p2.Body({
            //     mass : mass,
            //     position:[ position.x/8, position.y/8 ],
            //     angle : 0,
            //     fixedRotation : ( role === 'player' )
            //     //angularVelocity:Math.PI
            // });
            // boxBody.addShape(boxShape);
            // boxBody.tile = tile
            
            // boxShape.sensor = sensor
            
            // world.addBody(boxBody);
            // addGraphicBody( sprite, boxBody )
            
            // if ( role === 'player' ){
            //     player = {
            //         body : boxBody,
            //         sprite,
            //     }
            //     boxShape.collisionMask = 0xff
            //     boxBody.isPlayer = true
            // } else if ( role === 'ennemy' ){
            //     ennemies.push({
            //         body : boxBody,
            //         sprite,
            //     })
            //     boxBody.isEnnemy = true
            // }

            // if ( tile.type === 'ladder' ){
            //     boxBody.isLadder = true
            // }
            // if ( tile.type === 'wall' ){
            //     boxBody.isWall = true
            // }


        })
        //  }
    })
    return { extracted, container }
    //    return { player, ennemies }
}

// async function init(){

//     const world = new p2.World({
//         gravity:[0, 9.82]
//     });

//     const graphicsBodies = []
//     function addGraphicBody( graphics, body){
//         graphicsBodies.push( [ graphics, body ] )
//     }
//     function updateGraphicBodies(){
//         graphicsBodies.forEach( ([graphics, body]) => {
//             graphics.position.x = body.interpolatedPosition[0] * 8;
//             graphics.position.y = body.interpolatedPosition[1] * 8 ;
//             graphics.rotation =   body.interpolatedAngle;            
//         })
//     }


//     world.on('addBody', ({body}) => {
//         //console.log('body added')
//         //createAndLinkPixiGraphics( body )
//     })

//     const terrainContainer = new PIXI.Container()
//     terrainContainer.scale.x = 2
//     terrainContainer.scale.y = 2
//     const terrain = await loadTerrain( terrainContainer, world, addGraphicBody )


//     const fpsCounter = new PixiFps();

//     const app = new PIXI.Application();
//     document.body.appendChild(app.view);
//     // Pixi.js zoom level
//     const zoom = 50;

//     // Initialize the stage
//     const renderer =  app.renderer

//     const outlineFilterRed = new GlowFilter(15, 2, 1, 0xff9999, 0.5);
//     const asciiFilter = new AsciiFilter()
//     const oldFilmFilter = new OldFilmFilter()
//     const dotFilter = new DotFilter()

//     console.log('outlineFilterRed',outlineFilterRed)
//     //stage = new PIXI.Stage(0xFFFFFF);
//     const stage = app.stage
//     // We use a container inside the stage for all our content
//     // This enables us to zoom and translate the content
//     const container =     new PIXI.Container()
//     stage.addChild(terrainContainer);
//     stage.addChild(container);
//     stage.addChild(fpsCounter)
//     // Add the canvas to the DOM
//     document.body.appendChild(renderer.view);

//     // Add transform to the container
//     container.position.x =  renderer.width/2; // center at origin
//     container.position.y =  renderer.height/2;
//     container.scale.x =  zoom;  // zoom in
//     container.scale.y = -zoom; // Note: we flip the y axis to make "up" the physics "up"
//     /*
//     terrainContainer.position.x =  renderer.width/2; // center at origin
//     terrainContainer.position.y =  renderer.height/2;
//     terrainContainer.scale.x =  1//zoom;  // zoom in
//     terrainContainer.scale.y = -1//zoom; // Note: we flip the y axis to make "up" the physics "up"
//     */
//     container.filters = [
//         outlineFilterRed,
//         //asciiFilter
//         //oldFilmFilter
//         //dotFilter
//     ]



//     let playerOnStairs = 0
//     let playerOnSomething = new Set()
//     world.on('beginContact', args => { 
//         const { bodyA, bodyB, shapeA, shapeB, target } = args
//         const ce = args.contactEquations

//         //if ( ( bodyA.tileType === 'ladder' ) || ( bodyB.tileType === 'ladder' ) ){
//         if ( bodyA.isLadder && bodyB.isPlayer ){
//             //console.log('Collision registered 1',bodyB);
//             playerOnStairs++
//         } else if ( bodyB.isLadder  && bodyA.isPlayer ){
//             //console.log('Collision registered 2',bodyA);
//             playerOnStairs++
//         }

//         if ( bodyA.isWall && bodyB.isPlayer ){
//             //console.log('Collision registered 1',bodyB);
//             playerOnSomething.add( bodyA.id )
//             //ayerOnSomething++
//         } else if ( bodyB.isWall && bodyA.isPlayer ){
//             //console.log('Collision registered 2',bodyA);
//             playerOnSomething.add( bodyB.id )
// //            playerOnSomething++
//         }


//         //}
//         ///     canJump = true
//     })
//     world.on('endContact', function (args) {
//         //console.log('UnCollision registered...');

//         const { bodyA, bodyB, shapeA, shapeB, target } = args
//         const ce = args.contactEquations

//         //if ( ( bodyA.tileType === 'ladder' ) || ( bodyB.tileType === 'ladder' ) ){
//         if ( bodyA.isLadder && bodyB.isPlayer ){
//             //console.log('Collision registered 1',bodyB);
//             playerOnStairs--
//         } else if ( bodyB.isLadder  && bodyA.isPlayer ){
//             //console.log('Collision registered 2',bodyA);
//             playerOnStairs--
//         }

//         if ( bodyA.isWall && bodyB.isPlayer ){
//             //console.log('Collision registered 1',bodyB);
//             playerOnSomething.delete( bodyA.id )
//         } else if ( bodyB.isWall && bodyA.isPlayer ){
//             //console.log('Collision registered 2',bodyA);
//             playerOnSomething.delete( bodyB.id )
//         }

//     });
//     world.on('postStep', function(event){
//         const upFront = keyboardDownFront.state.get('ArrowUp')
//         const downFront = keyboardDownFront.state.get('ArrowDown')

//         const upState = keyboardState.state.get('ArrowUp')
//         const leftState = keyboardState.state.get('ArrowLeft')
//         const rightState = keyboardState.state.get('ArrowRight')
//         const playerBody = terrain.player.body


//         if ( playerOnSomething.size ){

//         if ( upState ){
//             if ( playerBody.velocity[0] > -1 ){
//                 playerBody.force[1] -= 100
//             } else {
//                 console.log('full up stpeed')
//             }
//         }
//         /*}
//         */
//         if ( leftState ){
//             if ( playerBody.velocity[0] > -5 ){
//                 playerBody.force[0] -= 20
//             }else {
//                 console.log('full left stpeed')
//             }
//         }
//         if ( rightState ){
//             if ( playerBody.velocity[0] < 5 ){
//                 playerBody.force[0] += 20
//             }else {
//                 console.log('full right stpeed')
//             }
//         }
//         }
//         //if ( canJump ){


//         // if ( playerOnSomething.size ){
//         //     console.log( playerBody.velocity )
//         //     if ( playerOnStairs ){
//         //         //playerBody.force[1] -= 40
//         //     }
//         //     if ( upState ){//
//         //         if ( playerOnStairs ){
//         //             playerBody.force[1] -= 500
//         //         } else {
//         //             playerBody.force[1] -= 300
//         //         }
//         //     } else if ( downFront ){
//         //         playerBody.force[1] += 200
//         //     } else {
//         //     }
//         //     if ( leftState ){
//         //         playerBody.force[0] -= 20
//         //     } else if ( rightState ){
//         //         playerBody.force[0] += 20
//         //     }
//         // } else {
//         //        if ( leftState ){
//         //         playerBody.force[0] -= 10
//         //     } else if ( rightState ){
//         //         playerBody.force[0] += 10
//         //     }
//         // }
//     });

//     //Add a plane
//     const planeShape = new p2.Plane();
//     const planeBody = new p2.Body({
//         position:[0,8*22],
//         angle : Math.PI
//     });
//     planeBody.addShape(planeShape);
//     world.addBody(planeBody);



//     var fixedTimeStep = 1 / 60; // seconds
//     var maxSubSteps = 10; // Max sub steps to catch up with the wall clock
//     var lastTime;
//     app.ticker.add(dt => {
//         const time = Date.now()
//         var deltaTime = lastTime ? (time - lastTime) / 1000 : 0;
//         const upFront = keyboardDownFront.state.get('ArrowUp')
//         updateGraphicBodies()

//             //console.log(upFront)
//         world.step(fixedTimeStep, deltaTime, maxSubSteps);
//         lastTime = time
//         keyboardDownFront.reset()
//     })   
// }
