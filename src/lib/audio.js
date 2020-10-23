
export function getAudioContext(){
    return new Promise( (accept, reject ) => {
        const ac = new AudioContext()
        function unsuspend(){
            if ( ac.state == 'running' ){
                accept( ac )
            } else {
                ac.resume()
                setTimeout( unsuspend, 1000 )
            }
        }
        unsuspend()
    })
}
/*export async function getAudioContext(){
    const ac = new AudioContext()
    await ac.resume()
    return ac
}*/
function ParametricEnvelope( e ){
    const { attack, decay, sustain, release,  hold, delay } = e
    return [ attack, decay, sustain, release, hold || 0, delay || 0 ]    
}
function AudioParameterEnvelope( gainGain, envelope ){
    // https://upload.wikimedia.org/wikipedia/commons/5/58/ADSR_envelope.png
    const ramp = gainGain.linearRampToValueAtTime.bind( gainGain )
    const [ attack, decay, sustain, release, hold, delay ] = envelope
    const onParams = [
        [ 0, 0 ],
        [ 0, delay ],
        [ 1, delay + attack ],
        [ 1, delay + attack + hold ],
        [ sustain, delay + attack + hold + decay ],
    ]
    function noteOn( time, velocity ){
        onParams.forEach( ([ pg, pt ]) => {
            const v = velocity * pg,
                  t = time + pt
            console.log('v',v,'t',t)
            ramp( v, t )
        })
    }
    function noteOff( time, velocity ){
        ramp( sustain * velocity, time ),
        ramp( 0, time + release )
    }
    return { noteOn, noteOff }
}

function ms( ms ){
    return ms / 1000
}
import { ftok, ktof } from './frequencies.js'
import { SafeOutput } from './safeoutput.js'


//console.log('LinearScaler',LinearScaler)
// import MyWorkletProcessor from './MyWorkletProcessor.js'
// import MyWorkletNode from './MyWorkletNode.js'
if ( false )
getAudioContext().then( async ac => {

    /*
    try {
        await context.audioWorklet.addModule(MyWorkletProcessor)
        myWorkletNode = new MyWorkletNode(context)
        // or if no custom node
        // myWorkletNode = new AudioWorkletNode(context, 'my-worklet-processor') 
    } catch (error) {
        console.error(error)
    }
    */
    //console.log('ii',uu)
    //    const vibrato = new AudioWorkletNode( ac, 'linear-scaler' )
    
    const safeOutput = SafeOutput( ac )
    
    const osc = ac.createOscillator(),
          adsrGain = ac.createGain(),
          
          tremoloOsc = ac.createOscillator(),
          tremoloGain = ac.createGain()

    
    osc.frequency.value = 200
    adsrGain.gain.value = 0
    
    tremoloOsc.frequency.value = 2 
    tremoloOsc.connect( tremoloGain )  

    tremoloGain.gain.value = 1

    
    safeOutput.output.gain.value = 1    

    // connect
    osc.connect( adsrGain ).connect( tremoloGain ).connect( safeOutput.input )    
    safeOutput.output.connect( ac.destination )
    
    
    osc.start()
    
    const t = ac.currentTime
    console.log(t)
    const adsr = ParametricEnvelope({
        attack : 1,
        decay : 1,
        sustain : 0.5,
        release : 1,
    })
    console.log('adsr',adsr)
    const ape = AudioParameterEnvelope( adsrGain.gain, adsr )
    let t0 = t + 0.5
    ape.noteOn( t0, 1 )
    ape.noteOff( t0+5, 1 )
    
    
})
