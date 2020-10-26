//import { getAudioContext } from './lib/audio.js'
//import { SafeOutput } from './lib/safeoutput.js'
import { ktof } from './lib/frequencies.js'
var seedrandom = require('seedrandom');
var rng = seedrandom('muz-1')
//const notes = [0,4,7,11,12].map( x => x + 48 )
function lerp(a,b,p){
    return ( 1 - p ) * a + p * b
}
function clamp(v,min,max){
    return Math.max( min, Math.min( v, max ) )
}
function SinusMonoSynth(ac){
    
    const osc = ac.createOscillator(),
          gain = ac.createGain()
    
    osc.frequency.value = 220
    gain.gain.value = 0
    osc.connect( gain )
    osc.start()
    let lastNoteOn
    function noteOn( { time, frequency, velocity, attack } ){
        //console.log('ON',frequency,time, lastNoteOn, time - lastNoteOn )
        lastNoteOn = time
        //osc.frequency.linearRampToValueAtTime( frequency, time )
        osc.frequency.setValueAtTime( frequency, time )
  //      gain.gain.cancelScheduledValues( time )
//        gain.gain.setValueAtTime( 0, time )
        gain.gain.linearRampToValueAtTime( 0, time )
        gain.gain.linearRampToValueAtTime( velocity, time + attack )
    }
    function noteOff( { time, frequency, velocity, release } ){
        osc.frequency.linearRampToValueAtTime( frequency, time )
        gain.gain.linearRampToValueAtTime( velocity, time)
        gain.gain.linearRampToValueAtTime( 0, time+release )
    }
    function stop(){
        osc.stop()
    }
    return { noteOn, noteOff, output : gain, stop }
}
function MultiChannelSynth( ac, channelCount ){
    const gain = ac.createGain()
    gain.gain.value = 1.0
    
    const monoSynths = new Array( channelCount ).fill(0).map( () => {
        const sinusMonoSynth = SinusMonoSynth(ac)
        sinusMonoSynth.output.connect( gain )
        return sinusMonoSynth
    })
    function getMonoSynth( channel ){
        const monoSynth = monoSynths[ channel ]
        if ( !monoSynth )  throw new Error( 'no channel '+ channel)
        return monoSynth
    }
    function noteOn( p ){
        getMonoSynth( p.channel ).noteOn( p )
    }
    function noteOff( p ){
        getMonoSynth( p.channel ).noteOff( p )
    }
    function stop(){
        monoSynths.forEach( monoSynth => monoSynth.stop() )
    }
    return { noteOn, noteOff, output : gain, stop }
}

function RythmPattern( divisions, seed ){

    const rng = seedrandom( seed )

    const events = []
    let playing = false
    for ( let i = 0 ; i < divisions.length ; i++ ){
        const played = rng() < divisions[i]
        if ( played ){
            if ( playing ){
                events[ events.length - 1 ].end = i + 1
            } else {
                events.push( { start : i, end : i + 1} )
            }
        }
        playing = played
    }
    let lastTime = 0
    return events.map( ({start,end}) => {
        const dt1 = start - lastTime
        const dt2 = end - start
        lastTime = end
        return { startDt : dt1, endDt : dt2 }
    })
    
}

