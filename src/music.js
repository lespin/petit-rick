import { getAudioContext } from './lib/audio.js'
import { SafeOutput } from './lib/safeoutput.js'
import { ktof } from './lib/frequencies.js'
var seedrandom = require('seedrandom');
var rng = seedrandom('muz-1');

// function RingBuffer( buffer ){
//     const widx = 0,
//           length = 0
//     function push( v ){
//         buffer[ widx ] = v
//         widx = ( widx + 1 ) % buffer.length
//         length = Math.max( length, widx + 1 )
//     }
//     return { push }
// }
// function VoiceAllocator( nvoices ){
//     const voices = new Array(nvoices).fill(0).map( (_,idx) => ({
//         idx,
//         end : -1
//     }))
//     function event( start, end ){

//         // get unallocated voice
//         let voiceIdx = voices.findIndex( v => v.end < start )

//         // if none, take first (~oldest)
//         if ( voiceIdx < 0 ){
//             voiceIdx = 0
//         } 
//         const voice = voices[ voiceIdx ]

//         // remove        
//         voices.splice( voiceIdx, 1 )

//         // put at end
//         voices.push({ ...voice, end } )

//         return voice
        
//     }
//     return { event }
// }
// /*
// const voiceAllocator = VoiceAllocator( 4 )
// console.log(voiceAllocator.event(0,2))
// console.log(voiceAllocator.event(0,0.99))
// console.log(voiceAllocator.event(0,0.5))
// console.log(voiceAllocator.event(0,2))
// console.log(voiceAllocator.event(1,2))
// console.log(voiceAllocator.event(0.51,2))
// //console.log('voiceAllocator',voiceAllocator)
// */
// function SinusPolySynth( ac, polyphony ){
    
//     const gain = ac.createGain()
//     gain.gain.value = 1.0

//     const voiceAllocator = VoiceAllocator( polyphony )
//     const monoSynths = new Array( polyphony ).fill(0).map( () => {
//         const sinusMonoSynth = SinusMonoSynth(ac)
//         sinusMonoSynth.output.connect( gain )
//         return sinusMonoSynth
//     })
//     function noteOn(){
        
//     }
//     function stop(){
//         monoSynths.forEach( monoSynth => monoSynth.stop() )
//     }
//     return { noteOn, noteOff, output : gain, stop }
    
// }
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
function SinusMonoSynth(ac){
    
    const osc = ac.createOscillator(),
          gain = ac.createGain()
    
    osc.frequency.value = 220
    gain.gain.value = 0
    osc.connect( gain )
    osc.start()
    
    function noteOn( { time, frequency, velocity, attack } ){
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
export function LiveMusicComposer( ){
    const k0 = 48
    let k = k0
    let tempo 
    function transpose( keyOffset ){
        k = k0 + ( k + keyOffset ) % 12
    }
    function setTempo( _tempo ){
        tempo = _tempo
    }
    function generateSome( partitionTime, needed ){
        console.log('needed',needed)
        const f1 = ktof( k ),
              f2 = ktof( k+3 ),
              f3 = ktof( k+7 )
        let duration =  60/tempo/3,
            pause = duration * 0.90,
            played = duration - pause

        const attack = 0.1,
              release = 0.1,
              velocity = 0.5
        
        return [            
            { dt : 0, channel : 0, eventType : 'noteOn', frequency : f1, velocity, attack } ,
            { dt : 0, channel : 1, eventType : 'noteOn', frequency : f1*1.5, velocity, attack } ,
            { dt : 0, channel : 2, eventType : 'noteOn', frequency : f1*2, velocity, attack } ,
            
            { dt : played, channel : 0, eventType : 'noteOff', frequency : f1, velocity, release } ,
            { dt : 0, channel : 2, eventType : 'noteOff', frequency : f1*2, velocity, release } ,

            { dt : pause, channel : 0, eventType : 'noteOn', frequency : f2, velocity, attack } ,
            { dt : played, channel : 0, eventType : 'noteOff', frequency : f2, velocity, release } ,
            
            { dt : 0, channel : 1, eventType : 'noteOff', frequency : f1*1.5, velocity, release } ,
            
            { dt : pause }
            
        ]
    }    
    return { generateSome, transpose, setTempo }
}
export function Music( composer ){
    

    function setupSynth(ac){
        const safeOutput = SafeOutput( ac )
        safeOutput.output.gain.value = 1
        safeOutput.output.connect( ac.destination )

        /*
        const sinusMonoSynth = SinusMonoSynth(ac)
        sinusMonoSynth.output.connect( safeOutput.input )
        return sinusMonoSynth
        */
        const multiChannelSynth = MultiChannelSynth( ac, 4 )
        multiChannelSynth.output.connect( safeOutput.input )
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
                    console.log(dt,eventType,event)
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

    async function start( ){
        const ac = await getAudioContext()
        const synth = setupSynth(ac)
        run( ac, composer.generateSome, synth )
        return { ac, synth, composer }
    }
    
    return {
        start
    }
}
        /*  
      let partIdx = 0

        const notes = [0,4,7,11,12].map( x => x + 48 )
        let musicTick = 0,
            tickLength = 0.5

        let _t = 0
        const part = notes.flatMap( (key,i) => {
            const duration = (i%2)?2:1,
                  volume = 1
            const events = [
                { time : _t , type : 'noteOn', key, volume },
              //  { time : _t+duration, type : 'noteOff', key, volume }
            ]
            _t += duration
            return events
        })
        console.log(part)
        */

