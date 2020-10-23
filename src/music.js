import { getAudioContext } from './lib/audio.js'
import { SafeOutput } from './lib/safeoutput.js'
import { ktof } from './lib/frequencies.js'
var seedrandom = require('seedrandom');
var rng = seedrandom('muz-1');

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

export function LiveMusicComposer(){
    function generateSome( partitionTime, needed ){
        //const time = livePartition.duration
        //const lastTempo = livePartition.tempo[ livePartition.tempo.length - 1 ]
        //console.log('needed',needed,'@',time,lastTempo)
        //const lastMeasureStart = livePartition.timeSignature[ livePartition.timeSignature.length - 1 ]
        const f = 400  +Math.random()*50
        return [
            [ 0, 'noteOn', f, 0.5, 0.01 ],
            [ 0.4, 'noteOff', f, 0.4, 0.5 ],
            [ 0, 'noteOn', f, 0.5, 0.01 ],
            [ 0.2, 'noteOff', f, 0.4, 0.5 ],
            [ 0.2, 'noteOn', f*1.5, 0.5, 0.01 ],
            [ 0.2, 'noteOff', f, 0.4, 0.5 ]
        ]
    }    
    return { generateSome }
}
export function Music(){
    

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
            duration : 0,
            //measure : [],
            //tempo : [{ time : 0, tempo : 1 }], // 60 bpm
            //timeSignature : [{ time : 0, beats : 4 }] // 60 bpm
        }
        // function requestTempo( tempo ){
        //     livePartition.requestedTempo = tempo
        // }
        
        function sequence( acTime, duration ){

            // can remove ?
            if ( duration === 0 ) return
            
            const partitionTime = livePartition.duration
            const stopCap = partitionTime + duration

            let iidt = 0
            while ( livePartition.duration < stopCap ){

                // call generateSome until enough duration is generated
                const remain = stopCap - livePartition.duration
                const events = generateSome( livePartition.duration, remain ) // remain time is indicative
                let idt = 0
                while ( events.length ){
                    // unpile each generated event,
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

        
        let plannedUntil = 0
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

    function start( ){
        getAudioContext().then( async ac => {
            const synth = setupSynth(ac)
            const composer = LiveMusicComposer()
            run( ac, composer.generateSome, synth )
        })
    }
    
    return {
        start
    }
}