export function LiveMusicComposer( musicSeed = '5' ){

    function setSeed( seed  ){
        musicSeed = seed
    }
    let fragIdx = 0

    const k0 = 48
    let k = k0,
        keyTarget = k,
        keyTargets = []
    
    function transpose( keyOffset ){
        keyTarget = k0 + ( keyTarget + keyOffset ) % 12        
        keyTargets.push( keyTarget )
    }
    let concludes = false
    let wantsConclusion = false
    function conclusion( _conclude ){
        wantsConclusion = _conclude
    }

    let timeSignature
    setTimeSignature( 4 )
    function setTimeSignature( num ){
        timeSignature = {
            start : fragIdx,
            num,
        }
    }
    function measureInfo(){
        const { start, num } = timeSignature
        const beat = fragIdx - start
        const measureNum  = Math.floor( beat / num )
        const beatNum = beat % num
        return { measureNum, beatNum }
    }
    
    // tempo
    let tempo = 60
    let tempoTarget = tempo
    function setUrgency( remain, total ){
        const lowTempo = 60,
              highTempo = 120
        const r = clamp( remain / total, 0, 1 )
        let tempo = lerp( highTempo, lowTempo, r )
        setTempo( tempo )
    }
    function setTempo( _tempo ){
        tempoTarget = _tempo
    }
    function lerpTempo(){
        const maxTempoChange = 2
        if ( tempo !== tempoTarget ){
            const middle = lerp( tempo, tempoTarget, 0.6 )
            if ( Math.abs( middle - tempoTarget ) <= 1 ){
                tempo = tempoTarget
            } else {
                const diff = middle - tempo
                const adiff = Math.abs( diff ),
                      sdiff = Math.sign( diff )
                const cadiff = Math.min( adiff, maxTempoChange )
                const cdiff = sdiff * cadiff
                tempo += cdiff
            }            
        }
    }
    function generateSome( partitionTime, needed ){

        const { measureNum, beatNum } = measureInfo()
        lerpTempo()

        if ( wantsConclusion ){
            if ( beatNum === 0 ){
                concludes = true
            } 
        } else {
            if ( beatNum === 0 ){
                concludes = false
            } 
        }
        if ( concludes ){
            keyTargets.length = 0
        } else {
            if ( keyTargets.length && ( beatNum === 0 ) ){
                k = keyTargets.shift()
            }
        }
        //console.log('needed',needed)
        // console.log(fragIdx, measureInfo(), { tempo, tempoTarget } )
        
        let nbeats = 3,
            duration =  60/tempo / nbeats,
            pause = duration * 0.90,
            played = duration - pause

        const attack = 0.001,
              release = 0.1,
              velocity = 0.5

        let chordSequence
        if ( concludes ){
            chordSequence = [
                [ 7 , 12+2 , 12+11 ],
                [ 0 , 12+4 , 12+12 ],
            ]
        } else {
            chordSequence = [
                [ 0 , 0+12+4 , 0+12+10 ],
                [ 0-7 , 0+12 , 0+12+8 ]
            ]
        }
        
        
        const chordSequenceIdx = fragIdx%chordSequence.length
        const chord = chordSequence[ chordSequenceIdx ]       
        const [f1,f2,f3] = chord.map( ck => ktof( k + ck ) )
        /*for ( let i = 0 ; i < 10 ; i++ ){
            console.log( i,...RythmPattern([1,0.5,1,0.5]),i)
        }
        */
        const pat1 = RythmPattern([1.0,1,1.0],musicSeed+'21'+beatNum)
        const pat2 = RythmPattern([1,0.5,0.3],musicSeed+'22'+beatNum)
        const pat3 = RythmPattern([1,0.5,0.3],musicSeed+'33'+beatNum)
        const pat4 = RythmPattern([0,0.5,0.0],musicSeed+'44'+beatNum) // urgency
        // console.log( pat1, pat2, pat3 )
        fragIdx++

        const ones = [[pat1,f1,0],[pat2,f2,1],[pat3,f3,2],[pat4,f3*2,3]].map( ([pat,f,channel]) => {
            
            const one = pat.flatMap( ({startDt,endDt}) => {
                let onDt = startDt * duration,
                    offDt = endDt * duration - pause
                return [
                    { dt : onDt, channel, eventType : 'noteOn', frequency : f, velocity, attack } ,
                    { dt : offDt, channel, eventType : 'noteOff', frequency : f, velocity, release } ,
                    { dt : pause },
                ]
            })
            return one
        })
        return oneToZero( ones )
        /*
        
        return oneToZero([
            [            
                { dt : 0, channel : 1, eventType : 'noteOn', frequency : f1, velocity, attack } ,
                { dt : played },
                { dt : 0, channel : 1, eventType : 'noteOff', frequency : f1, velocity, release } ,
                { dt : pause },
                { dt : 0, channel : 1, eventType : 'noteOn', frequency : f1, velocity, attack } ,
                { dt : played },
                { dt : 0, channel : 1, eventType : 'noteOff', frequency : f1, velocity, release } ,
                { dt : pause },

            ],
            [            
                { dt : 0, channel : 0, eventType : 'noteOn', frequency : f1, velocity, attack } ,
                { dt : played, channel : 0, eventType : 'noteOff', frequency : f1, velocity, release } ,
                { dt : pause },
                { dt : 0, channel : 0, eventType : 'noteOn', frequency : f2, velocity, attack } ,
                { dt : played, channel : 0, eventType : 'noteOff', frequency : f2, velocity, release } ,
                { dt : pause },
                { dt : 0, channel : 0, eventType : 'noteOn', frequency : f3, velocity, attack } ,
                { dt : played, channel : 0, eventType : 'noteOff', frequency : f3, velocity, release } ,
                { dt : pause },
            ],
        ])
        */
        /*const mkFrags = k => ([
             [ktof( k ),ktof( k+12+4 ),ktof( k+12+10 )],
             [ktof( k-7 ),ktof( k+12 ),ktof( k+12+8 )],
             ])        */
                                      
        
        // // if ( conclude ){
            
        // // }
        
        // // if ( keyTargets.length === 0 ){
        // // } else if ( keyTargets.length === 1 ) {
        // //     if ( (fragIdx % frags.length) === 0 ){
        // //         k = keyTargets.shift() 
        // //     }
        // // } else {
        // //     k = keyTargets.shift() 
        // // }
        
        // tempo = tempoTarget
        
        // let duration =  1,//60/tempo,
        //     pause = duration * 0.90,
        //     played = duration - pause

        // const attack = 0.01,
        //       release = 0.1,
        //       velocity = 0.5

        // fragIdx++

        // return oneToZero([
        //     [            
        //         { dt : 0, channel : 0, eventType : 'noteOn', frequency : f1, velocity, attack } ,
        //         { dt : played, channel : 0, eventType : 'noteOff', frequency : f1, velocity, release } ,
        //         { dt : pause }
        //     ],
        //     [            
        //         { dt : 0, channel : 1, eventType : 'noteOn', frequency : f2, velocity, attack } ,
        //         { dt : played+pause, channel : 1, eventType : 'noteOff', frequency : f2, velocity, release } ,
        //         { dt : pause }
        //     ],
        //     [            
        //         { dt : 0, channel : 2, eventType : 'noteOn', frequency : f3, velocity, attack } ,
        //         { dt : played/2, channel : 2, eventType : 'noteOff', frequency : f3, velocity, release } ,
        //         { dt : pause },
        //         { dt : 0, channel : 2, eventType : 'noteOn', frequency : f3, velocity, attack } ,
        //         { dt : played/2, channel : 2, eventType : 'noteOff', frequency : f3, velocity, release } ,
        //         { dt : pause },
        //     ],
            
        // ])
    }    
    return { generateSome, transpose, setSeed, setTempo, conclusion, setUrgency }
}
function oneToZero( ones ){

    // add absolute time for each channel
    const absolute = ones.flatMap( one => {
        let t = 0
        return one.map( event => {
            const { dt } = event
            t += dt
            return [ t, event ]
        })        
    })
    absolute.sort( (a,b) => {
        const [ta,eventa] = a
        const [tb,eventb] = b
        if ( ta !== tb ){
            // sort by time
            return ta - tb
        } else {
            // and channel
            return eventa.channel - eventb.channel
        }
    })
    let lastTime = 0
    const zero = absolute.map( ([time,event]) => {
        const dt = time - lastTime        
        lastTime = time
        return { ...event, dt }
    })
    return zero
}


