<template>
  <div id="app">
    <button type="button" @click="range = [-12, 24]">range = [-12, 24]</button>
    <button type="button" @click="space = 20">space = 20</button>
    <button type="button" @click="now = new Date().getTime() + 86400000">一天以后</button>
    <button type="button" @click="pause = !pause"> 播放 ：{{ !pause }} </button>
    <div class="current-time">{{ currentTime }}</div>
    <timeline
      class="timeline-wrapper"
      :now="now"
      :range="range"
      :space="space"
      :pause.sync="pause"
      :theme="'dark'"
      datePicker
      @current-time="handleCurrentTime"
      @first-time="handleFirstTime"
      @last-time="handleLastTime"></timeline>
  </div>
</template>

<script>
  import moment from 'moment';
  import timeline from './components/timeline/timeline';

  export default {
    name: 'app',
    components: {
      timeline
    },
    data () {
      return {
        now: new Date().getTime(),
        range: [-24, 0],
        space: 10,
        pause: true,
        currentTime: 0
      };
    },
    methods: {
      handleCurrentTime (item) {
        this.currentTime = moment(item).format('YYYY-MM-DD HH:mm');
      },
      handleFirstTime (item) {
        console.log('handleFirstTime in App.vue', item);
      },
      handleLastTime (item) {
        console.log('handleLastTime in App.vue', item);
      }
    }
  };
</script>

<style lang="stylus">
  // @import './components/timeline/css/tooltip';
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
