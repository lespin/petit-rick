class MyWorkletProcessor extends AudioWorkletProcessor {
    constructor() {
        super()
        this.port.postMessage('hello!')
    }

    process(inputs, outputs, parameters) {
      // audio processing code here.
      return true
    }
}
registerProcessor('my-worklet-processor', MyWorkletProcessor)
