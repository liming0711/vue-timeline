<template>
  <div id="app">
    <button @click="pause = !pause"> 播放 ：{{ !pause }} </button>
    <timeline class="timeline-wrapper" :now="now" :range="range" :space="space" :pause.sync="pause" :theme="'dark'"></timeline>
  </div>
</template>

<script>
  import timeline from './components/timeline/timeline';

  export default {
    name: 'app',
    components: {
      timeline
    },
    data () {
      return {
        now: new Date().getTime(),
        range: [0, 18],
        space: 10,
        pause: true
      };
    }
  };
</script>

<style lang="stylus">
  #app
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;

  .timeline-wrapper
    position: absolute;
    bottom: 0;
    left: 100px;
    right: 100px;
</style>