// export function LiveMusicComposer2( ){
//     const k0 = 48
//     let k = k0
//     let tempo
//     function transpose( keyOffset ){
//         k = k0 + ( k + keyOffset ) % 12
//     }
//     function setTempo( _tempo ){
//         tempo = _tempo
//     }
//     let fragIdx = 0
//     function generateSome( partitionTime, needed ){
//         //console.log('needed',needed)
//         const mkFrags = k => ([
//             [ktof( k ),ktof( k+12+4 ),ktof( k+12+10 )],
//             [ktof( k-7 ),ktof( k+12 ),ktof( k+12+8 )],
//         ])
//         const frags = mkFrags( k )
//         const [f1,f2,f3] = frags[ fragIdx%frags.length ]
        
//         let duration =  60/tempo,
//             pause = duration * 0.90,
//             played = duration - pause

//         const attack = 0.01,
//               release = 0.1,
//               velocity = 0.5

//         fragIdx++

//         return [            
//             { dt : 0, channel : 0, eventType : 'noteOn', frequency : f1, velocity, attack } ,
//             { dt : 0, channel : 1, eventType : 'noteOn', frequency : f2, velocity, attack } ,
//             { dt : 0, channel : 2, eventType : 'noteOn', frequency : f3, velocity, attack } ,
//             { dt : played, channel : 0, eventType : 'noteOff', frequency : f1, velocity, release } ,
//             { dt : 0, channel : 1, eventType : 'noteOff', frequency : f2, velocity, release } ,
//             { dt : 0, channel : 2, eventType : 'noteOff', frequency : f3, velocity, release } ,
//             { dt : pause }
//         ]
//     }    
//     return { generateSome, transpose, setTempo }
// }
export function Music( composer ){
    

    function setupSynth(ac){
        //const safeOutput = SafeOutput( ac )
        //safeOutput.output.gain.value = 1
        //safeOutput.output.connect( ac.destination )

        /*
        const sinusMonoSynth = SinusMonoSynth(ac)
        sinusMonoSynth.output.connect( safeOutput.input )
        return sinusMonoSynth
        */
        const multiChannelSynth = MultiChannelSynth( ac, 4 )
        //multiChannelSynth.output.connect( safeOutput.input )
        return multiChannelSynth
    }
    
    function run( ac, generateSome, synth ){
        
        const { noteOn, noteOff } = synth

        const LATENCY = 0.3,
              INTERVAL = 1/20

        const livePartition = {
            duration : 0, // partition time
        }
        
        function sequence( acTime, duration ){

            // todo : remove ?
            if ( duration === 0 ) return
            
            const partitionTime = livePartition.duration
            const stopCap = partitionTime + duration

            let iidt = 0
            // call generateSome until enough duration is generated
            while ( livePartition.duration < stopCap ){

                const remain = stopCap - livePartition.duration
                const events = generateSome( livePartition.duration, remain ) // remain time is indicative
                let idt = 0
                while ( events.length ){

                    const event = events.shift()
                    const { dt, eventType } = event
                    // console.log(dt,eventType,event)
                    // accum events time
                    idt += dt

                    // accum sequence time
                    iidt += dt

                    // generate webaudio parameters curves (in ac time)
                    if ( eventType === 'noteOn' ){
                        noteOn( { time : acTime + iidt, ...event } )
                    } else if ( eventType === 'noteOff' ){
                        noteOff( { time : acTime + iidt, ...event } )
                    }
                }
                // update partition time
                livePartition.duration += idt
            }
            // return ac time
            return acTime + iidt
        }

        
        let plannedUntil = 0 // in ac time
        setInterval( () => {
            
            const acTime = ac.currentTime

            // plan LATENCY ahead
            const left = acTime + LATENCY
            const right = acTime + 2 * LATENCY
            
            // trim time segment to unplanned
            const rLeft = Math.max( left, plannedUntil )
            const rRight = Math.max( right, plannedUntil )

            // do not call for zero length
            if ( rLeft === rRight )
                return 

            // sequence returns its end in ac time
            plannedUntil = sequence( rLeft, rRight - rLeft )
            
        },  1000 * INTERVAL )
        
    }

    function start( ac  ){
//        const ac = await getAudioContext()
        const synth = setupSynth(ac)
        run( ac, composer.generateSome, synth )
        return synth
    }
    
    return {
        start
    }
}
   

        
