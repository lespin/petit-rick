import { getAudioContext } from './lib/audio.js'
import { SafeOutput } from './lib/safeoutput.js'
import { ktof } from './lib/frequencies.js'
var seedrandom = require('seedrandom');
var rng = seedrandom('muz-1')
//const notes = [0,4,7,11,12].map( x => x + 48 )

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
    let fragIdx = 0
    function generateSome( partitionTime, needed ){
        //console.log('needed',needed)
        const mkFrags = k => ([
            [ktof( k ),ktof( k+12+4 ),ktof( k+12+10 )],
            [ktof( k-7 ),ktof( k+12 ),ktof( k+12+8 )],
        ])
        const frags = mkFrags( k )
        const [f1,f2,f3] = frags[ fragIdx%frags.length ]
        
        let duration =  60/tempo,
            pause = duration * 0.90,
            played = duration - pause

        const attack = 0.01,
              release = 0.1,
              velocity = 0.5

        fragIdx++

        return oneToZero([
            [            
                { dt : 0, channel : 0, eventType : 'noteOn', frequency : f1, velocity, attack } ,
                { dt : played, channel : 0, eventType : 'noteOff', frequency : f1, velocity, release } ,
                { dt : pause }
            ],
            [            
                { dt : 0, channel : 1, eventType : 'noteOn', frequency : f2, velocity, attack } ,
                { dt : played, channel : 1, eventType : 'noteOff', frequency : f2, velocity, release } ,
                { dt : pause }
            ],
            [            
                { dt : 0, channel : 2, eventType : 'noteOn', frequency : f3, velocity, attack } ,
                { dt : played/2, channel : 2, eventType : 'noteOff', frequency : f3, velocity, release } ,
                { dt : pause },
                { dt : 0, channel : 2, eventType : 'noteOn', frequency : f3, velocity, attack } ,
                { dt : played/2, channel : 2, eventType : 'noteOff', frequency : f3, velocity, release } ,
                { dt : pause },
            ],
            
        ])
    }    
    return { generateSome, transpose, setTempo }
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


export function LiveMusicComposer2( ){
    const k0 = 48
    let k = k0
    let tempo
    function transpose( keyOffset ){
        k = k0 + ( k + keyOffset ) % 12
    }
    function setTempo( _tempo ){
        tempo = _tempo
    }
    let fragIdx = 0
    function generateSome( partitionTime, needed ){
        //console.log('needed',needed)
        const mkFrags = k => ([
            [ktof( k ),ktof( k+12+4 ),ktof( k+12+10 )],
            [ktof( k-7 ),ktof( k+12 ),ktof( k+12+8 )],
        ])
        const frags = mkFrags( k )
        const [f1,f2,f3] = frags[ fragIdx%frags.length ]
        
        let duration =  60/tempo,
            pause = duration * 0.90,
            played = duration - pause

        const attack = 0.01,
              release = 0.1,
              velocity = 0.5

        fragIdx++

        return [            
            { dt : 0, channel : 0, eventType : 'noteOn', frequency : f1, velocity, attack } ,
            { dt : 0, channel : 1, eventType : 'noteOn', frequency : f2, velocity, attack } ,
            { dt : 0, channel : 2, eventType : 'noteOn', frequency : f3, velocity, attack } ,
            { dt : played, channel : 0, eventType : 'noteOff', frequency : f1, velocity, release } ,
            { dt : 0, channel : 1, eventType : 'noteOff', frequency : f2, velocity, release } ,
            { dt : 0, channel : 2, eventType : 'noteOff', frequency : f3, velocity, release } ,
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
   

        
