// MyWorkletNode.js
export default class MyWorkletNode extends AudioWorkletNode {
   constructor(context) {
    super(context, 'my-worklet-processor')
    console.log(this.channelCount)
  }
}
