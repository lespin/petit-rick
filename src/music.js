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
function VoiceAllocator( nvoices ){
    const voices = new Array(nvoices).fill(0).map( (_,idx) => ({
        idx,
        end : -1
    }))
    function event( start, end ){

        // get unallocated voice
        let voiceIdx = voices.findIndex( v => v.end < start )

        // if none, take first (~oldest)
        if ( voiceIdx < 0 ){
            voiceIdx = 0
        } 
        const voice = voices[ voiceIdx ]

        // remove        
        voices.splice( voiceIdx, 1 )

        // put at end
        voices.push({ ...voice, end } )

        return voice
        
    }
    return { event }
}
/*
const voiceAllocator = VoiceAllocator( 4 )
console.log(voiceAllocator.event(0,2))
console.log(voiceAllocator.event(0,0.99))
console.log(voiceAllocator.event(0,0.5))
console.log(voiceAllocator.event(0,2))
console.log(voiceAllocator.event(1,2))
console.log(voiceAllocator.event(0.51,2))
*/

console.log('voiceAllocator',voiceAllocator)

function SinusMonoSynth(ac){
    
    const osc = ac.createOscillator(),
          gain = ac.createGain()
    
    osc.frequency.value = 220
    gain.gain.value = 0
    osc.connect( gain )
    osc.start()
    
    function noteOn( time, frequency, volume, attack ){
        osc.frequency.linearRampToValueAtTime( frequency, time )
        gain.gain.cancelScheduledValues( time )
        gain.gain.linearRampToValueAtTime( 0, time )
        gain.gain.linearRampToValueAtTime( volume, time + attack )
    }
    function noteOff( time, frequency, volume, release = 1/44100 ){
        osc.frequency.linearRampToValueAtTime( frequency, time )
        gain.gain.linearRampToValueAtTime( volume, time)
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
        const f = ktof( k )
        return [
            [ 0, 'noteOn', f, 0.5, 0.01 ],
            [ tempo/3, 'noteOff', f, 0.4, 0.5 ],
            [ 0, 'noteOn', f, 0.5, 0.01 ],
            [ tempo/3, 'noteOff', f, 0.4, 0.5 ],
            [ 0, 'noteOn', f*1.5, 0.5, 0.01 ],
            [ tempo/3, 'noteOff', f, 0.4, 0.5 ]
        ]
    }    
    return { generateSome, transpose, setTempo }
}
export function Music( composer ){
    

    function setupSynth(ac){
        const safeOutput = SafeOutput( ac )
        safeOutput.output.gain.value = 1
        safeOutput.output.connect( ac.destination )

        const sinusMonoSynth = SinusMonoSynth(ac)
        
        sinusMonoSynth.output.connect( safeOutput.input )
        return sinusMonoSynth
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
                    const [ dt, eventType ] = event

                    // accum events time
                    idt += dt

                    // accum sequence time
                    iidt += dt

                    // generate webaudio parameters curves (in ac time)
                    if ( eventType === 'noteOn' ){
                        const [_,__,f,v,a] = event
                        noteOn( acTime + iidt, f, v, a )
                    } else if ( eventType === 'noteOff' ){
                        const [_,__,f,v,r] = event
                        noteOff( acTime + iidt, f, v, r )
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

